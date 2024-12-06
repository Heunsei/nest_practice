import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // pagenate dto를 컨트롤러에 넣으면
  // class validator / transformer를 통해 dto 생성
  // 쿼리에 값을 넣은 적이 없다면, 넣지 않은값을 그대로 반환
  // 값을 넣지 않더라도 기본으로 넣은 데이터를 통해 dto를 생성하기를 원해
  // 디폴트 값들을 써서 dto를 사용해도 된다 라는 옵션.
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      // 데코레이터 없는데이터 안받음
      whitelist: true,
      // 스트리핑 하는 대신 에러 던짐
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
