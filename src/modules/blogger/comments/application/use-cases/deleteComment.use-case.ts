import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { Types } from 'mongoose';

export class DeleteCommentCommand {
  constructor(
    public readonly commentId: Types.ObjectId,
    public readonly currentUserId: string,
  ) {}
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentsUseCase
  implements ICommandHandler<DeleteCommentCommand>
{
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async execute({
    commentId,
    currentUserId,
  }: DeleteCommentCommand): Promise<void> {
    const comment = await this.commentsRepository.findComment(commentId);

    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Could not find comment',
      });
    }

    comment.makeDeleted(currentUserId);
    await this.commentsRepository.save(comment);
  }
}
