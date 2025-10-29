import { Injectable } from '@nestjs/common';
import {
  PostLike,
  PostLikeDocument,
  PostLikeModelType,
} from '../domain/post-likes.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Injectable()
export class PostLikesRepository {
  constructor(
    @InjectModel(PostLike.name) private postLikeModel: PostLikeModelType,
  ) {}
  async save(like: PostLikeDocument) {
    await like.save();
  }

  async findLike(
    userId: string,
    postId: string,
  ): Promise<PostLikeDocument | null> {
    return this.postLikeModel.findOne({ userId, postId, deletedAt: null });
  }

  async delete(likeId: Types.ObjectId): Promise<void> {
    await this.postLikeModel.deleteOne({ _id: likeId });
  }
}
