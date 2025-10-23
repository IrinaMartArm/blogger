import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class BaseQueryParams {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  public readonly pageNumber: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  public readonly pageSize: number = 10;

  @IsString()
  public readonly sortDirection: string = 'desc';

  calculateSkip() {
    return (this.pageNumber - 1) * this.pageSize;
  }
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}
//базовый класс для query параметров с пагинацией
//значения по-умолчанию применятся автоматически при настройке глобального ValidationPipe в main.ts
