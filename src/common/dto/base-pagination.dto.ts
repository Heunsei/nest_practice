import { IsIn, IsNumber, IsOptional } from 'class-validator';

export class BasePaginationDto {
  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  where__id__less_than?: number;

  // 숫자고 옵셔널
  // 이전 마지막 데이터의 ID
  // @Type(() => Number)
  @IsNumber()
  @IsOptional()
  where__id__more_than?: number;

  // 정렬 기준
  // createdAt -> 오름차순, 내림차순 순으로 정렬.
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  order__createdAt: 'ASC' | 'DESC' = 'ASC';

  @IsNumber()
  @IsOptional()
  take: number = 20;
}
