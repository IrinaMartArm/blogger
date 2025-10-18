import { Injectable } from '@nestjs/common';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private blogModel: BlogModelType) {}

  async save(blog: BlogDocument) {
    await blog.save();
  }

  async findBlog(id: string): Promise<BlogDocument | null> {
    return this.blogModel.findOne({ _id: id, deletedAt: null });
  }
}
