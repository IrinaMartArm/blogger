import { Injectable } from '@nestjs/common';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PostsRepository {
  constructor(@InjectModel(Post.name) private postModel: PostModelType) {}

  async save(post: PostDocument): Promise<void> {
    await post.save();
  }

  async getPost(id: string): Promise<PostDocument | null> {
    return this.postModel.findOne({ _id: id });
  }
}
