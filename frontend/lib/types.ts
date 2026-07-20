export interface Faculty {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Content {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  facultyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }> | unknown;
}

export interface ContentListMeta {
  pagination: Pagination;
  totalContentCount: number;
}

export interface DashboardSummary {
  total: number;
  recent: Content[];
}

export interface AuthResponse {
  faculty: Faculty;
  token: string;
}

export type SortOption = "newest" | "oldest";

export interface ContentListParams {
  search?: string;
  sort?: SortOption;
  page?: number;
  limit?: number;
}
