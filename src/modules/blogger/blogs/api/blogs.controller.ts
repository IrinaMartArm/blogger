import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
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
import { BasicAuthGuard } from '../../../user-accounts/auth/guards/basic/basic-auth.guard';
import { ObjectIdValidationPipe } from '../../../../core/pipes/objectId-validation.pipe';
import { Types } from 'mongoose';
import { OptionalJwtAuthGuard } from '../../../user-accounts/auth/guards/bearer/optional-jwt-auth.guard';
import { GetUserFromRequest } from '../../../user-accounts/decorators/param/getUserFromRequest';
import { UserContextDto } from '../../../user-accounts/dto/user-context.dto';

@Controller('blogs')
export class BlogsController {
  constructor(
    private blogsService: BlogsService,
    private blogsQueryRepository: BlogsQueryRepository,
    private postsQueryRepository: PostsQueryRepository,
  ) {}

  @Post()
  @UseGuards(BasicAuthGuard)
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
  async getBlog(
    @Param('id', ObjectIdValidationPipe) id: Types.ObjectId,
  ): Promise<BlogViewDto> {
    return this.blogsQueryRepository.getBlogById(id);
  }

  @Put('/:id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id', ObjectIdValidationPipe) id: Types.ObjectId,
    @Body() body: UpdateBlogInputDto,
  ): Promise<void> {
    return this.blogsService.update(id.toString(), body);
  }

  @Delete('/:id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(
    @Param('id', ObjectIdValidationPipe) id: Types.ObjectId,
  ): Promise<void> {
    return this.blogsService.deleteBlog(id);
  }

  @Get('/:id/posts')
  @UseGuards(OptionalJwtAuthGuard)
  async getPosts(
    @Param('id', ObjectIdValidationPipe) id: Types.ObjectId,
    @Query() query: PostsQueryParams,
    @GetUserFromRequest() user?: UserContextDto,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.blogsQueryRepository.findPosts(id, query, user?.currentUserId);
  }

  @Post('/:id/posts')
  @UseGuards(BasicAuthGuard)
  async createPostForBlog(
    @Param('id', ObjectIdValidationPipe) id: Types.ObjectId,
    @Body() body: CreatePostByBlogIdInputDto,
  ): Promise<PostViewDto> {
    const postId = await this.blogsService.createPostForBlog(
      id.toString(),
      body,
    );
    return this.postsQueryRepository.findPost(postId);
  }
}
