export interface AuthenticatedFaculty {
  facultyId: string;
  email: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ContentCreateInput {
  title: string;
  description: string;
  dueDate?: string | null;
}

export interface ContentUpdateInput {
  title?: string;
  description?: string;
  dueDate?: string | null;
}

export interface ContentQuery {
  search?: string;
  sort?: "newest" | "oldest";
  page?: number;
  limit?: number;
}
