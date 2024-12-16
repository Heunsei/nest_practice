import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseModel } from './base.entity';
import { IsEnum, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { join } from 'path';
import { POST_IMAGE_PATH, POST_PUBLIC_IMAGE_PATH } from '../const/path.const';
import { PostsModel } from 'src/posts/entitiy/posts.entity';

export enum ImageModelType {
  POST_IMAGE,
}
@Entity()
export class ImageModel extends BaseModel {
  // 사용자가 올린 사진의 순서
  @Column({
    default: 0,
  })
  @IsInt()
  @IsOptional()
  order: number;

  // UserModel -> 사용자 프로필 이미지
  // PostsModel -> 포스트 이미지
  @Column({
    enum: ImageModelType,
  })
  @IsEnum(ImageModelType)
  @IsString()
  type: ImageModelType;

  // obj -> 현재 객체( 이미지 모델 )가 인스턴스화 되었을 때, 그 객체를 받을 수 있음
  @Column()
  @IsString()
  @Transform(({ value, obj }) => {
    if (obj.type === ImageModelType.POST_IMAGE) {
      return `/${join(POST_PUBLIC_IMAGE_PATH, value)}`;
    } else {
      return value;
    }
  })
  path: string;

  @ManyToOne((type) => PostsModel, (post) => post.images)
  post?: PostsModel;
}
