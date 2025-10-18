import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { UsersSortBy } from '../../../../user-accounts/api/input-dto/users-sort-by';

export class GetBlogsQueryParams extends BaseQueryParams {
  searchNameTerm: string | null = null;
  sortBy = UsersSortBy.CreatedAt;
}
