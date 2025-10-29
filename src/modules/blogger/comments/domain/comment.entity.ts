import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Model, Types } from 'mongoose';
import { CreateCommentInputDto } from '../../posts/api/input-dto/posts.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  postId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;

  createdAt: Date;

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  static createInstance(
    dto: CreateCommentInputDto,
    postId: string,
    userId: string,
  ) {
    const comment = new this();

    comment.content = dto.content;
    comment.createdAt = new Date();
    comment.postId = new Types.ObjectId(postId);
    comment.userId = new Types.ObjectId(userId);
    comment.deletedAt = null;

    return comment as CommentDocument;
  }

  update(content: string, editorId: string) {
    if (this.userId.toString() !== editorId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Not owner',
      });
    }
    this.content = content;
  }

  makeDeleted(editorId: string) {
    if (this.userId.toString() !== editorId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Not owner',
      });
    }
    if (this.deletedAt !== null) {
      return;
    }
    this.deletedAt = new Date();
  }
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.loadClass(Comment);

// CommentSchema.index({ userId: 1 });
// CommentSchema.index({ postId: 1, createdAt: -1 });
// CommentSchema.index({ postId: 1, deletedAt: 1 });

export type CommentDocument = HydratedDocument<Comment>;

export type CommentModelType = Model<CommentDocument> & typeof Comment;
