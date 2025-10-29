import { Injectable } from '@nestjs/common';
import {
  PostLike,
  PostLikeDocument,
  PostLikeModelType,
} from '../domain/post-likes.entity';
import { InjectModel } from '@nestjs/mongoose';
import {
  ExtendedLikesInfo,
  NewestLikes,
  NewestLikesDb,
} from '../../posts/api/view-dto/post.view-dto';
import { LikeStatusValue } from '../dto';
import { ExternalUsersQueryRepository } from '../../../user-accounts/infrastructure/external-query/external-users-query.repository';
import mongoose, { Types } from 'mongoose';
import { GetPostsResult } from '../../posts/dto';

@Injectable()
export class PostLikesQueryRepository {
  constructor(
    @InjectModel(PostLike.name) private postLikeModel: PostLikeModelType,
    private usersQueryRepository: ExternalUsersQueryRepository,
  ) {}
  async save(like: PostLikeDocument) {
    await like.save();
  }

  async getLikesInfoForPost(
    postId: string,
    userId?: string,
  ): Promise<ExtendedLikesInfo> {
    const [likesCount, dislikesCount] = await Promise.all([
      this.postLikeModel.countDocuments({
        postId,
        status: LikeStatusValue.Like,
      }),
      this.postLikeModel.countDocuments({
        postId,
        status: LikeStatusValue.Dislike,
      }),
    ]);

    let myStatus = LikeStatusValue.None;

    if (userId) {
      const userLike = await this.postLikeModel.findOne({
        postId,
        userId,
        deletedAt: null,
      });
      myStatus = userLike?.status || LikeStatusValue.None;
    }

    const newestLikes = await this.postLikeModel
      .find({
        postId,
        status: LikeStatusValue.Like,
        deletedAt: null,
      })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const userIds = newestLikes.map((like) => like.userId.toString());
    const usersData = await this.usersQueryRepository.findUsersByIds(userIds);

    return {
      likesCount,
      dislikesCount,
      myStatus,
      newestLikes: newestLikes.map((like) => ({
        addedAt: like.createdAt.toISOString(),
        userId: like.userId,
        login: usersData.get(like.userId) || '',
      })),
    };
  }

  // async findPostsNewestLikes(
  //   postIds: mongoose.Types.ObjectId[],
  //   userId?: string,
  // ) {
  //   const result: GetPostsResult[] = await this.postLikeModel.aggregate([
  //     {
  //       $match: {
  //         postId: { $in: postIds },
  //         status: { $in: [LikeStatusValue.Like, LikeStatusValue.Dislike] },
  //       },
  //     },
  //     // сортировка, чтобы $$ROOT шёл с правильным порядком (для newestLikes)
  //     { $sort: { createdAt: -1 } },
  //
  //     {
  //       $addFields: {
  //         currentUserId: new mongoose.Types.ObjectId(userId),
  //       },
  //     },
  //
  //     {
  //       $group: {
  //         _id: '$postId',
  //         likes: { $push: '$$ROOT' },
  //         likesCount: {
  //           $sum: {
  //             $cond: [{ $eq: ['$status', LikeStatusValue.Like] }, 1, 0],
  //           },
  //         },
  //         dislikesCount: {
  //           $sum: {
  //             $cond: [{ $eq: ['$status', LikeStatusValue.Dislike] }, 1, 0],
  //           },
  //         },
  //         myStatus: {
  //           $max: {
  //             $cond: [
  //               {
  //                 $and: [
  //                   {
  //                     $eq: [
  //                       '$userId',
  //                       userId ? new mongoose.Types.ObjectId(userId) : null,
  //                     ],
  //                   },
  //                   { $ne: ['$status', null] },
  //                 ],
  //               },
  //               '$status',
  //               null,
  //             ],
  //           },
  //         },
  //       },
  //     },
  //
  //     {
  //       $project: {
  //         postId: '$_id',
  //         likesCount: 1,
  //         dislikesCount: 1,
  //         myStatus: { $ifNull: ['$myStatus', LikeStatusValue.None] },
  //         newestLikes: { $slice: ['$likes', 3] },
  //         _id: 0,
  //       },
  //     },
  //
  //     // --- JOIN с users ---
  //     { $unwind: '$newestLikes' },
  //     {
  //       $lookup: {
  //         from: 'users',
  //         localField: 'newestLikes.userId',
  //         foreignField: '_id',
  //         as: 'user',
  //       },
  //     },
  //     { $unwind: '$user' },
  //
  //     {
  //       $addFields: {
  //         'newestLikes.login': '$user.login',
  //         'newestLikes.userId': { $toString: '$newestLikes.userId' },
  //         'newestLikes.addedAt': {
  //           $toString: '$newestLikes.createdAt',
  //         },
  //       },
  //     },
  //
  //     { $project: { user: 0, 'newestLikes.createdAt': 0 } },
  //
  //     // собираем назад newestLikes в массив
  //     {
  //       $group: {
  //         _id: '$postId',
  //         likesCount: { $first: '$likesCount' },
  //         dislikesCount: { $first: '$dislikesCount' },
  //         myStatus: { $first: '$myStatus' },
  //         newestLikes: { $push: '$newestLikes' },
  //       },
  //     },
  //
  //     {
  //       $project: {
  //         postId: '$_id',
  //         likesCount: 1,
  //         dislikesCount: 1,
  //         myStatus: 1,
  //         newestLikes: 1,
  //         _id: 0,
  //       },
  //     },
  //   ]);
  //
  //   const map = new Map<string, ExtendedLikesInfo>();
  //   for (const item of result) {
  //     map.set(item.postId.toString(), {
  //       likesCount: item.likesCount,
  //       dislikesCount: item.dislikesCount,
  //       myStatus: item.myStatus,
  //       newestLikes: item.newestLikes,
  //     });
  //   }
  //
  //   return map;
  // }

