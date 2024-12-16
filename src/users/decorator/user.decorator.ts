import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersModel } from '../entity/users.entity';

// request에 들어있는 user 정보 중 입력받은 프로퍼티의 데이터를 반환
// TokenGuard 에 의해 이미 request에 유저의 정보가 담겨진 상태.
export const User = createParamDecorator(
  (data: keyof UsersModel | undefined, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    const user = req.user as UsersModel;
    // console.log('-------------------');
    // console.log(user);
    // console.log('-------------------');
    if (!user) {
      throw new InternalServerErrorException(
        'request에 유저 프로퍼티가 존재하지 않습니다',
      );
    }
    if (data) {
      return user[data];
    }
    return user;
  },
);
