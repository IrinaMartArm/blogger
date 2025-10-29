import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CommentLike,
  CommentLikeModelType,
} from '../domain/comment-like.entity';
import { LikeStatusValue } from '../../post-likes/dto';
import {
  LikesInfo,
  LikesInfoWithCommentId,
} from '../../comments/api/view-dto/comments.view-dto';

@Injectable()
export class CommentLikesQueryRepository {
  constructor(
    @InjectModel(CommentLike.name)
    private readonly commentLikesModel: CommentLikeModelType,
  ) {}
  async getLikesInfoForComment(
    commentId: string,
    userId?: string,
  ): Promise<LikesInfo> {
    const [likesCount, dislikesCount] = await Promise.all([
      this.commentLikesModel.countDocuments({
        commentId,
        status: LikeStatusValue.Like,
      }),
      this.commentLikesModel.countDocuments({
        commentId,
        status: LikeStatusValue.Dislike,
      }),
    ]);

    let myStatus = LikeStatusValue.None;
    if (userId) {
      const like = await this.commentLikesModel
        .findOne({ commentId, userId, deletedAt: null })
        .lean();
      myStatus = like ? like.status : LikeStatusValue.None;
    }

    return {
      likesCount,
      dislikesCount,
      myStatus,
    };
  }

  async getLikesInfoForComments(
    commentIds: string[],
    userId?: string,
  ): Promise<Map<string, LikesInfo>> {
    if (commentIds.length === 0) return new Map();

    const result: LikesInfoWithCommentId[] =
      await this.commentLikesModel.aggregate([
        {
          $match: {
            // deletedAt: null,
            commentId: {
              $in: commentIds,
            },
          },
        },
        {
          $group: {
            _id: '$commentId',
            allLikes: { $push: '$$ROOT' },
            likesCount: {
              $sum: {
                $cond: [{ $eq: ['$status', LikeStatusValue.Like] }, 1, 0],
              },
            },
            dislikesCount: {
              $sum: {
                $cond: [{ $eq: ['$status', LikeStatusValue.Dislike] }, 1, 0],
              },
            },
          },
        },
        {
          $addFields: {
            myLike: {
              $first: {
                $filter: {
                  input: '$allLikes',
                  as: 'like',
                  cond: { $eq: ['$$like.userId', userId] },
                },
              },
            },
          },
        },
        {
          $addFields: {
            myStatus: { $ifNull: ['$myLike.status', LikeStatusValue.None] },
          },
        },
        {
          $project: {
            commentId: { $toString: '$_id' },
            likesCount: 1,
            dislikesCount: 1,
            myStatus: { $ifNull: ['$myStatus', LikeStatusValue.None] },
            _id: 0,
          },
        },
      ]);

    const likesMap = new Map();
    result.forEach((like) =>
      likesMap.set(like.commentId, {
        likesCount: like.likesCount,
        dislikesCount: like.dislikesCount,
        myStatus: like.myStatus,
      }),
    );

    commentIds.forEach((commentId) => {
      if (!likesMap.has(commentId)) {
        likesMap.set(commentId, {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: LikeStatusValue.None,
        });
      }
    });
    return likesMap;
  }
}
