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
import { PostsService } from '../application/posts.service';
import {
  CreatePostInputDto,
  PostsQueryParams,
  UpdatePostInputDto,
} from './input-dto/posts.input-dto';
import { PostViewDto } from './view-dto/post.view-dto';
import { PostsQueryRepository } from '../infrastructure/posts-query.repository';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';

@Controller('posts')
export class PostsController {
  constructor(
    private postsService: PostsService,
    private postsQueryRepository: PostsQueryRepository,
  ) {}

  @Post()
  async createPost(@Body() post: CreatePostInputDto): Promise<PostViewDto> {
    const postId = await this.postsService.createPost(post);
    return this.postsQueryRepository.findPost(postId);
  }

  @Get('/:id')
  async getPost(@Param('id') id: string): Promise<PostViewDto> {
    return this.postsQueryRepository.findPost(id);
  }

  @Get()
  async getPosts(
    @Query() query: PostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.postsQueryRepository.findPosts(query);
  }

  @Put('/:id')
  async updatePost(
    @Param('id') id: string,
    @Body() post: UpdatePostInputDto,
  ): Promise<void> {
    return this.postsService.updatePost(id, post);
  }

  @Delete('/:id')
  async deletePost(@Param('id') id: string): Promise<void> {
    return this.postsService.deletePost(id);
  }
}
