import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ImageModel } from 'src/common/entity/image.entity';
import { QueryRunner, Repository } from 'typeorm';
import { CreatePostImageDto } from './dto/create-image.dto';
import { basename, join } from 'path';
import { POST_IMAGE_PATH, TEMP_FOLDER_PATH } from 'src/common/const/path.const';
import { promises } from 'fs';

@Injectable()
export class PostImageService {
  constructor(
    @InjectRepository(ImageModel)
    private readonly imageRepository: Repository<ImageModel>,
  ) {}

  getRepository(qr?: QueryRunner) {
    return qr ? qr.manager.getRepository(ImageModel) : this.imageRepository;
  }

  async createPostImage(dto: CreatePostImageDto, qr?: QueryRunner) {
    const repository = this.getRepository(qr);
    // dto의 이미지 이름을 기반으로
    // 파일의 경로를 생성.
    const tempFilePath = join(TEMP_FOLDER_PATH, dto.path);
    try {
      // 경로를 전달했을 때 해당 경로의 파일이 접근 가능한지 알려줌
      await promises.access(tempFilePath);
    } catch (e) {
      throw new BadRequestException('존재하지 않는 파일입니다.');
    }
    // 파일 이름'
    const fileName = basename(tempFilePath);
    // 새로 이동할 포스트 폴더의 경로 + 이동할 파일의 이름
    const newPath = join(POST_IMAGE_PATH, fileName);
    //save
    const result = await repository.save({
      ...dto,
    });
    // 옮길 파일의 위치, 옮길 위치
    await promises.rename(tempFilePath, newPath);
    return result;
  }
}
