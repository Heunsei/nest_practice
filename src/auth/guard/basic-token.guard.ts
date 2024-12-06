import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
/**
 * 구현 기능
 * 1) 요청 객체를 불러오고
 *   authorization header로 부터 토큰을 가져온다.
 * 2) authService.extractTokenFromHeader를 이용해 사용할 수 있는 형태 토큰 추출
 * 3) authService.decodeBasicToken 을 실행해
 *    이메일:패스워드를 분리 후 서버에 전송.
 * 4) 이메일, 패스워드를 이용해 사용자를 가져온다
 * 5) 찾아낸 사용자를 1 요청 객체에 붙여준다.
 * -> req.user= user
 */

// 요청 하나의 라이프사이클이 끝날때 까지 전달받은 객체를 사용
// req -> BasicTokenGuard를 적용할 end point에 요청이 들어왔을 때
// 해당 요청의 정보를 담고 있는 객체
@Injectable()
export class BasicTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const rawToken = req.headers['authorization'];
    if (!rawToken) {
      throw new UnauthorizedException('토큰이 없습니다');
    }

    const token = this.authService.extractTokenFromHeader(rawToken, false);
    const { email, password } = this.authService.decodeBasicToken(token);
    const user = await this.authService.authenticateWithEmailAndPassword({
      email,
      password,
    });
    req.user = user;
    return true;
  }
}
