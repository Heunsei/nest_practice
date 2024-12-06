import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class PasswordPipe implements PipeTransform {
  // value -> 입력받은 값.
  // ArgumentMetadata -> type ( body, query, params)
  // metadata -> 입력받은 데이터의 타입
  // data -> 실제 데이터
  transform(value: any, metadata: ArgumentMetadata) {
    if (value.toString().length > 8) {
      throw new BadRequestException('비밀번호는 8자 이하로 작성해주세요');
    }
    return value.toString();
  }
}

@Injectable()
export class MaxLengthPipe implements PipeTransform {
  constructor(private readonly length: number) {}
  transform(value: any, metadata: ArgumentMetadata) {
    if (value.toString().length > this.length) {
      throw new BadRequestException(`최대 길이는 ${this.length} 입니다`);
    }
    return value.toString();
  }
}

@Injectable()
export class MinLengthPipe implements PipeTransform {
  constructor(private readonly length: number) {}
  transform(value: any, metadata: ArgumentMetadata) {
    if (value.toString().length < this.length) {
      throw new BadRequestException(`최소 길이는 ${this.length} 입니다`);
    }
    return value.toString();
  }
}
