import { CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';

export class SocketBearerTokenGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket = context.switchToWs().getClient();

    const headers = socket.handshake.headers;

    const rawToken = headers['authorization'];

    if (!rawToken) {
      throw new WsException('토큰이 없습니다');
    }
    try {
      const token = this.authService.extractTokenFromHeader(rawToken, true);
      console.log('test');
      const payload = this.authService.verifyToken(token);
      const user = await this.userService.getUserByEmail(payload.email);
      // 소켓에 데이터 넘겨 주는 법.
      socket.user = user;
      socket.token = token;
      socket.tokenType = payload.tokenType;
      return true;
    } catch (e) {
      throw new WsException('토큰이 유효하지 않습니다.');
    }
  }
}
