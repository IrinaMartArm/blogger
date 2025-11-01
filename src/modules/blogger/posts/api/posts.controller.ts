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
import { PostsService } from '../application/posts.service';
import {
  CreateCommentInputDto,
  CreatePostInputDto,
  PostsQueryParams,
  UpdatePostInputDto,
} from './input-dto/posts.input-dto';
import { CommentViewDto, PostViewDto } from './view-dto/post.view-dto';
import { PostsQueryRepository } from '../infrastructure/posts-query.repository';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CommentsViewDto } from '../../comments/api/view-dto/comments.view-dto';
import { GetCommentsQueryParams } from './input-dto/get-comments-query-params.input-dto';
import { BasicAuthGuard } from '../../../user-accounts/auth/guards/basic/basic-auth.guard';
import { JwtAuthGuard } from '../../../user-accounts/auth/guards/bearer/jwt-auth.guard';
import { GetUserFromRequest } from '../../../user-accounts/decorators/param/getUserFromRequest';
import { UserContextDto } from '../../../user-accounts/dto/user-context.dto';
import { CommandBus } from '@nestjs/cqrs';
import { CreateCommentCommand } from '../application/use-cases/createComment.use-case';
import { ObjectIdValidationPipe } from '../../../../core/pipes/objectId-validation.pipe';
import { LikeInputDto } from '../../post-likes/dto';
import { Types } from 'mongoose';
import { SetPostLikeStatusCommand } from '../../post-likes/applications/use-cases/set-post-like.use-case';
import { OptionalJwtAuthGuard } from '../../../user-accounts/auth/guards/bearer/optional-jwt-auth.guard';
import { CommentsQueryRepository } from '../../comments/infrastructure/comments.query-repository';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private postsService: PostsService,
    private postsQueryRepository: PostsQueryRepository,
    private commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Post()
  @UseGuards(BasicAuthGuard)
  async createPost(@Body() post: CreatePostInputDto): Promise<PostViewDto> {
    const postId = await this.postsService.createPost(post);
    return this.postsQueryRepository.findPost(postId);
  }

  @Get('/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async getPost(
    @Param('id', ObjectIdValidationPipe) id: string,
    @GetUserFromRequest() user?: UserContextDto,
  ): Promise<PostViewDto> {
    const userId = user?.currentUserId;
    return this.postsQueryRepository.findPost(id, userId);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getPosts(
    @Query() query: PostsQueryParams,
    @GetUserFromRequest() user?: UserContextDto,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const userId = user?.currentUserId;
    return this.postsQueryRepository.findPosts(query, userId);
  }

  @Put('/:id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body() post: UpdatePostInputDto,
  ): Promise<void> {
    return this.postsService.updatePost(id, post);
  }

  @Delete('/:id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(
    @Param('id', ObjectIdValidationPipe) id: string,
  ): Promise<void> {
    return this.postsService.deletePost(id);
  }

  @Get('/:id/comments')
  @UseGuards(OptionalJwtAuthGuard)
  async getPostComments(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Query() query: GetCommentsQueryParams,
    @GetUserFromRequest() user?: UserContextDto,
  ): Promise<PaginatedViewDto<CommentsViewDto[]>> {
    return this.postsQueryRepository.getComments(
      id,
      query,
      user?.currentUserId,
    );
  }

  @Post('/:id/comments')
  @UseGuards(JwtAuthGuard)
  async createCommentForPost(
    @GetUserFromRequest() user: UserContextDto,
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body() body: CreateCommentInputDto,
  ): Promise<CommentViewDto> {
    const commentId: Types.ObjectId = await this.commandBus.execute(
      new CreateCommentCommand(body, id, user.currentUserId),
    );

    return this.commentsQueryRepository.getComment(
      commentId,
      user.currentUserId,
    );
  }

  @Put(':id/like-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async setPostLikeStatus(
    @Param('id', ObjectIdValidationPipe) id: Types.ObjectId,
    @GetUserFromRequest() user: UserContextDto,
    @Body() body: LikeInputDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new SetPostLikeStatusCommand(
        id.toString(),
        user.currentUserId,
        body.likeStatus,
      ),
    );
  }
}
