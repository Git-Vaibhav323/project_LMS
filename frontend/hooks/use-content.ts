import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { contentService } from "@/services/content.service";
import { getAuthErrorMessage } from "@/context/auth-context";
import { Content, ContentListParams, Pagination } from "@/lib/types";

export function useContentList(params: ContentListParams) {
  const [items, setItems] = useState<Content[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const key = JSON.stringify(params);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await contentService.list(params);
      setItems(res.data);
      setPagination(res.meta.pagination);
    } catch (err) {
      toast.error("Couldn't load content", { description: getAuthErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { items, pagination, isLoading, refetch, removeItem };
}
