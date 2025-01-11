import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { RolesEnum } from '../const/role.const';
import { PostsModel } from 'src/posts/entitiy/posts.entity';
import { BaseModel } from 'src/common/entity/base.entity';
import { IsEmail, IsString, Length } from 'class-validator';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { emailValidationMessage } from 'src/common/validation-message/email-validation.message';
import { Exclude } from 'class-transformer';
import { ChatsModel } from 'src/chats/entity/chats.entity';
import { MessagesModel } from 'src/chats/messages/entity/messages.entity';
import { CommentModel } from 'src/posts/comments/entity/comment.entity';
import { UserFollowersModel } from './user-followers.entity';

@Entity()
export class UsersModel extends BaseModel {
  @IsString({
    message: stringValidationMessage,
  })
  @Length(3, 20, {
    message: lengthValidationMessage,
  })
  @Column({ length: 20, unique: true })
  nickname: string;

  @Column({ unique: true })
  @IsString({
    message: stringValidationMessage,
  })
  @IsEmail(
    {},
    {
      message: emailValidationMessage,
    },
  )
  email: string;

  @IsString({
    message: stringValidationMessage,
  })
  @Column()
  @Length(3, 8, {
    message: lengthValidationMessage,
  })
  /**
   * req
   * frontend -> backend
   * palin (JSON) -> class instance (dto)
   *
   * res
   * backend -> frontend
   * class Instance (dto) -> plain object(JSON)
   *
   * toClassOnly -> class instance 로 변환될때만 (req)
   * toPlainOnly -> plain object로 변환될때만 (res)
   *
   * 비밀번호는 요청을 보낼때(회원가입)는 비밀번호를 받아 dto를 받아야 하니
   * 응답해 줄 때만 제외해서 보내주면 된다.
   * 요청을 보낼때는 dto 에 비밀번호를 넣을 수 있게 되는것.
   */
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ enum: Object.values(RolesEnum), default: RolesEnum.USER })
  role: RolesEnum;

  @OneToMany(() => PostsModel, (post) => post.author)
  posts: PostsModel[];

  @ManyToMany(() => ChatsModel, (chat) => chat.users)
  @JoinTable()
  chats: ChatsModel[];

  @OneToMany(() => MessagesModel, (message) => message.author)
  messages: MessagesModel;

  @OneToMany(() => CommentModel, (comment) => comment.author)
  postComments: CommentModel[];

  // 내가 팔로우 하고 있는 사람
  @OneToMany(() => UserFollowersModel, (ufm) => ufm.follower)
  followers: UserFollowersModel[];

  // 나를 팔로우 하고 있는 사람들
  @OneToMany(() => UserFollowersModel, (ufm) => ufm.followee)
  followees: UserFollowersModel[];

  @Column({
    default: 0,
  })
  followerCount: number;

  @Column({
    default: 0,
  })
  followeeCount: number;
}
