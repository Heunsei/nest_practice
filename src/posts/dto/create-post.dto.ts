import { IsOptional, IsString } from 'class-validator';
import { PostsModel } from '../entitiy/posts.entity';
import { PickType } from '@nestjs/mapped-types';

export class CreatePostDto extends PickType(PostsModel, ['title', 'content']) {
  // 배열안의 모든값을 검사하는 설정 코드
  @IsString({
    each: true,
  })
  @IsOptional()
  images: string[] = [];
}
