import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UsersService } from 'src/users/users.service';

// 토큰 검증 시 필요한 것

@Injectable()
export class BearerTokenGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const rawToken = req.headers['authorization'];
    if (!rawToken) {
      throw new UnauthorizedException('토큰이 존재하지 않습니다');
    }
    const token = this.authService.extractTokenFromHeader(rawToken, true);
    const res = this.authService.verifyToken(token);
    // token안 페이로드를 req객체에 전달
    /**
     * 1. 사용자 정보
     * 2. 토큰
     * 3. 토큰 타입
     */
    const user = await this.usersService.getUserByEmail(res.email);
    req.token = token;
    req.tokenType = res.type;
    req.user = user;
    return true;
  }
}

@Injectable()
export class AccessTokenGuard extends BearerTokenGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const req = context.switchToHttp().getRequest();

    if (req.tokenType !== 'access') {
      throw new UnauthorizedException('access token 이 아닙니다');
    }
    return true;
  }
}

@Injectable()
export class RefreshTokenGuard extends BearerTokenGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const req = context.switchToHttp().getRequest();

    if (req.tokenType !== 'refresh') {
      throw new UnauthorizedException('refresh token 이 아닙니다');
    }
    return true;
  }
}
