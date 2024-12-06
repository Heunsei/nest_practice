import { ValidationArguments } from 'class-validator';

export const stringValidationMessage = (args: ValidationArguments) => {
  return `${args.property}에 string을 입력해 주세요`;
};
