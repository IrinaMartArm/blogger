import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommentsQueryRepository } from '../infrastructure/comments.query-repository';
import { CommentsViewDto } from './view-dto/comments.view-dto';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteCommentCommand } from '../application/use-cases/deleteComment.use-case';
import { ObjectIdValidationPipe } from '../../../../core/pipes/objectId-validation.pipe';
import { UpdateCommentCommand } from '../application/use-cases/updateComment.use-case';
import { UpdateCommentInputDto } from '../../posts/api/input-dto/posts.input-dto';
import { GetUserFromRequest } from '../../../user-accounts/decorators/param/getUserFromRequest';
import { UserContextDto } from '../../../user-accounts/dto/user-context.dto';
import { Types } from 'mongoose';
import { SetCommentLikeCommand } from '../../comment-likes/application/use-cases/set-comment-like.use-case';
import { LikeInputDto } from '../../post-likes/dto';
import { OptionalJwtAuthGuard } from '../../../user-accounts/guards/bearer/optional-jwt-auth.guard';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Get('/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async getComment(
    @Param('id', ObjectIdValidationPipe) id: Types.ObjectId,
    @GetUserFromRequest() user?: UserContextDto,
  ): Promise<CommentsViewDto> {
    return this.commentsQueryRepository.getComment(id, user?.currentUserId);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('id', ObjectIdValidationPipe) id: Types.ObjectId,
    @GetUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    const { currentUserId } = user;
    return this.commandBus.execute(new DeleteCommentCommand(id, currentUserId));
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateComment(
    @Param('id', ObjectIdValidationPipe) id: Types.ObjectId,
    @Body() body: UpdateCommentInputDto,
    @GetUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    const { currentUserId } = user;
    return this.commandBus.execute(
      new UpdateCommentCommand(currentUserId, id, body.content),
    );
  }

  @Put('/:id/like-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async likeStatus(
    @Param('id', ObjectIdValidationPipe) id: Types.ObjectId,
    @GetUserFromRequest() user: UserContextDto,
    @Body() body: LikeInputDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new SetCommentLikeCommand(id, user.currentUserId, body.likeStatus),
    );
  }
}
