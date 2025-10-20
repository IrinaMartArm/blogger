import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../domain/post.entity';
import { ExtendedLikesInfo, PostViewDto } from '../api/view-dto/post.view-dto';
import { PostLikesRepository } from '../../post-likes/post-likes.repository';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { FilterQuery } from 'mongoose';
import { PostsQueryParams } from '../api/input-dto/posts.input-dto';
import { LikeStatusValue } from '../../post-likes/dto';

const defaultLikesInfo: ExtendedLikesInfo = {
  likesCount: 0,
  dislikesCount: 0,
  myStatus: LikeStatusValue.None,
  newestLikes: [],
};

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name) private postModel: PostModelType,
    private postLikesRepository: PostLikesRepository,
  ) {}
  async findPost(postId: string, userId?: string): Promise<PostViewDto> {
    const post = await this.postModel
      .findOne({ _id: postId, deletedAt: null })
      .lean();

    if (!post) {
      throw new NotFoundException();
    }

    const likesInfo = await this.postLikesRepository.getLikesInfoForPost(
      postId,
      userId,
    );

    return PostViewDto.mapToView(post, likesInfo);
  }

  async findPosts(
    query: PostsQueryParams,
    blogId?: string,
    userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const filter: FilterQuery<Post> = blogId
      ? {
          blogId,
          deletedAt: null,
        }
      : { deletedAt: null };

    const posts = await this.postModel
      .find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .lean();

    const totalCount = await this.postModel.countDocuments(filter);

    const ids = posts.map((post) => post._id);
    const postsWithLikes = await this.postLikesRepository.findPostsNewestLikes(
      ids,
      userId,
    );

    const items = posts.map((post) =>
      PostViewDto.mapToView(
        post,
        postsWithLikes.get(post._id.toString()) ?? defaultLikesInfo,
      ),
    );

    return PaginatedViewDto.mapToView({
      items,
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
    });
  }
}
