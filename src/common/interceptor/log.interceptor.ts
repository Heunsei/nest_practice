import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable, tap } from 'rxjs';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const now = new Date();

    /**
     * 요청이 들어온 타임 스탬프를 기록
     * [REQ] { path } { 요청 시간 }
     *
     * 요청이 끝날 때 다시 타임 스탬프를 기록
     * [RES] { path } { 응답 시간 }
     */
    const req = context.switchToHttp().getRequest();

    const path = req.originalUrl;

    // console.log(`[REQ] ${path} ${now.toLocaleString('kr')}`);

    // 이 위까지 컨트롤러의 함수가 실행되기 전에( 함수의 로직이 실행되기 전 )
    // 요청이 들어오자 마자 실행되는 부분.
    // 이 아래부터 return next.handle() 이후
    // 라우트의 로직이 전부 실행되고 응답이 반환됨.
    // handle 실행 시 response 반환(observable)
    return next.handle().pipe(
      // tap -> 모니터링 함수
      tap((observable) => {
        console.log(
          `[RES] ${path} ${new Date().toLocaleString('kr')} ${new Date().getMilliseconds() - now.getMilliseconds()}`,
        );
      }),
      // 결과 반환값을 변형해주는 함수.
      map((observable) => {
        return {
          message: 'hello',
          response: observable,
        };
      }),
    );
  }
}
