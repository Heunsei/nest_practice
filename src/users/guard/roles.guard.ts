import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    /**
     * Roles annotation에 대한 meatadata를 가져와야 함.
     * reflector
     * -> getAllAndOverride()
     */
    // roles annotation에 적힌 role 를 가져오는 작업 실행
    const requiredRole = this.reflector.getAllAndOverride(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // roles annotation 등록 x
    if (!requiredRole) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new UnauthorizedException(`토큰을 제공 해주세요`);
    }
    if (user.role !== requiredRole) {
      throw new ForbiddenException(
        `작업을 수행할 권한이 없습니다. ${requiredRole}이 필요합니다`,
      );
    }
    return true;
  }
}
