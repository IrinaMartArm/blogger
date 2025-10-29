//класс view модели для запросов за списком с пагинацией
export abstract class PaginatedViewDto<T> {
  abstract items: T;
  totalCount: number;
  pagesCount: number;
  page: number;
  pageSize: number;

  //статический метод-утилита для мапинга
  public static mapToView<T>(data: {
    page: number;
    size: number;
    totalCount: number;
    items: T;
  }): PaginatedViewDto<T> {
    return {
      pagesCount: Math.ceil(data.totalCount / data.size),
      page: data.page,
      pageSize: data.size,
      totalCount: data.totalCount,
      items: data.items,
    };
  }
}
