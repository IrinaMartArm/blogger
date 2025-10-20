import { Module } from '@nestjs/common';
import { BlogsController } from './blogs/api/blogs.controller';
import { BlogsService } from './blogs/application/blogs.service';
import { BlogsQueryRepository } from './blogs/infrastructure/blogs.query-repository';
import { BlogsRepository } from './blogs/infrastructure/blogs.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/domain/blog.entity';
import { PostsController } from './posts/api/posts.controller';
import { PostLikesRepository } from './post-likes/post-likes.repository';
import { PostsService } from './posts/application/posts.service';
import { PostsRepository } from './posts/infrastructure/posts.repository';
import { PostsQueryRepository } from './posts/infrastructure/posts-query.repository';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { Post, PostSchema } from './posts/domain/post.entity';
import {
  PostLike,
  PostLikeSchema,
} from './post-likes/domain/post-likes.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: PostLike.name, schema: PostLikeSchema },
    ]),
    UserAccountsModule,
  ],
  controllers: [BlogsController, PostsController],
  providers: [
    BlogsService,
    PostsService,
    BlogsQueryRepository,
    PostsQueryRepository,
    BlogsRepository,
    PostsRepository,
    PostLikesRepository,
  ],
})
export class BloggerModule {}
