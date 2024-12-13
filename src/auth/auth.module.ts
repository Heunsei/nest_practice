import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { CommonService } from 'src/common/common.service';

@Module({
  imports: [JwtModule.register({}), UsersModule],
  exports: [AuthService],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
