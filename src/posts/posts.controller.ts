import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
  ParseIntPipe,
  UseGuards,
  Patch,
  Query,
  UseInterceptors,
  UseFilters,
  BadRequestException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { User } from 'src/users/decorator/user.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { UsersModel } from 'src/users/entities/users.entity';
import { ImageModelType } from 'src/common/entity/image.entity';
import { DataSource, QueryRunner as QR } from 'typeorm';
import { PostImageService } from './image/images.service';
import { LogInterceptor } from 'src/common/interceptor/log.interceptor';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { HttpExceptionFilter } from 'src/common/exception-filter/http.exception-filter';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postImagesService: PostImageService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @UseInterceptors(LogInterceptor)
  @UseFilters(HttpExceptionFilter)
  getPosts(@Query() query: PaginatePostDto) {
    return this.postsService.paginatePosts(query);
  }

  @Post('random')
  @UseGuards(AccessTokenGuard)
  async postPostsRandom(@User() user: UsersModel) {
    await this.postsService.generatePosts(user.id);
    return true;
  }

  @Get(':id')
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id);
  }

  @Post()
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(TransactionInterceptor)
  async postPosts(
    @User('id') userId: number,
    @Body() body: CreatePostDto,
    @QueryRunner() qr: QR,
  ) {
    const post = await this.postsService.createPost(userId, body, qr);
    for (let i = 0; i < body.images.length; i++) {
      await this.postImagesService.createPostImage(
        {
          post,
          order: i,
          path: body.images[i],
          type: ImageModelType.POST_IMAGE,
        },
        qr,
      );
    }
    return this.postsService.getPostById(post.id, qr);
  }

  @Patch(':id')
  updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePostDto,
  ) {
    return this.postsService.updatePost(id, body);
  }

  @Delete(':id')
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.deletePost(id);
  }
}
