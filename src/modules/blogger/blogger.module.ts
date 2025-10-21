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
import { CommentLikesQueryRepository } from './comment-likes/infrastructure/comment-likes.repository';
import {
  CommentLike,
  CommentLikeSchema,
} from './comment-likes/domain/comment-like.entity';
import { Comment, CommentSchema } from './comments/domain/comment.entity';

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
    CommentsQueryRepository,
    CommentLikesQueryRepository,
    BlogsRepository,
    PostsRepository,
    PostLikesQueryRepository,
  ],
})
export class BloggerModule {}
