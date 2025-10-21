import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { LikeStatusValue } from '../dto';

@Schema({ timestamps: true })
export class PostLike {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true, index: true })
  postId: string;

  @Prop({ type: String, required: true })
  status: LikeStatusValue;

  createdAt: Date;

  static create(userId: string, postId: string, status: LikeStatusValue) {
    const like = new this();

    like.userId = userId;
    like.postId = postId;
    like.status = status;

    return like as PostLikeDocument;
  }
}

export const PostLikeSchema = SchemaFactory.createForClass(PostLike);

PostLikeSchema.loadClass(PostLike);

export type PostLikeDocument = HydratedDocument<PostLike>;

export type PostLikeModelType = Model<PostLikeDocument> & typeof PostLike;
