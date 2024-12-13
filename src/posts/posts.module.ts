import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModel } from './entities/posts.entity';
import { UsersModel } from 'src/users/entities/users.entity';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { CommonModule } from 'src/common/common.module';
import { ImageModel } from 'src/common/entity/image.entity';
import { PostImageService } from './image/images.service';
import { LogMiddleware } from 'src/common/middleware/log.middleware';
@Module({
  // forFeature() -> 모델에 해당하는 레포지토리를 주입할 때.
  // forRoot() -> typeorm을 연결설정
  // 레포지토리는 모델을 다룰 수 있게 해주는 클래스.
  imports: [
    AuthModule,
    UsersModule,
    CommonModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([PostsModel, UsersModel, ImageModel]),
  ],
  controllers: [PostsController],
  providers: [PostsService, AuthService, UsersService, PostImageService],
})
export class PostsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogMiddleware).forRoutes({
      // 적용할 path
      path: 'posts*',
      method: RequestMethod.POST,
    });
  }
}
