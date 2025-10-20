import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { BlogsService } from '../application/blogs.service';
import { BlogsQueryRepository } from '../infrastructure/blogs.query-repository';
import {
  CreateBlogInputDto,
  UpdateBlogInputDto,
} from './input-dto/blogs.input-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';
import { BlogViewDto } from './view-dto/blog.view-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { PostViewDto } from '../../posts/api/view-dto/post.view-dto';
import { PostsQueryParams } from '../../posts/api/input-dto/posts.input-dto';
import { CreatePostByBlogIdInputDto } from './input-dto/post.input-dto';
import { PostsQueryRepository } from '../../posts/infrastructure/posts-query.repository';

@Controller('blogs')
export class BlogsController {
  constructor(
    private blogsService: BlogsService,
    private blogsQueryRepository: BlogsQueryRepository,
    private postsQueryRepository: PostsQueryRepository,
  ) {}

  @Post()
  async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogViewDto> {
    const blogId = await this.blogsService.createBlog(body);
    return this.blogsQueryRepository.getBlogById(blogId);
  }

  @Get()
  async getBlogs(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.blogsQueryRepository.getBlogs(query);
  }

  @Get('/:id')
  async getBlog(@Param('id') id: string): Promise<BlogViewDto> {
    return this.blogsQueryRepository.getBlogById(id);
  }

  @Put('/:id')
  async updateBlog(
    @Param('id') id: string,
    @Body() body: UpdateBlogInputDto,
  ): Promise<void> {
    return this.blogsService.update(id, body);
  }

  @Delete('/:id')
  async deleteBlog(@Param('id') id: string): Promise<void> {
    return this.blogsService.deleteBlog(id);
  }

  @Get('/:id/posts')
  async getPosts(
    @Param('id') id: string,
    @Query() query: PostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.blogsQueryRepository.findPosts(id, query);
  }

  @Post('/:id/posts')
  async createPostForBlog(
    @Param('id') id: string,
    @Body() body: CreatePostByBlogIdInputDto,
  ): Promise<PostViewDto> {
    const postId = await this.blogsService.createPostForBlog(id, body);
    return this.postsQueryRepository.findPost(postId);
  }
}
