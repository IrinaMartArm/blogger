import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';

export class GetBlogsQueryParams extends BaseQueryParams {
  searchNameTerm: string | null = null;
  sortBy: string = 'createdAt';
}
