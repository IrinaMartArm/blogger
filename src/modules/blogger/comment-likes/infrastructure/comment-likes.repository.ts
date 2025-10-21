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
import mongoose from 'mongoose';

@Injectable()
export class CommentLikesQueryRepository {
  constructor(
    @InjectModel(CommentLike.name) readonly commentModel: CommentLikeModelType,
  ) {}
  async getLikesInfoForComment(
    commentId: string,
    userId?: string,
  ): Promise<LikesInfo> {
    const [likesCount, dislikesCount] = await Promise.all([
      this.commentModel.countDocuments({
        commentId,
        status: LikeStatusValue.Like,
      }),
      this.commentModel.countDocuments({
        commentId,
        status: LikeStatusValue.Dislike,
      }),
    ]);

    let myStatus = LikeStatusValue.None;
    if (userId) {
      const like = await this.commentModel
        .findOne({ commentId, userId })
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
    const result: LikesInfoWithCommentId[] = await this.commentModel.aggregate([
      {
        $match: {
          commentId: {
            $in: commentIds.map((c) => new mongoose.Types.ObjectId(c)),
          },
        },
      },
      {
        $group: {
          _id: '$commentId',
          likesCount: {
            $sum: { $cond: [{ $eq: ['$status', LikeStatusValue.Like] }, 1, 0] },
          },
          dislikesCount: {
            $sum: {
              $cond: [{ $eq: ['$status', LikeStatusValue.Dislike] }, 1, 0],
            },
          },
          myStatus: {
            $max: {
              $cond: [
                {
                  $eq: [
                    '$userId',
                    userId ? new mongoose.Types.ObjectId(userId) : null,
                  ],
                },
                '$status',
                null,
              ],
            },
          },
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
