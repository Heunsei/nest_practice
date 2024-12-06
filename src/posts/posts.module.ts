import { BadRequestException, Module } from '@nestjs/common';
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
import { MulterModule } from '@nestjs/platform-express';
import { extname } from 'path';
import * as multer from 'multer';
import { POST_IMAGE_PATH } from 'src/common/const/path.const';
import { v4 as uuid } from 'uuid';
@Module({
  // forFeature() -> 모델에 해당하는 레포지토리를 주입할 때.
  // forRoot() -> typeorm을 연결설정
  // 레포지토리는 모델을 다룰 수 있게 해주는 클래스.
  imports: [
    AuthModule,
    UsersModule,
    CommonModule,
    // 파일을 관리하기 위해 등록
    MulterModule.register({
      limits: {
        // 바이트 단위로 입력
        fileSize: 10000000,
      },
      fileFilter: (req, file, cb) => {
        /**
         * cb(err, boolean)
         *
         * 첫번째 파라미터에는 에러가 있을경우 넣어줌
         * 두번째 파라미터에는 파일을 받을지 말지 boolean을 넣어줌
         */
        // xxx.jpg -> jpg
        const ext = extname(file.originalname);

        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
          return cb(
            new BadRequestException('jph, jpeg, png 파일만 업로드 가능합니다'),
            false,
          );
        }

        return cb(null, true);
      },
      storage: multer.diskStorage({
        destination: function (req, res, cb) {
          cb(null, POST_IMAGE_PATH);
        },
        filename: function (req, file, cb) {
          cb(null, `${uuid()}${extname(file.originalname)}`);
        },
      }),
    }),
    JwtModule.register({}),
    TypeOrmModule.forFeature([PostsModel, UsersModel]),
  ],
  controllers: [PostsController],
  providers: [PostsService, AuthService, UsersService],
})
export class PostsModule {}
