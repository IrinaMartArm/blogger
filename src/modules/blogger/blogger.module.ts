import { Module } from '@nestjs/common';
import { BlogsController } from './blogs/api/blogs.controller';
import { BlogsService } from './blogs/application/blogs.service';
import { BlogsQueryRepository } from './blogs/infrastructure/blogs.query-repository';
import { BlogsRepository } from './blogs/infrastructure/blogs.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/domain/blog.entity';
import { PostsController } from './posts/api/posts.controller';
import { PostLikesQueryRepository } from './post-likes/infrastructure/post-likes.query-repository';
import { PostsService } from './posts/application/posts.service';
import { PostsRepository } from './posts/infrastructure/posts.repository';
import { PostsQueryRepository } from './posts/infrastructure/posts-query.repository';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { Post, PostSchema } from './posts/domain/post.entity';
import {
  PostLike,
  PostLikeSchema,
} from './post-likes/domain/post-likes.entity';
import { CommentsController } from './comments/api/comments.controller';
import { CommentsQueryRepository } from './comments/infrastructure/comments.query-repository';
import { CommentLikesRepository } from './comment-likes/infrastructure/comment-likes.repository';
import {
  CommentLike,
  CommentLikeSchema,
} from './comment-likes/domain/comment-like.entity';
import { Comment, CommentSchema } from './comments/domain/comment.entity';
import { CommentsRepository } from './comments/infrastructure/comments.repository';
import { DeleteCommentsUseCase } from './comments/application/use-cases/deleteComment.use-case';
import { UpdateCommentUseCase } from './comments/application/use-cases/updateComment.use-case';
import { SetPostLikeStatusUseCase } from './post-likes/applications/use-cases/set-post-like.use-case';
import { PostLikesRepository } from './post-likes/infrastructure/post-likes.repository';
import { CreateCommentUseCase } from './posts/application/use-cases/createComment.use-case';
import { SetCommentLikeUseCase } from './comment-likes/application/use-cases/set-comment-like.use-case';
import { CommentLikesQueryRepository } from './comment-likes/infrastructure/comment-likes.query-repository';

const useCases = [
  DeleteCommentsUseCase,
  UpdateCommentUseCase,
  SetPostLikeStatusUseCase,
  CreateCommentUseCase,
  SetCommentLikeUseCase,
];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: PostLike.name, schema: PostLikeSchema },
      { name: CommentLike.name, schema: CommentLikeSchema },
    ]),
    UserAccountsModule,
  ],
  controllers: [BlogsController, PostsController, CommentsController],
  providers: [
    BlogsService,
    PostsService,
    BlogsQueryRepository,
    PostsQueryRepository,
    PostLikesRepository,
    CommentsQueryRepository,
    CommentsRepository,
    CommentLikesQueryRepository,
    CommentLikesRepository,
    BlogsRepository,
    PostsRepository,
    PostLikesQueryRepository,
    ...useCases,
  ],
})
export class BloggerModule {}
