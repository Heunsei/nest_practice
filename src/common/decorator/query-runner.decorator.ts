import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

export const QueryRunner = createParamDecorator(
  (data, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();

    if (!req.queryRunner) {
      throw new InternalServerErrorException(
        `QueryRunner Decorator의 사용을 위해서 TransactionInterceptor를 적용해야 합니다`,
      );
    }
    return req.queryRunner;
  },
);
