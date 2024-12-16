import { IsNumber, IsString } from 'class-validator';
import { BaseModel } from 'src/common/entity/base.entity';
import { PostsModel } from 'src/posts/entitiy/posts.entity';
import { UsersModel } from 'src/users/entity/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class CommentModel extends BaseModel {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PostsModel, (post) => post.comments, { nullable: false })
  post: PostsModel;

  @ManyToOne(() => UsersModel, (user) => user.postComments)
  author: UsersModel;

  @Column()
  @IsString()
  comment: string;

  @Column({ default: 0 })
  @IsNumber()
  likeCount: number;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
