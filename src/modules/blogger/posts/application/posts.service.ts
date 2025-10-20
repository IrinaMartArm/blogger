import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../domain/post.entity';
import {
  CreatePostInputDto,
  UpdatePostInputDto,
} from '../api/input-dto/posts.input-dto';
import { BlogsRepository } from '../../blogs/infrastructure/blogs.repository';
import { PostsRepository } from '../infrastructure/posts.repository';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: PostModelType,
    private blogsRepository: BlogsRepository,
    private postsRepository: PostsRepository,
  ) {}

  async createPost(dto: CreatePostInputDto): Promise<string> {
    const blog = await this.blogsRepository.findBlog(dto.blogId);

    if (!blog) {
      throw new NotFoundException();
    }
    const post = this.postModel.createInstance(dto, blog.name);
    await this.postsRepository.save(post);
    return post._id.toString();
  }

  async updatePost(postId: string, dto: UpdatePostInputDto): Promise<void> {
    const post = await this.postsRepository.getPost(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.blogId !== dto.blogId) {
      const blog = await this.blogsRepository.findBlog(dto.blogId);
      if (!blog) {
        throw new NotFoundException('Blog not found');
      }
      post.blogName = blog.name;
    }

    post.update(dto);
    return this.postsRepository.save(post);
  }

  async deletePost(postId: string): Promise<void> {
    console.log('postId', postId);
    const post = await this.postsRepository.getPost(postId);
    console.log('post', post?._id);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    post.makeDeleted();
    return this.postsRepository.save(post);
  }
}
