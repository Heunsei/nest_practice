import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { join } from 'path';
import { POST_PUBLIC_IMAGE_PATH } from 'src/common/const/path.const';
import { BaseModel } from 'src/common/entity/base.entity';
import { ImageModel } from 'src/common/entity/image.entity';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { UsersModel } from 'src/users/entities/users.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

// 레포지토리 -> 데이터를 가져올 수 있는 브릿지 역할을 해주는 클래스
@Entity()
export class PostsModel extends BaseModel {
  // Users 모델과 연동. ( Foreign key )
  // not null
  // ManyToOne -> user과 어떤 값을 연동할 지 저장
  // 두번째 인자인 함수는
  // 유저 모델 입장에서, 현재 모델을 가져오려 할 때 어떤 프로퍼티로 들고올 수 있는가
  @ManyToOne(() => UsersModel, (user) => user.posts, {
    nullable: false,
  })
  author: UsersModel;

  @IsString({
    message: stringValidationMessage,
  })
  @Column()
  title: string;

  @IsString({
    message: stringValidationMessage,
  })
  @Column()
  content: string;

  // @Column({
  //   nullable: true,
  // })
  // @Transform(({ value }) => value && `/${join(POST_PUBLIC_IMAGE_PATH, value)}`)
  // image?: string;

  @Column()
  likeCount: number;

  @Column()
  commentCount: number;

  @OneToMany((type) => ImageModel, (image) => image.post)
  images: ImageModel[];
}
