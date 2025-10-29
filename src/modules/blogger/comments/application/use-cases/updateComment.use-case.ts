import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { Types } from 'mongoose';

export class UpdateCommentCommand {
  constructor(
    public currentUserId: string,
    public commentId: Types.ObjectId,
    public body: string,
  ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase
  implements ICommandHandler<UpdateCommentCommand>
{
  constructor(private readonly commentsRepository: CommentsRepository) {}
  async execute({ commentId, currentUserId, body }: UpdateCommentCommand) {
    const comment = await this.commentsRepository.findComment(commentId);
    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Could not find comment',
      });
    }

    comment.update(body, currentUserId);
    await this.commentsRepository.save(comment);
  }
}
