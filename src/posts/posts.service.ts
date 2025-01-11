import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FindOptionsWhere,
  LessThan,
  MoreThan,
  QueryRunner,
  Repository,
} from 'typeorm';
import { PostsModel } from './entitiy/posts.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { CommonService } from 'src/common/common.service';
import { ConfigService } from '@nestjs/config';
import {
  ENV_HOST_KEY,
  ENV_PROTOCOL_KEY,
} from 'src/common/const/env-keys.const';
import { basename, join } from 'path';
import { POST_IMAGE_PATH, TEMP_FOLDER_PATH } from 'src/common/const/path.const';
import { promises } from 'fs';
import { CreatePostImageDto } from './image/dto/create-image.dto';
import { ImageModel } from 'src/common/entity/image.entity';
import { DEFAULT_POST_FIND_OPTIONS } from './const/default-post-find-options.const';

@Injectable()
export class PostsService {
  constructor(
    // typeorm 으로부터 inject 되는 레포지토리라는 어노테이션 추가.
    @InjectRepository(PostsModel)
    private readonly postsRepository: Repository<PostsModel>,
    @InjectRepository(ImageModel)
    private readonly imageRepository: Repository<ImageModel>,
    private readonly commonService: CommonService,
    private readonly configService: ConfigService,
  ) {}
  async getAllPost() {
    return this.postsRepository.find({ ...DEFAULT_POST_FIND_OPTIONS });
  }

  async paginatePosts(dto: PaginatePostDto) {
    return this.commonService.paginate(
      dto,
      this.postsRepository,
      {
        ...DEFAULT_POST_FIND_OPTIONS,
      },
      'posts',
    );
    // if (dto.page) {
    //   return this.pagePaginatePost(dto);
    // } else {
    //   return this.cursorPaginatePosts(dto);
    // }
  }

  async pagePaginatePost(dto: PaginatePostDto) {
    /**
     * data: Data[],
     * totla: number,
     */
    const [posts, count] = await this.postsRepository.findAndCount({
      skip: dto.take * (dto.page - 1),
      order: {
        createdAt: dto.order__createdAt,
      },
      take: dto.take,
    });
    return {
      data: posts,
      total: count,
    };
  }

  // 오름차순으로 정렬하는 pagination만 구현
  async cursorPaginatePosts(dto: PaginatePostDto) {
    const where: FindOptionsWhere<PostsModel> = {};
    if (dto.where__id__less_than) {
      where.id = LessThan(dto.where__id__less_than);
    } else if (dto.where__id__more_than) {
      where.id = MoreThan(dto.where__id__more_than);
    }
    const posts = await this.postsRepository.find({
      where,
      order: {
        createdAt: dto.order__createdAt,
      },
      take: dto.take,
    });
    // 해당 되는 post가 0개 이상이면 마지막 포스트를 가져오고 아니면 null
    const lastItem =
      posts.length > 0 && posts.length === dto.take
        ? posts[posts.length - 1]
        : null;

    const protocol = this.configService.get<string>(ENV_PROTOCOL_KEY);
    const host = this.configService.get<string>(ENV_HOST_KEY);

    const nextUrl = lastItem ? new URL(`${protocol}://${host}/posts`) : null;
    if (nextUrl) {
      // dto의 key를 돌며 존재하면 param에 붙여서 전달
      for (const key of Object.keys(dto)) {
        if (dto[key]) {
          if (
            key !== 'where__id__more_than' &&
            key !== 'where__id__less_than'
          ) {
            nextUrl.searchParams.append(key, dto[key]);
          }
        }
      }
      let key = null;
      if (dto.order__createdAt === 'ASC') {
        key = 'where_id__more_than';
      } else {
        key = 'where_id_less_than';
      }
      nextUrl.searchParams.append(key, lastItem.id.toString());
    }
    /**
     * Response
     *
     * data: Data[],
     * cursor: {
     *  after: 마지막 Data의 id
     * }
     * count: 응답한 데이터의 갯수
     * next: 다음 요청에 필요한 URL;
     */
    return {
      data: posts,
      cursor: {
        after: lastItem?.id ?? null,
      },
      count: posts.length,
      next: nextUrl?.toString() ?? null,
    };
  }

  async getPostById(id: number, qr?: QueryRunner) {
    const repository = this.getRepository(qr);
    const post = await repository.findOne({
      ...DEFAULT_POST_FIND_OPTIONS,
      where: {
        id,
      },
    });
    if (!post) {
      throw new NotFoundException();
    }
    return post;
  }

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<PostsModel>(PostsModel)
      : this.postsRepository;
  }

  async incrementCommentCount(postId: number, qr?: QueryRunner) {
    const repoistory = this.getRepository(qr);
    await repoistory.increment(
      {
        id: postId,
      },
      'commentCount',
      1,
    );
  }

  async decrementCommentCount(postId: number, qr?: QueryRunner) {
    const repoistory = this.getRepository(qr);
    await repoistory.decrement(
      {
        id: postId,
      },
      'commentCount',
      1,
    );
  }

  async createPost(authorId: number, postDto: CreatePostDto, qr?: QueryRunner) {
    // create -> 저장할 객체 생성
    // save -> 객체를 저장한다.
    const repository = this.getRepository(qr);

    const post = repository.create({
      author: {
        id: authorId,
      },
      ...postDto,
      likeCount: 0,
      images: [],
      commentCount: 0,
    });
    const newPost = repository.save(post);
    return newPost;
  }

  async createPostImage(dto: CreatePostImageDto) {
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
    const result = await this.imageRepository.save({
      ...dto,
    });
    // 옮길 파일의 위치, 옮길 위치
    await promises.rename(tempFilePath, newPath);
    return result;
  }

  async updatePost(id: number, postDto: UpdatePostDto) {
    const { title, content } = postDto;
    // save는 데이터가 존재하지 않는다면 생성
    // 데이터가 존재한다면 수정
    const post = await this.postsRepository.findOne({
      where: {
        id,
      },
    });
    if (!post) {
      throw new NotFoundException();
    }
    if (title) {
      post.title = title;
    }
    if (content) {
      post.content = content;
    }
    const newPost = await this.postsRepository.save(post);
    return newPost;
  }

  async deletePost(id: number) {
    const post = await this.postsRepository.findOne({
      where: {
        id,
      },
    });
    if (!post) {
      throw new NotFoundException();
    }
    await this.postsRepository.delete(id);
    return id;
  }

  async generatePosts(userId: number) {
    for (let i = 0; i < 100; i++) {
      await this.createPost(userId, {
        title: `임시 데이터 ${i}`,
        content: `임시데이터 내용 ${i}`,
        images: [],
      });
    }
  }

  async checkPostExistsById(id: number) {
    return this.postsRepository.exists({
      where: {
        id,
      },
    });
  }

  async isPostMine(userId: number, postId: number) {
    return this.postsRepository.exists({
      where: {
        id: postId,
        author: {
          id: userId,
        },
      },
      relations: {
        author: true,
      },
    });
  }
}
