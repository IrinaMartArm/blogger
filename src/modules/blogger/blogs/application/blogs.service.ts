import { Injectable } from '@nestjs/common';
import {
  CreateBlogInputDto,
  UpdateBlogInputDto,
} from '../api/input-dto/blogs.input-dto';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../domain/blog.entity';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { CreatePostByBlogIdInputDto } from '../api/input-dto/post.input-dto';
import { PostsService } from '../../posts/application/posts.service';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Types } from 'mongoose';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name) private BlogModel: BlogModelType,
    private blogRepository: BlogsRepository,
    private postsService: PostsService,
  ) {}
  async createBlog(body: CreateBlogInputDto) {
    const blog = this.BlogModel.createInstance(body);
    await this.blogRepository.save(blog);
    return blog._id;
  }

  async update(id: string, body: UpdateBlogInputDto) {
    const blog = await this.blogRepository.findBlog(id);
    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'No blog found.',
      });
    }
    blog.update(body);
    return this.blogRepository.save(blog);
  }

  async deleteBlog(id: Types.ObjectId) {
    const blog = await this.blogRepository.findBlog(id);
    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'No blog found',
      });
    }
    blog.makeDeleted();

    return this.blogRepository.save(blog);
  }

  async createPostForBlog(blogId: string, body: CreatePostByBlogIdInputDto) {
    return this.postsService.createPost({ ...body, blogId });
  }
}
