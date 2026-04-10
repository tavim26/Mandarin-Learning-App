// Tipuri utilitare partajate intre servicii

export interface ApiError {
  status: number;
  message: string;
}

// Folosit de progress-service si chatbot-service
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}