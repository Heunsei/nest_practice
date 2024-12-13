import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatsService } from './chats.service';
import { EnterChatDto } from './dto/enter-chat.dto';
import { CreateMessagesDto } from './messages/dto/create-message.dto';
import { ChatsMessagesService } from './messages/messages.service';
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { SocketCatchHttpExceptionFilter } from 'src/common/exception-filter/socket-catch-http.exception-filter';
import { UsersModel } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/users.service';
import { AuthService } from 'src/auth/auth.service';

// 소켓과 관련된 연결을 gateway라 부름
@WebSocketGateway({
  // '/chats'
  namespace: 'chats',
})
export class ChatsGateway
  implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect
{
  constructor(
    private readonly chatsService: ChatsService,
    private readonly messageService: ChatsMessagesService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit(server: any) {
    console.log('after gateway init');
  }

  handleDisconnect(socket: Socket) {
    console.log(`on disconnect called : ${socket.id}`);
  }

  async handleConnection(socket: Socket & { user: UsersModel }) {
    console.log(`on connect called : ${socket.id}`);

    const headers = socket.handshake.headers;

    const rawToken = headers['authorization'];

    if (!rawToken) {
      throw new WsException('토큰이 없습니다');
    }
    try {
      const token = this.authService.extractTokenFromHeader(rawToken, true);
      const payload = this.authService.verifyToken(token);
      const user = await this.usersService.getUserByEmail(payload.email);
      // 소켓에 데이터 넘겨 주는 법.
      socket.user = user;
      return true;
    } catch (e) {
      socket.disconnect();
    }
  }

  @SubscribeMessage('enter_chat')
  async enterChat(
    // 방의 id들을 리스트로 받아온다
    @MessageBody() data: EnterChatDto,
    @ConnectedSocket() socket: Socket & { user: UsersModel },
  ) {
    for (const chatId of data.chatIds) {
      const exists = await this.chatsService.checkIfChatExitst(chatId);
      if (!exists) {
        throw new WsException({
          code: 100,
          message: `존재하지 않는 chat 입니다 : ${chatId}`,
        });
      }
    }
    socket.join(data.chatIds.map((x) => x.toString()));
  }

  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @UseFilters(SocketCatchHttpExceptionFilter)
  @SubscribeMessage('create_chat')
  async createChat(
    @MessageBody() data: CreateChatDto,
    @ConnectedSocket() socket: Socket & { user: UsersModel },
  ) {
    const chat = await this.chatsService.createChat(data);
  }

  // socket.on('send_message', (message) => {console.log(message)})
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @UseFilters(SocketCatchHttpExceptionFilter)
  @SubscribeMessage('send_message')
  async sendMessage(
    @MessageBody() dto: CreateMessagesDto,
    @ConnectedSocket() socket: Socket & { user: UsersModel },
  ) {
    const chatExists = await this.chatsService.checkIfChatExitst(dto.chatId);

    if (!chatExists) {
      throw new WsException(
        `존재하지 않는 채팅방입니다. ChatId : ${dto.chatId}`,
      );
    }

    const message = await this.messageService.createMessage(
      dto,
      socket.user.id,
    );
    // socket -> 현재 연결된 연결된 소켓에게
    // 방에서 나 빼고 전부 메세지를 보냄.
    socket
      .to(message.chat.id.toString())
      .emit('receive_message', message.message);
    // 이 파일내에서 구성한 방 전체에 데이터 전달, 모든 소켓들에게 전달
    // this.server
    //   .in(message.chatId.toString())
    //   .emit('receive_message', `${message.message}`);
  }
}
