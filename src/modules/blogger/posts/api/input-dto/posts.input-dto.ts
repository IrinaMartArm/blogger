import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/isStringTrim';
import { IsString } from 'class-validator';

export class CreatePostInputDto {
  @IsStringWithTrim(1, 30)
  title: string;

  @IsStringWithTrim(1, 100)
  shortDescription: string;

  @IsStringWithTrim(1, 1000)
  content: string;

  @IsString()
  blogId: string;
}

export class UpdatePostInputDto extends CreatePostInputDto {}

export class PostsQueryParams extends BaseQueryParams {
  sortBy: string = 'createdAt';
}

export class CreateCommentInputDto {
  @IsStringWithTrim(20, 300)
  content: string;
}

export class UpdateCommentInputDto extends CreateCommentInputDto {}
