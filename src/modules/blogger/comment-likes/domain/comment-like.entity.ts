import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LikeStatusValue } from '../../post-likes/dto';
import { HydratedDocument, Model, Types } from 'mongoose';

@Schema({ timestamps: true })
export class CommentLike {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true, index: true })
  commentId: string;

  @Prop({ type: String, required: true })
  status: LikeStatusValue;

  createdAt: Date;
  deletedAt: Date | null;

  static createInstance(
    status: LikeStatusValue,
    commentId: Types.ObjectId,
    userId: string,
  ) {
    const like = new this();
    like.commentId = commentId.toString();
    like.userId = userId;
    like.status = status;

    return like as CommentLikeDocument;
  }

  update(status: LikeStatusValue) {
    if (status === LikeStatusValue.None) {
      this.delete();
    } else {
      this.status = status;
    }
  }

  delete() {
    if (this.deletedAt) {
      return;
    }
    this.deletedAt = new Date();
  }
}

export const CommentLikeSchema = SchemaFactory.createForClass(CommentLike);

CommentLikeSchema.loadClass(CommentLike);

CommentLikeSchema.index({ userId: 1, commentId: 1 }, { unique: true });
CommentLikeSchema.index({ createdAt: -1 });

export type CommentLikeDocument = HydratedDocument<CommentLike>;

export type CommentLikeModelType = Model<CommentLikeDocument> &
  typeof CommentLike;
