import { BaseModel } from 'src/common/entity/base.entity';
import { UsersModel } from 'src/users/entity/users.entity';
import { Entity, ManyToMany, OneToMany } from 'typeorm';
import { MessagesModel } from '../messages/entity/messages.entity';

@Entity()
export class ChatsModel extends BaseModel {
  // 하나의 채팅방은 여러 사용자를 가지고, 한 사용자는 여러 채팅방에 가입이 가능하다
  @ManyToMany(() => UsersModel, (user) => user.chats)
  users: UsersModel[];

  @OneToMany(() => MessagesModel, (message) => message.chat)
  messages: MessagesModel;
}
