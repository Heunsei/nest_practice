import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  postUser(
    @Body('nickname') nickname: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.usersService.createUser({ nickname, email, password });
  }

  @Get()
  /**
   * ClassSerializerInterceptor
   * serialization -> 직렬화
   * 현재 시스템에서 사용되는 데이터 구조를 다른 시스템에서 사용할 수 있도록 변환
   * class object -> JSON 포맷을 변환.
   */
  getUsers() {
    return this.usersService.getAllUsers();
  }

  @Delete()
  deleteUsers(@Body('id') id: number) {
    return this.usersService.deleteUser(id);
  }
}
