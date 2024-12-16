import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersModel } from 'src/users/entity/users.entity';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register-user.dto';
import { ConfigService } from '@nestjs/config';
import {
  ENV_HASH_ROUNDS_KEY,
  ENV_JWT_SECRET,
} from 'src/common/const/env-keys.const';
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}
  /**
   * 토큰 사용 방식
   * 1. 사용자가 로그인 회원가입 진행 시 accesstoken / refreshtoken을 발급
   * 2. 로그인 할때는 Basic 토근과 함께 요청을 보낸다
   *  - Basic 토큰은 '이메일:비밀번호' Base64로 인코딩한 형태
   *  - { authorization: 'Basic {token}' }
   *  - Basic -> 일반적인 데이터를 보낼 때 ( Basic )
   * 3. 아무나 접근 할 수 없는 정보를 접근 할때는
   *  - accessToken 을 Header에 추가해서 요청과 함께 보낸다.
   *  - { authorization: 'Bearer {token}' }
   *  - Bearer -> 암호화된 데이터를 보낼 때 ( private )
   * 4. 토큰과 요청을 함께 받은 서버는 토큰 검증을 통해 현재 요청을 보낸 사용자를 식별가능.
   * 5. 모든 토큰은 만료기간이 존재, 만료기간이 지나면 새로 토큰을 발급받아야한다.
   *  - jwtService.verity()에서 인증이 통과 안됨.
   */

  /**
   * 헤더로부터 토큰을 받을 때 토큰 분리 로직.
   * Basic -> 로그인 시 이메일:비밀번호 형태로 인코딩한 형태
   * Bearer -> 발급받은 토큰을 그대로 넣었을 때.
   */
  extractTokenFromHeader(header: string, isBearer: boolean) {
    const splitToken = header.split(' ');
    const prefix = isBearer ? 'Bearer' : 'Basic';
    if (splitToken.length !== 2 || splitToken[0] !== prefix) {
      throw new UnauthorizedException('잘못된 토큰입니다');
    }
    const token = splitToken[1];
    return token;
  }
  // 받아온 basic token을 변환해서 이메일과 비밀번호를 반환.
  decodeBasicToken(base64String: string) {
    const decoded = Buffer.from(base64String, 'base64').toString('utf8');
    const split = decoded.split(':');
    if (split.length !== 2) {
      throw new UnauthorizedException();
    }
    const email = split[0];
    const password = split[1];
    return {
      email,
      password,
    };
  }
  // 토큰 검증 로직
  verifyToken(token: string) {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>(ENV_JWT_SECRET),
    });
  }

  rotateToken(token: string, isRefreshToken: boolean) {
    const decoded = this.jwtService.verify(token, {
      secret: this.configService.get<string>(ENV_JWT_SECRET),
    });
    // 새 토큰 받을 때는 refresh 토큰으로만 반환
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException(
        '토큰 재발급은 refresh 토큰으로만 가능합니다',
      );
    }
    return this.signToken(
      {
        ...decoded,
      },
      isRefreshToken,
    );
  }

  /**
   * payload에 들어갈 정보
   * 1. email -> 개인정보라 넣기 싫으면 빼도 됨
   * 2. sub -> id ( 사용자의 id )
   * 3. type: access | refresh
   */
  signToken(user: Pick<UsersModel, 'email' | 'id'>, isRefreshToken: boolean) {
    const payload = {
      email: user.email,
      sub: user.id,
      type: isRefreshToken ? 'refresh' : 'access',
    };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>(ENV_JWT_SECRET),
      expiresIn: isRefreshToken ? 3600 : 300,
    });
  }

  loginUser(user: Pick<UsersModel, 'email' | 'id'>) {
    return {
      accessToken: this.signToken(user, false),
      refreshToken: this.signToken(user, true),
    };
  }

  async authenticateWithEmailAndPassword(
    user: Pick<UsersModel, 'email' | 'password'>,
  ) {
    const existingUser = await this.usersService.getUserByEmail(user.email);
    if (!existingUser) {
      throw new UnauthorizedException('존재하지 않는 사용자 입니다');
    }
    /**
     * 파라미터
     * 입력 비밀번호
     * 기존 해시 -> 저장되어 있는 해시
     */
    const passOk = await bcrypt.compare(user.password, existingUser.password);
    if (!passOk) {
      throw new UnauthorizedException('비밀번호가 틀립니다');
    }
    return existingUser;
  }

  async loginWithEmail(user: Pick<UsersModel, 'email' | 'password'>) {
    const existingUser = await this.authenticateWithEmailAndPassword(user);

    return this.loginUser(existingUser);
  }

  async registerWithEmail(user: RegisterUserDto) {
    const hash = await bcrypt.hash(
      user.password,
      parseInt(this.configService.get<string>(ENV_HASH_ROUNDS_KEY)),
    );
    const newUser = await this.usersService.createUser({
      ...user,
      password: hash,
    });
    return this.loginUser(newUser);
  }
}
