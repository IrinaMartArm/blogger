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
  deletedAt: Date | null;

  static createInstance(
    userId: string,
    postId: string,
    status: LikeStatusValue,
  ) {
    const like = new this();

    like.userId = userId;
    like.postId = postId;
    like.status = status;
    like.createdAt = new Date();

    return like as PostLikeDocument;
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

export const PostLikeSchema = SchemaFactory.createForClass(PostLike);

PostLikeSchema.loadClass(PostLike);

export type PostLikeDocument = HydratedDocument<PostLike>;

export type PostLikeModelType = Model<PostLikeDocument> & typeof PostLike;
