import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentModel } from './entity/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommonService } from 'src/common/common.service';
import { PaginateCommentsDto } from './dto/paginate-comments.dto';
import { UsersModel } from 'src/users/entity/users.entity';
import { DEFAULT_COMMENT_FIND_OPTIONS } from './const/default-comment-find-options.const';
import { UpdateCommentsDto } from './dto/update-comments.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commonService: CommonService,
    @InjectRepository(CommentModel)
    private readonly commentsRepository: Repository<CommentModel>,
  ) {}

  paginateComments(dto: PaginateCommentsDto, postId: number) {
    return this.commonService.paginate(
      dto,
      this.commentsRepository,
      {
        where: {
          post: {
            id: postId,
          },
        },
        ...DEFAULT_COMMENT_FIND_OPTIONS,
      },
      `posts/${postId}/comments`,
    );
  }

  async getComment(id: number) {
    return await this.commentsRepository.find({
      where: {
        id,
      },
      ...DEFAULT_COMMENT_FIND_OPTIONS,
    });
  }

  async deleteComment(id: number) {
    const comment = await this.commentsRepository.findOne({
      where: {
        id,
      },
    });
    if (!comment) {
      throw new NotFoundException('해당 댓글은 존재하지 않습니다');
    }
    await this.commentsRepository.delete(id);
    return id;
  }

  async createComment(
    dto: CreateCommentDto,
    postId: number,
    author: UsersModel,
  ) {
    return this.commentsRepository.save({
      ...dto,
      post: {
        id: postId,
      },
      author,
    });
  }

  async updateComment(dto: UpdateCommentsDto, commentId: number) {
    const prevComment = await this.commentsRepository.preload({
      id: commentId,
      ...dto,
    });
    const newComment = await this.commentsRepository.save(prevComment);
    return newComment;
  }
}
