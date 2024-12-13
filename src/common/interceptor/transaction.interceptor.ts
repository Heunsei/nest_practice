import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, tap } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    // 트랜잭션과 관련된 모든 쿼리를 담당할 쿼리 러너 생성
    const qr = this.dataSource.createQueryRunner();

    // 쿼리 러너에 연결
    await qr.connect();
    // 쿼리 러너에서 트랜잭션을 시작
    // 이 시점부터 같은 쿼리 러너를 사용하면
    // 트랜잭션 안에서 데이터베이서 액션을 실행 할 수 있다.

    await qr.startTransaction();

    // interceptor를 사용해서 로직을 실행할 때, 필요한 인자를 req에 넣어서 전달 가능.
    req.queryRunner = qr;

    return next.handle().pipe(
      catchError(async (e) => {
        await qr.rollbackTransaction();
        await qr.release();
        throw new InternalServerErrorException(e.message);
      }),
      tap(async () => {
        await qr.commitTransaction();
        await qr.release();
      }),
    );
  }
}
