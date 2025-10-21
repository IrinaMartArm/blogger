import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  CreatePostInputDto,
  UpdatePostInputDto,
} from '../api/input-dto/posts.input-dto';
import mongoose, { HydratedDocument, Model } from 'mongoose';

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  shortDescription: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, required: true })
  blogId: string;

  @Prop({ type: String, required: true })
  blogName: string;

  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: Date, nullable: true })
  deletedAt: Date | null;

  static createInstance(
    dto: CreatePostInputDto,
    blogName: string,
  ): PostDocument {
    const post = new this();

    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.blogName = blogName;

    return post as PostDocument;
  }

  update(dto: UpdatePostInputDto) {
    this.title = dto.title;
    this.shortDescription = dto.shortDescription;
    this.content = dto.content;
    this.blogId = dto.blogId;

    return this;
  }

  makeDeleted() {
    if (this.deletedAt !== undefined) {
      return;
    }
    this.deletedAt = new Date();
  }
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.loadClass(Post);

PostSchema.index({ blogId: 1 });
PostSchema.index({ deletedAt: 1 });
PostSchema.index({ blogId: 1, createdAt: -1 });

export type PostDocument = HydratedDocument<Post>;

export type PostModelType = Model<PostDocument> & typeof Post;

export type PostDBType = Post & { _id: mongoose.Types.ObjectId };
