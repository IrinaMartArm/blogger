import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../domain/post.entity';
import { ExtendedLikesInfo, PostViewDto } from '../api/view-dto/post.view-dto';
import { PostLikesQueryRepository } from '../../post-likes/infrastructure/post-likes.query-repository';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { FilterQuery, SortOrder } from 'mongoose';
import { PostsQueryParams } from '../api/input-dto/posts.input-dto';
import { LikeStatusValue } from '../../post-likes/dto';
import { CommentsViewDto } from '../../comments/api/view-dto/comments.view-dto';
import { CommentsQueryRepository } from '../../comments/infrastructure/comments.query-repository';
import { GetCommentsQueryParams } from '../api/input-dto/get-comments-query-params.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

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
    private postLikesRepository: PostLikesQueryRepository,
    private commentsQueryRepository: CommentsQueryRepository,
  ) {}
  async findPost(postId: string, userId?: string): Promise<PostViewDto> {
    const post = await this.postModel
      .findOne({ _id: postId, deletedAt: null })
      .lean();

    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }

    const likesInfo = await this.postLikesRepository.getLikesInfoForPost(
      postId,
      userId,
    );

    return PostViewDto.mapToView(post, likesInfo);
  }

  async findPosts(
    query: PostsQueryParams,
    userId?: string,
    blogId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const filter: FilterQuery<Post> = blogId
      ? {
          blogId,
          deletedAt: null,
        }
      : { deletedAt: null };

    const posts = await this.postModel
      .find(filter)
      .sort({ [query.sortBy]: query.sortDirection as SortOrder })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .lean();

    const totalCount = await this.postModel.countDocuments(filter);

    const ids = posts.map((post) => post._id.toString());
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

  async getComments(
    postId: string,
    query: GetCommentsQueryParams,
    currentUserId?: string,
  ): Promise<PaginatedViewDto<CommentsViewDto[]>> {
    const post = await this.postModel.exists({ _id: postId, deletedAt: null });
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }
    return this.commentsQueryRepository.getCommentsForPost(
      postId,
      query,
      currentUserId,
    );
  }
}