  // async findPostsNewestLikes(
  //   postIds: mongoose.Types.ObjectId[],
  //   userId?: string,
  // ) {
  //   const userIdObject = userId ? new mongoose.Types.ObjectId(userId) : null;
  //
  //   const result: GetPostsResult[] = await this.postLikeModel.aggregate([
  //     {
  //       $match: {
  //         postId: { $in: postIds },
  //         status: { $in: [LikeStatusValue.Like, LikeStatusValue.Dislike] },
  //         deletedAt: null,
  //       },
  //     },
  //
  //     {
  //       $lookup: {
  //         from: 'users',
  //         localField: 'userId',
  //         foreignField: '_id',
  //         as: 'user',
  //       },
  //     },
  //     { $unwind: '$user' },
  //
  //     // Добавляем login из user
  //     {
  //       $addFields: {
  //         login: '$user.login',
  //       },
  //     },
  //
  //     { $sort: { createdAt: -1 } },
  //
  //     {
  //       $group: {
  //         _id: '$postId',
  //         allLikes: { $push: '$$ROOT' },
  //         myStatus: {
  //           $max: {
  //             $cond: [
  //               {
  //                 $and: [
  //                   { $eq: ['$userId', userIdObject] },
  //                   { $ne: [userIdObject, null] },
  //                 ],
  //               },
  //               '$status',
  //               LikeStatusValue.None,
  //             ],
  //           },
  //         },
  //         likesCount: {
  //           $sum: {
  //             $cond: [{ $eq: ['$status', LikeStatusValue.Like] }, 1, 0],
  //           },
  //         },
  //         dislikesCount: {
  //           $sum: {
  //             $cond: [{ $eq: ['$status', LikeStatusValue.Dislike] }, 1, 0],
  //           },
  //         },
  //       },
  //     },
  //
  //     // Формируем newestLikes
  //     {
  //       $project: {
  //         postId: '$_id',
  //         likesCount: 1,
  //         dislikesCount: 1,
  //         myStatus: 1,
  //         newestLikes: {
  //           $slice: [
  //             {
  //               $map: {
  //                 input: {
  //                   $filter: {
  //                     input: '$allLikes',
  //                     as: 'like',
  //                     cond: { $eq: ['$$like.status', LikeStatusValue.Like] },
  //                   },
  //                 },
  //                 as: 'like',
  //                 in: {
  //                   addedAt: { $toString: '$$like.createdAt' },
  //                   userId: { $toString: '$$like.userId' },
  //                   login: '$$like.login',
  //                 },
  //               },
  //             },
  //             3,
  //           ],
  //         },
  //       },
  //     },
  //   ]);
  //
  //   const map = new Map<string, ExtendedLikesInfo>();
  //
  //   for (const item of result) {
  //     map.set(item.postId.toString(), {
  //       likesCount: item.likesCount,
  //       dislikesCount: item.dislikesCount,
  //       myStatus: item.myStatus,
  //       newestLikes: item.newestLikes,
  //     });
  //   }
  //
  //   for (const postId of postIds) {
  //     const postIdStr = postId.toString();
  //     if (!map.has(postIdStr)) {
  //       map.set(postIdStr, {
  //         likesCount: 0,
  //         dislikesCount: 0,
  //         myStatus: LikeStatusValue.None,
  //         newestLikes: [],
  //       });
  //     }
  //   }
  //
  //   return map;
  // }

