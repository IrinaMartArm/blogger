import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CommentLike,
  CommentLikeDocument,
  CommentLikeModelType,
} from '../domain/comment-like.entity';
import { Types } from 'mongoose';

@Injectable()
export class CommentLikesRepository {
  constructor(
    @InjectModel(CommentLike.name)
    private readonly commentModel: CommentLikeModelType,
  ) {}

  async save(commentLike: CommentLikeDocument): Promise<void> {
    await commentLike.save();
  }

  async findLike(commentId: string, userId: string) {
    return this.commentModel.findOne({ commentId, userId, deletedAt: null });
  }

  async delete(id: Types.ObjectId): Promise<void> {
    await this.commentModel.deleteMany({ _id: id });
  }
}
