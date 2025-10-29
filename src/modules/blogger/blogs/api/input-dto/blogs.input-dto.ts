import { CreateBlogDto } from '../../dto/create-blog.dto';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/isStringTrim';
import { Matches } from 'class-validator';

export class CreateBlogInputDto implements CreateBlogDto {
  @IsStringWithTrim(1, 15)
  name: string;

  @IsStringWithTrim(1, 500)
  description: string;

  @IsStringWithTrim(1, 100)
  @Matches(
    /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
  )
  websiteUrl: string;
}

export class UpdateBlogInputDto extends CreateBlogInputDto {}
