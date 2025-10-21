export class CommentsViewDto {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
  likesInfo: LikesInfo;
  static mapToView(
    dto: CommentWithUserInfoDb,
    likesInfo?: LikesInfo,
  ): CommentsViewDto {
    const comment = new CommentsViewDto();
    comment.id = dto.id;
    comment.content = dto.content;
    comment.createdAt = dto.createdAt.toISOString();
    comment.commentatorInfo = {
      userId: dto.commentatorInfo.userId,
      userLogin: dto.commentatorInfo.login || 'deleted_user',
    };
    comment.likesInfo = likesInfo || {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: 'None',
    };
    return comment;
  }
}

export type CommentatorInfo = {
  userId: string;
  userLogin: string;
};

export type LikesInfo = {
  likesCount: number;
  dislikesCount: number;
  myStatus: string;
};

export type LikesInfoWithCommentId = {
  commentId: string;
  likesCount: number;
  dislikesCount: number;
  myStatus: string;
};

export type CommentWithUserInfoDb = {
  id: string;
  content: string;
  createdAt: Date;
  commentatorInfo: {
    userId: string;
    login: string;
  };
};
