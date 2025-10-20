import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';

export class CreatePostInputDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

export class UpdatePostInputDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

export class PostsQueryParams extends BaseQueryParams {
  sortBy: string = 'createdAt';
}
