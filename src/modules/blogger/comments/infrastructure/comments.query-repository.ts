import { Injectable, NotFoundException } from '@nestjs/common';
import { Comment, CommentModelType } from '../domain/comment.entity';
import { InjectModel } from '@nestjs/mongoose';
import {
  CommentsViewDto,
  CommentWithUserInfoDb,
} from '../api/view-dto/comments.view-dto';
import mongoose from 'mongoose';
import { CommentLikesQueryRepository } from '../../comment-likes/infrastructure/comment-likes.repository';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { GetCommentsQueryParams } from '../../posts/api/input-dto/get-comments-query-params.input-dto';
import { SortDirection } from '../../../../core/dto/base.query-params.input-dto';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) private commentModel: CommentModelType,
    private commentLikesQueryRepository: CommentLikesQueryRepository,
  ) {}
  async getComment(
    commentId: string,
    userId?: string,
  ): Promise<CommentsViewDto> {
    const result: CommentWithUserInfoDb[] = await this.commentModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(commentId),
          deletedAt: null,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true, // если пользователь удален
        },
      },
      {
        $project: {
          id: { $toString: '$_id' },
          content: 1,
          createdAt: 1,
          commentatorInfo: {
            userId: { $toString: '$userId' },
            login: '$user.login',
          },
        },
      },
    ]);

    if (result.length === 0) {
      throw new NotFoundException('Comment not found');
    }

    const comment = result[0];

    const LikesInfo =
      await this.commentLikesQueryRepository.getLikesInfoForComment(
        commentId,
        userId,
      );

    return CommentsViewDto.mapToView(comment, LikesInfo);
  }

  async getCommentsForPost(
    postId: string,
    query: GetCommentsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<CommentsViewDto[]>> {
    const sortDirection = query.sortDirection === SortDirection.Asc ? 1 : -1;
    const filter = {
      postId: new mongoose.Types.ObjectId(postId),
      deletedAt: null,
    };

    const result: CommentWithUserInfoDb[] = await this.commentModel.aggregate([
      {
        $match: filter,
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true, // если пользователь удален
        },
      },
      {
        $sort: { [query.sortBy]: sortDirection }, // сортировка
      },
      {
        $skip: query.calculateSkip(), // пагинация
      },
      {
        $limit: query.pageSize, // пагинация
      },
      {
        $project: {
          id: { $toString: '$_id' },
          content: 1,
          createdAt: 1,
          commentatorInfo: {
            userId: { $toString: '$userId' },
            login: '$user.login',
          },
        },
      },
    ]);

    const totalCount = await this.commentModel.countDocuments(filter);
    const commentIds = result.map((comment) => comment.id);
    const commentsLikesInfo =
      await this.commentLikesQueryRepository.getLikesInfoForComments(
        commentIds,
        userId,
      );

    const items = result.map((comment) => {
      const likesInfo = commentsLikesInfo.get(comment.id);
      return CommentsViewDto.mapToView(comment, likesInfo);
    });

    return PaginatedViewDto.mapToView({
      items,
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
    });
  }
}
//{
//   _id: ObjectId("507f1f77bcf86cd799439011"),
//   content: "Great post!",
//   createdAt: ISODate("2024-01-15T10:30:00Z"),
//   commentatorInfo: {
//     userId: ObjectId("user123")
//   },
//   user: {
//     _id: ObjectId("user123"),
//     login: "john_doe",
//     email: "john@example.com",
//   },
// }
