import { PostDBType } from '../../domain/post.entity';

export class PostViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: ExtendedLikesInfo;

  static mapToView(
    post: PostDBType,
    extendedLikesInfo: ExtendedLikesInfo,
  ): PostViewDto {
    const dto = new PostViewDto();
    dto.id = post._id.toString();
    dto.title = post.title;
    dto.shortDescription = post.shortDescription;
    dto.content = post.content;
    dto.blogId = post.blogId;
    dto.blogName = post.blogName;
    dto.createdAt = new Date(post.createdAt).toISOString();
    dto.extendedLikesInfo = extendedLikesInfo;

    return dto;
  }
}

export type NewestLikes = {
  addedAt: string;
  userId: string;
  login: string;
};

export type NewestLikesDb = {
  addedAt: Date;
  userId: string;
  login: string;
};

export class ExtendedLikesInfo {
  likesCount: number;
  dislikesCount: number;
  myStatus: string;
  newestLikes: NewestLikes[];
}
