import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Model } from 'mongoose';

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  postId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;

  createdAt: Date;

  @Prop({ type: Date, nullable: true })
  deletedAt: Date | null;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.loadClass(Comment);

CommentSchema.index({ userId: 1 });
CommentSchema.index({ postId: 1, userId: 1 }, { unique: true });
CommentSchema.index({ postId: 1, createdAt: -1 });
CommentSchema.index({ postId: 1, deletedAt: 1 });

export type CommentDocument = HydratedDocument<Comment>;

export type CommentModelType = Model<CommentDocument> & typeof Comment;
