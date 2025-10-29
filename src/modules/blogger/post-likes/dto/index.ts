import { IsEnum } from 'class-validator';

export enum LikeStatusValue {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

export class LikeInputDto {
  @IsEnum(LikeStatusValue)
  likeStatus: LikeStatusValue;
}
