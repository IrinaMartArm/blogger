import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateBlogInputDto,
  UpdateBlogInputDto,
} from '../api/input-dto/blogs.input-dto';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../domain/blog.entity';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { CreatePostByBlogIdInputDto } from '../api/input-dto/post.input-dto';
import { PostsService } from '../../posts/application/posts.service';

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
    return blog._id.toString();
  }

  async update(id: string, body: UpdateBlogInputDto) {
    const blog = await this.blogRepository.findBlog(id);
    if (!blog) {
      throw new NotFoundException();
    }
    blog.update(body);
    return this.blogRepository.save(blog);
  }

  async deleteBlog(id: string) {
    const blog = await this.blogRepository.findBlog(id);
    if (!blog) {
      throw new NotFoundException();
    }
    blog.makeDeleted();

    console.log(blog.deletedAt);

    return this.blogRepository.save(blog);
  }

  async createPostForBlog(blogId: string, body: CreatePostByBlogIdInputDto) {
    return this.postsService.createPost({ ...body, blogId });
  }
}
