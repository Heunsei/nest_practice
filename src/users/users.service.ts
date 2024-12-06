import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersModel } from './entities/users.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersModel)
    private readonly usersRepository: Repository<UsersModel>,
  ) {}

  async createUser(user: Pick<UsersModel, 'email' | 'nickname' | 'password'>) {
    // 닉네임 중복 확인
    const nicknameExist = await this.usersRepository.exists({
      where: {
        nickname: user.nickname,
      },
    });

    if (nicknameExist) {
      throw new BadRequestException('이미 존재하는 nickname 입니다');
    }
    const emailExist = await this.usersRepository.exists({
      where: {
        email: user.email,
      },
    });

    if (emailExist) {
      throw new BadRequestException('이미 존재하는 email 입니다');
    }

    const userObject = this.usersRepository.create({
      nickname: user.nickname,
      email: user.email,
      password: user.password,
    });
    const newUser = await this.usersRepository.save(userObject);
    return newUser;
  }

  async getAllUsers() {
    return await this.usersRepository.find();
  }

  async deleteUser(id: number) {
    const res = await this.usersRepository.delete(id);
    return res;
  }

  async getUserByEmail(email: string) {
    return this.usersRepository.findOne({
      where: {
        email,
      },
    });
  }
}
