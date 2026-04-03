// Paginare folosita de serviciile Java
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// Paginare folosita de serviciul Python (snake_case)
export interface PageDto<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}