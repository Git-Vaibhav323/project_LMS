import { apiFetch } from "@/services/api";
import {
  ApiSuccess,
  Content,
  ContentListMeta,
  ContentListParams,
  DashboardSummary,
} from "@/lib/types";

function buildQueryString(params: ContentListParams): string {
  const search = new URLSearchParams();
  if (params.search) search.set("search", params.search);
  if (params.sort) search.set("sort", params.sort);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export interface ContentFormInput {
  title: string;
  description: string;
  dueDate?: string | null;
  file?: File | null;
}

function toFormData(input: ContentFormInput): FormData {
  const formData = new FormData();
  formData.set("title", input.title);
  formData.set("description", input.description);
  if (input.dueDate) formData.set("dueDate", input.dueDate);
  if (input.file) {
    formData.set("file", input.file);
  }
  return formData;
}

export const contentService = {
  list(params: ContentListParams = {}) {
    return apiFetch<ApiSuccess<Content[]> & { meta: ContentListMeta }>(
      `/api/content${buildQueryString(params)}`,
      { method: "GET" }
    );
  },

  getById(id: string) {
    return apiFetch<ApiSuccess<Content>>(`/api/content/${id}`, { method: "GET" });
  },

  create(input: ContentFormInput) {
    return apiFetch<ApiSuccess<Content>>("/api/content", {
      method: "POST",
      body: toFormData(input),
    });
  },

  update(id: string, input: ContentFormInput) {
    return apiFetch<ApiSuccess<Content>>(`/api/content/${id}`, {
      method: "PUT",
      body: toFormData(input),
    });
  },

  remove(id: string) {
    return apiFetch<ApiSuccess<null>>(`/api/content/${id}`, { method: "DELETE" });
  },

  dashboardSummary() {
    return apiFetch<ApiSuccess<DashboardSummary>>("/api/content/dashboard/summary", {
      method: "GET",
    });
  },
};

export default contentService;
