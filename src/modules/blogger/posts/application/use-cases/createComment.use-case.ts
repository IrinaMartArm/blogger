import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCommentInputDto } from '../../api/input-dto/posts.input-dto';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { InjectModel } from '@nestjs/mongoose';
import {
  CommentModelType,
  Comment,
} from '../../../comments/domain/comment.entity';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CommentsRepository } from '../../../comments/infrastructure/comments.repository';
import { Types } from 'mongoose';

export class CreateCommentCommand {
  constructor(
    public readonly dto: CreateCommentInputDto,
    public readonly postId: string,
    public readonly currenUserId: string,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand>
{
  constructor(
    @InjectModel(Comment.name) private readonly comment: CommentModelType,
    private readonly postsRepository: PostsRepository,
    private readonly commentsRepository: CommentsRepository,
  ) {}

  async execute({
    dto,
    postId,
    currenUserId,
  }: CreateCommentCommand): Promise<Types.ObjectId> {
    const post = await this.postsRepository.getPost(postId);
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
        extensions: [{ message: 'Post not found', field: 'postId' }],
      });
    }

    const comment = this.comment.createInstance(dto, postId, currenUserId);
    await this.commentsRepository.save(comment);
    return comment._id;
  }
}
