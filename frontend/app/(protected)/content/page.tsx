"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, LibraryBig, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContentCard } from "@/components/content-card";
import { useContentList } from "@/hooks/use-content";
import { useDebounce } from "@/hooks/use-debounce";
import { SortOption } from "@/lib/types";
export default function ContentLibraryPage() {
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);

  const search = useDebounce(searchInput);

  const { items, pagination, isLoading, removeItem } = useContentList({
    search,
    sort,
    page,
    limit: 9,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-semibold">My Content</h1>
          <p className="mt-1 text-muted-foreground">
            Search, filter, and manage everything you&apos;ve uploaded.
          </p>
        </div>
        <Link href="/content/new">
          <Button variant="accent" className="gap-2">
            <Plus className="h-4 w-4" />
            Upload Content
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <LibraryBig className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-medium">No content found</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {search
                ? "Try adjusting your search."
                : "Upload your first piece of content to see it here."}
            </p>
            <Link href="/content/new">
              <Button className="mt-2 gap-2">
                <Plus className="h-4 w-4" />
                Upload Content
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ContentCard key={item.id} content={item} onDeleted={removeItem} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="font-mono text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
