import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, LessThan, MoreThan, Repository } from 'typeorm';
import { PostsModel } from './entities/posts.entity';
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

@Injectable()
export class PostsService {
  constructor(
    // typeorm 으로부터 inject 되는 레포지토리라는 어노테이션 추가.
    @InjectRepository(PostsModel)
    private readonly postsRepository: Repository<PostsModel>,
    private readonly commonService: CommonService,
    private readonly configService: ConfigService,
  ) {}
  async getAllPost() {
    return this.postsRepository.find({ relations: ['author'] });
  }

  async paginatePosts(dto: PaginatePostDto) {
    return this.commonService.paginate(
      dto,
      this.postsRepository,
      {
        relations: ['author'],
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

  async getPostById(id: number) {
    const post = await this.postsRepository.findOne({
      where: {
        id,
      },
      relations: ['author'],
    });
    if (!post) {
      throw new NotFoundException();
    }
    return post;
  }

  async createPost(authorId: number, postDto: CreatePostDto, image?: string) {
    // create -> 저장할 객체 생성
    // save -> 객체를 저장한다.
    const post = this.postsRepository.create({
      author: {
        id: authorId,
      },
      ...postDto,
      image,
      likeCount: 0,
      commentCount: 0,
    });
    const newPost = this.postsRepository.save(post);
    return newPost;
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
      });
    }
  }
}
