import { ValidationArguments } from 'class-validator';

export const emailValidationMessage = (args: ValidationArguments) => {
  return `${args.property}에 올바른 이메일을 작성해주세요`;
};
