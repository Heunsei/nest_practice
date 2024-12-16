import { FindManyOptions } from 'typeorm';
import { CommentModel } from '../entity/comment.entity';

export const DEFAULT_COMMENT_FIND_OPTIONS: FindManyOptions<CommentModel> = {
  relations: {
    author: true,
  },
  select: {
    author: {
      id: true,
      nickname: true,
    },
  },
};
