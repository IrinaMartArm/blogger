import { LikeStatusValue } from '../../dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { InjectModel } from '@nestjs/mongoose';
import { PostLike, PostLikeModelType } from '../../domain/post-likes.entity';
import { PostLikesRepository } from '../../infrastructure/post-likes.repository';

export class SetPostLikeStatusCommand {
  constructor(
    public postId: string,
    public currentUserId: string,
    public status: LikeStatusValue,
  ) {}
}

@CommandHandler(SetPostLikeStatusCommand)
export class SetPostLikeStatusUseCase
  implements ICommandHandler<SetPostLikeStatusCommand>
{
  constructor(
    @InjectModel(PostLike.name) private readonly postLike: PostLikeModelType,
    private readonly postsRepository: PostsRepository,
    private readonly postLikesRepository: PostLikesRepository,
  ) {}
  async execute({ postId, status, currentUserId }: SetPostLikeStatusCommand) {
    const post = await this.postsRepository.getPost(postId.toString());

    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found.',
      });
    }

    const existingLike = await this.postLikesRepository.findLike(
      currentUserId,
      postId,
    );

    if (existingLike) {
      if (status === LikeStatusValue.None) {
        await this.postLikesRepository.delete(existingLike._id);
      } else {
        existingLike.update(status);
        await this.postLikesRepository.save(existingLike);
      }
    } else {
      const like = this.postLike.createInstance(currentUserId, postId, status);
      await this.postLikesRepository.save(like);
    }
  }
}
