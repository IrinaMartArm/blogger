import { Controller, Get, Param } from '@nestjs/common';
import { CommentsQueryRepository } from '../infrastructure/comments.query-repository';
import { CommentsViewDto } from './view-dto/comments.view-dto';

@Controller('comments')
export class CommentsController {
  constructor(private commentsQueryRepository: CommentsQueryRepository) {}

  @Get('/:id')
  async getComment(@Param('id') id: string): Promise<CommentsViewDto> {
    return this.commentsQueryRepository.getComment(id);
  }
}
