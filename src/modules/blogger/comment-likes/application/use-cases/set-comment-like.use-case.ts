import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Types } from 'mongoose';
import { CommentsRepository } from '../../../comments/infrastructure/comments.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { InjectModel } from '@nestjs/mongoose';
import {
  CommentLike,
  CommentLikeModelType,
} from '../../domain/comment-like.entity';
import { LikeStatusValue } from '../../../post-likes/dto';
import { CommentLikesRepository } from '../../infrastructure/comment-likes.repository';

export class SetCommentLikeCommand {
  constructor(
    public readonly commentId: Types.ObjectId,
    public readonly currentUserId: string,
    public likeStatus: LikeStatusValue,
  ) {}
}

@CommandHandler(SetCommentLikeCommand)
export class SetCommentLikeUseCase
  implements ICommandHandler<SetCommentLikeCommand>
{
  constructor(
    @InjectModel(CommentLike.name)
    private readonly commentLike: CommentLikeModelType,
    private readonly commentsRepository: CommentsRepository,
    private readonly commentLikesRepository: CommentLikesRepository,
  ) {}
  async execute({
    likeStatus,
    commentId,
    currentUserId,
  }: SetCommentLikeCommand): Promise<void> {
    const comment = await this.commentsRepository.findComment(commentId);

    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found.',
      });
    }

    const existingLike = await this.commentLikesRepository.findLike(
      commentId.toString(),
      currentUserId,
    );

    if (existingLike) {
      if (likeStatus === LikeStatusValue.None) {
        await this.commentLikesRepository.delete(existingLike._id);
      } else {
        existingLike.update(likeStatus);
        await this.commentLikesRepository.save(existingLike);
      }
    } else {
      const newLike = this.commentLike.createInstance(
        likeStatus,
        commentId,
        currentUserId,
      );
      return this.commentLikesRepository.save(newLike);
    }
  }
}
