import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LikeStatusValue } from '../../post-likes/dto';
import { HydratedDocument, Model } from 'mongoose';

@Schema({ timestamps: true })
export class CommentLike {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true, index: true })
  commentId: string;

  @Prop({ type: String, required: true })
  status: LikeStatusValue;

  createdAt: Date;

  static create() {}
}

export const CommentLikeSchema = SchemaFactory.createForClass(CommentLike);

CommentLikeSchema.loadClass(CommentLike);

CommentLikeSchema.index({ userId: 1, commentId: 1 }, { unique: true });
CommentLikeSchema.index({ createdAt: -1 });

export type CommentLikeDocument = HydratedDocument<CommentLike>;

export type CommentLikeModelType = Model<CommentLikeDocument> &
  typeof CommentLike;
