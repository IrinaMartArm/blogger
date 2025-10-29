import { Injectable } from '@nestjs/common';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../domain/comment.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: CommentModelType,
  ) {}

  async save(comment: CommentDocument): Promise<void> {
    await comment.save();
  }

  async findComment(
    commentId: Types.ObjectId,
  ): Promise<CommentDocument | null> {
    return this.commentModel.findOne({ _id: commentId, deletedAt: null });
  }
}