  async findPostsNewestLikes(postIds: string[], userId?: string) {
    const result: GetPostsResult[] = await this.postLikeModel.aggregate([
      {
        $match: {
          postId: { $in: postIds },
          status: { $in: [LikeStatusValue.Like, LikeStatusValue.Dislike] },
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
      { $unwind: '$user' },
      {
        $addFields: {
          login: '$user.login',
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$postId',
          allLikes: { $push: '$$ROOT' },
          // myStatus: {
          //   $first: {
          //     $cond: [{ $eq: ['$userId', userIdObject] }, '$status', null],
          //   },
          // },
          // myStatus: {
          //   $max: {
          //     $cond: [
          //       {
          //         $and: [{ $eq: ['$userId', userId] }, { $ne: [userId, null] }],
          //       },
          //       '$status',
          //       LikeStatusValue.None,
          //     ],
          //   },
          // },
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
          newestLikes: {
            $slice: [
              {
                $map: {
                  input: {
                    $filter: {
                      input: '$allLikes',
                      as: 'like',
                      cond: { $eq: ['$$like.status', LikeStatusValue.Like] },
                    },
                  },
                  as: 'like',
                  in: {
                    addedAt: { $toString: '$$like.createdAt' },
                    userId: '$$like.userId',
                    login: '$$like.login',
                  },
                },
              },
              3,
            ],
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
          postId: '$_id',
          likesCount: 1,
          dislikesCount: 1,
          myStatus: 1,
          newestLikes: 1,
          // newestLikes: {
          // $slice: [
          //   {
          //     $map: {
          //       input: {
          //         $filter: {
          //           input: '$allLikes',
          //           as: 'like',
          //           cond: { $eq: ['$$like.status', LikeStatusValue.Like] },
          //         },
          //       },
          //       as: 'like',
          //       in: {
          //         addedAt: { $toString: '$$like.createdAt' },
          //         userId: { $toString: '$$like.userId' },
          //         login: '$$like.login',
          //       },
          //     },
          //   },
          //   3,
          // ],
          // },
        },
      },
    ]);

    const map = new Map<string, ExtendedLikesInfo>();

    for (const item of result) {
      map.set(item.postId.toString(), {
        likesCount: item.likesCount,
        dislikesCount: item.dislikesCount,
        myStatus: item.myStatus,
        newestLikes: item.newestLikes,
      });
    }

    // Добавляем дефолтные значения для постов без лайков
    for (const postId of postIds) {
      const postIdStr = postId.toString();
      if (!map.has(postIdStr)) {
        map.set(postIdStr, {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: LikeStatusValue.None,
          newestLikes: [],
        });
      }
    }

    return map;
  }

  private async getNewestLikesWithLogins(
    postId: string,
  ): Promise<NewestLikes[]> {
    const result: NewestLikesDb[] = await this.postLikeModel.aggregate([
      {
        $match: {
          postId: new mongoose.Types.ObjectId(postId),
          status: LikeStatusValue.Like,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $limit: 3,
      },
      {
        $lookup: {
          from: 'users', // коллекция для JOIN
          localField: 'userId', // поле из postLikeModel
          foreignField: '_id', // поле из users коллекции
          as: 'user', // куда положить результат
        },
      },
      {
        $unwind: '$user', // преобразуем массив в объект
      },
      {
        $project: {
          addedAt: { $toIsoString: '$createdAt' }, // переименовываем createdAt в addedAt
          userId: { $toString: '$userId' }, // конвертируем в string сразу
          login: '$user.login', // берем login из joined пользователя
        },
      },
    ]);

    return result.map((like) => ({
      userId: like.userId,
      login: like.login,
      addedAt: like.addedAt.toISOString(),
    }));
  }
}
