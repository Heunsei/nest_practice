import { BasePaginationDto } from './dto/base-pagination.dto';
import {
  FindManyOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { BaseModel } from './entity/base.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { FILTER_MAPPER } from './const/filter-mapper.const';
import { ConfigService } from '@nestjs/config';
import { ENV_HOST_KEY, ENV_PROTOCOL_KEY } from './const/env-keys.const';

@Injectable()
export class CommonService {
  constructor(private readonly configService: ConfigService) {}
  paginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    // findManyOptions -> find 안에 where order 옵션을 넣는 이름.
    overrideFindOptions: FindManyOptions<T> = {},
    path: string,
  ) {
    if (dto.page) {
      return this.pagePaginate(dto, repository, overrideFindOptions);
    } else {
      return this.cursorPaginate(dto, repository, overrideFindOptions, path);
    }
  }

  private async pagePaginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    // findManyOptions -> find 안에 where order 옵션을 넣는 이름.
    overrideFindOptions: FindManyOptions<T> = {},
  ) {
    const findOptions = this.composeFindOptions<T>(dto);

    const [data, count] = await repository.findAndCount({
      ...findOptions,
      ...overrideFindOptions,
    });
    return {
      data,
      total: count,
    };
  }

  private async cursorPaginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    // findManyOptions -> find 안에 where order 옵션을 넣는 이름.
    overrideFindOptions: FindManyOptions<T> = {},
    path: string,
  ) {
    const findOptions = this.composeFindOptions<T>(dto);
    const results = await repository.find({
      ...findOptions,
      ...overrideFindOptions,
    });
    const lastItem =
      results.length > 0 && results.length === dto.take
        ? results[results.length - 1]
        : null;

    const protocol = this.configService.get<string>(ENV_PROTOCOL_KEY);
    const host = this.configService.get<string>(ENV_HOST_KEY);

    const nextUrl = lastItem ? new URL(`${protocol}://${host}/${path}`) : null;
    if (nextUrl) {
      // dto의 key를 돌며 존재하면 param에 붙여서 전달
      for (const key of Object.keys(dto)) {
        if (dto[key]) {
          if (
            key !== 'where__id__more_than' &&
            key !== 'where__id__less_than'
          ) {
            nextUrl.searchParams.append(key, dto[key]);
          }
        }
      }
      let key = null;
      if (dto.order__createdAt === 'ASC') {
        key = 'where__id__more_than';
      } else {
        key = 'where__id_less_than';
      }
      nextUrl.searchParams.append(key, lastItem.id.toString());
    }

    return {
      data: results,
      cursor: {
        after: lastItem?.id ?? null,
      },
      count: results.length,
      next: nextUrl?.toString() ?? null,
    };
  }

  private composeFindOptions<T extends BaseModel>(
    dto: BasePaginationDto,
  ): FindManyOptions<T> {
    /**
     * where,
     * order,
     * take,
     * skip
     * 을 반환
     */
    /**
     * DTO의 현재 구조
     * {
     *   where__id__more_than:1
     *   order__createdAt: 'ASC'
     * }
     *
     * where__id__more__than / where__id__less_than 에 해당하는 필저 사용중
     * 나중에는 where__likeCount__more_than같은 필터를 파싱 해야함
     *
     * 1. where로 시작한다면 필터 로직 적용
     * 2. order로 시작한다면 정렬 로직 적용
     * 3. 필터 로직을 적용하다면 '__' 기준으로 split 했을 때 3개의 값으로,2개의 값으로 나뉘는 것을 확인
     * 3-1 -> 3개의 값으로 나뉘면 FILTER_MAPPTER에서 해당되는 operator 함수를 찾아 적용
     * 3-2 -> 2개의 값으로 나뉘면 정확한 값을 필터하는 것이기 떄문에 operator 없이 적용
     * 4 order는 3-2랑 같이 적용,
     */
    let where: FindOptionsWhere<T> = {};
    let order: FindOptionsOrder<T> = {};

    for (const [key, value] of Object.entries(dto)) {
      // where__id__less_than
      // 1
      if (key.startsWith('where__')) {
        where = {
          ...where,
          ...this.parseWhereFilter(key, value),
        };
      } else if (key.startsWith('order__')) {
        order = {
          ...order,
          ...this.parseWhereFilter(key, value),
        };
      }
    }
    return {
      where,
      order,
      take: dto.take,
      skip: dto.page ? dto.take * (dto.page - 1) : null,
    };
  }

  private parseWhereFilter<T extends BaseModel>(
    key: string,
    value: any,
  ): FindOptionsWhere<T> | FindOptionsOrder<T> {
    const options: FindOptionsWhere<T> = {};
    // ex where__id__more_than
    // -> ['where', 'id', 'more_than']
    const split = key.split('__');
    if (split.length !== 2 && split.length !== 3) {
      throw new BadRequestException(
        `where 필터는 '__'로 split 했을 때 길이가 2-3 이어야 합니다 - 문제되는 key : ${key}`,
      );
    }
    /**
     * 길이가 2 일때
     * where : {
     *  id: 2
     * }
     */
    if (split.length === 2) {
      // [where, id]
      const [_, field] = split;
      options[field] = value;
    } else {
      /**
       * 길이 3일 경우 typeorm 유틸리티 적용이 필요함
       * FILTER_MAPPER에 미리 정의해둔 값으로
       * field 값에 FILTER_MAPPER에서 해당하는 유틸리티를 가져온 후 적용
       */
      // where id more_than
      const [_, field, operator] = split;
      // where__id__between =3,4
      const values = value.toString().split(',');
      // field -> id
      // operator -> more_than
      // FILTER_MAPPER[operator] -> moreThan
      //   if (operator === 'between') {
      //     options[field] = FILTER_MAPPER[operator](values[0], values[1]);
      //   } else {
      //     options[field] = FILTER_MAPPER[operator](value);
      //   }
      if (operator === 'i_like') {
        options[field] = FILTER_MAPPER[operator](`%${value}%`);
      } else {
        options[field] = FILTER_MAPPER[operator](value);
      }
    }
    return options;
  }

  private parseOrderFilter<T extends BaseModel>(
    key: string,
    value: any,
  ): FindOptionsOrder<T> {
    const order: FindOptionsOrder<T> = {};
    /**
     * order는 두개로 스플릿
     */
    const split = key.split('__');
    if (split.length !== 2) {
      throw new BadRequestException(
        `order 필터는 '__'로 split 했을 때 길이가 2여야 합니다. - 문제되는 Key : ${key}`,
      );
    }
    const [_, field] = split;
    order[field] = value;
    return order;
  }
}
