import { Injectable } from '@nestjs/common';
import { Comment, CommentModelType } from '../domain/comment.entity';
import { InjectModel } from '@nestjs/mongoose';
import {
  CommentsViewDto,
  CommentWithUserInfoDb,
} from '../api/view-dto/comments.view-dto';
import mongoose, { Types } from 'mongoose';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { GetCommentsQueryParams } from '../../posts/api/input-dto/get-comments-query-params.input-dto';
import { CommentLikesQueryRepository } from '../../comment-likes/infrastructure/comment-likes.query-repository';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) private commentModel: CommentModelType,
    private commentLikesQueryRepository: CommentLikesQueryRepository,
  ) {}
  async getComment(
    commentId: Types.ObjectId,
    userId?: string,
  ): Promise<CommentsViewDto> {
    const result: CommentWithUserInfoDb[] = await this.commentModel.aggregate([
      {
        $match: {
          _id: commentId,
          deletedAt: null,
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { userIdStr: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', { $toObjectId: '$$userIdStr' }] },
              },
            },
          ],
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
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'not found',
      });
    }

    const comment = result[0];

    const LikesInfo =
      await this.commentLikesQueryRepository.getLikesInfoForComment(
        commentId.toString(),
        userId,
      );

    return CommentsViewDto.mapToView(comment, LikesInfo);
  }

  async getCommentsForPost(
    postId: string,
    query: GetCommentsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<CommentsViewDto[]>> {
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
          let: { userIdStr: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', { $toObjectId: '$$userIdStr' }] },
              },
            },
          ],
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
        $sort: { [query.sortBy]: query.sortDirection === 'asc' ? 1 : -1 },
      },
      {
        $skip: query.calculateSkip(),
      },
      {
        $limit: query.pageSize,
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
