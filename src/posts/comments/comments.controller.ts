import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { User } from 'src/users/decorator/user.decorator';
import { PaginateCommentsDto } from './dto/paginate-comments.dto';
import { UsersModel } from 'src/users/entity/users.entity';
import { UpdateCommentsDto } from './dto/update-comments.dto';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {
    /**
     * 1) entity
     * author -> 작성자
     * post -> 귀속되는 포스트
     * comment -> 실제 댓글 내용
     * likeCount -> 좋아요 갯수
     * createdAt -> 생성일자
     * updatedAt -> 업데이트 일자
     *
     * 2) GET() pagination
     * 3) GET(':commentId') 특정 comment
     * 4) POST() 코멘트 생성
     * 5) PATCH(':commentId') 특정 comment update
     * 6) DELETE(':commentId') 특정 comment delete
     */
  }

  @Get()
  getComments(
    @Param('postId', ParseIntPipe) postId: number,
    @Query()
    query: PaginateCommentsDto,
  ) {
    return this.commentsService.paginateComments(query, postId);
  }

  @Get(':commentId')
  getComment(@Param('commentId', ParseIntPipe) id: number) {
    return this.commentsService.getComment(id);
  }

  @Delete(':commentId')
  deleteComment(@Param('commentId', ParseIntPipe) id: number) {
    return this.commentsService.deleteComment(id);
  }

  @Post()
  @UseGuards(AccessTokenGuard)
  postComment(
    @Body() body: CreateCommentDto,
    @Param('postId', ParseIntPipe) postId: number,
    @User() user: UsersModel,
  ) {
    return this.commentsService.createComment(body, postId, user);
  }

  @Patch(':commentId')
  @UseGuards(AccessTokenGuard)
  async patchComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() body: UpdateCommentsDto,
  ) {
    return this.commentsService.updateComment(body, commentId);
  }
}