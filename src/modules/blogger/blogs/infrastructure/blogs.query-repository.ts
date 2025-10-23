import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogViewDto } from '../api/view-dto/blog.view-dto';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../domain/blog.entity';
import { GetBlogsQueryParams } from '../api/input-dto/get-blogs-query-params.input-dto';
import { FilterQuery, SortOrder } from 'mongoose';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { PostViewDto } from '../../posts/api/view-dto/post.view-dto';
import { PostsQueryRepository } from '../../posts/infrastructure/posts-query.repository';
import { PostsQueryParams } from '../../posts/api/input-dto/posts.input-dto';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectModel(Blog.name) private BlogModel: BlogModelType,
    private postsQueryRepository: PostsQueryRepository,
  ) {}

  async getBlogById(id: string): Promise<BlogViewDto> {
    const blog = await this.BlogModel.findOne({
      _id: id,
      deletedAt: null,
    }).lean();

    if (!blog) {
      throw new NotFoundException('blog not found');
    }

    return BlogViewDto.mapToView(blog);
  }

  async getBlogs(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const filter: FilterQuery<Blog> = { deletedAt: null };

    if (query.searchNameTerm) {
      filter.name = { $regex: query.searchNameTerm, $options: 'i' };
    }

    const blogs = await this.BlogModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection as SortOrder })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .lean();

    const totalCount = await this.BlogModel.countDocuments(filter);
    const items = blogs.map((blog) => BlogViewDto.mapToView(blog));
    return PaginatedViewDto.mapToView({
      items,
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
    });
  }

  async findPosts(
    blogId: string,
    query: PostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const blogExists = await this.BlogModel.exists({ _id: blogId });
    if (!blogExists) {
      throw new NotFoundException('blog not found');
    }
    return this.postsQueryRepository.findPosts(query, blogId);
  }
}
