"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileX2,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { DeleteDialog } from "@/components/delete-dialog";
import { formatDate, isImageType, isPdfType } from "@/lib/format";
import { getFileIcon } from "@/lib/file-icon";
import { contentService } from "@/services/content.service";
import { getAuthErrorMessage } from "@/context/auth-context";
import { ApiRequestError } from "@/services/api";
import { Content } from "@/lib/types";

export default function ContentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [content, setContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await contentService.getById(params.id);
        if (active) setContent(res.data);
      } catch (err) {
        if (err instanceof ApiRequestError && (err.status === 404 || err.status === 403)) {
          setNotFound(true);
        } else {
          toast.error("Couldn't load content", { description: getAuthErrorMessage(err) });
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [params.id]);

  async function handleDelete() {
    if (!content) return;
    try {
      await contentService.remove(content.id);
      toast.success("Content deleted", { description: content.title });
      router.push("/content");
    } catch (err) {
      toast.error("Couldn't delete content", { description: getAuthErrorMessage(err) });
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }

  if (notFound || !content) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <FileX2 className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Content not found</p>
            <p className="text-sm text-muted-foreground">
              It may have been deleted, or you don&apos;t have access to it.
            </p>
            <Link href="/content">
              <Button className="mt-2" variant="outline">
                Back to content
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const FileIconComp = getFileIcon(content.fileType);
  // fileUrl is now a full Supabase public URL — no prefix needed
  const fullFileUrl = content.fileUrl ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/content"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to content
        </Link>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push(`/content/${content.id}/edit`)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="catalog-edge" />
        <CardContent className="space-y-6 p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {content.dueDate ? (
              <Badge variant="accent" className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Due {formatDate(content.dueDate)}
              </Badge>
            ) : (
              <Badge variant="secondary">No due date</Badge>
            )}
            <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Uploaded {formatDate(content.createdAt)}
            </span>
          </div>

          <h1 className="font-display text-3xl font-semibold leading-tight">
            {content.title}
          </h1>

          <p className="whitespace-pre-wrap text-muted-foreground">{content.description}</p>

          <Separator />

          <div>
            <h2 className="mb-3 font-mono text-xs uppercase tracking-wide text-muted-foreground">
              Attached file
            </h2>
            {content.fileUrl && fullFileUrl ? (
              <div className="space-y-3">
                <FilePreview fileUrl={fullFileUrl} fileType={content.fileType} />
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileIconComp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm">{content.fileName}</span>
                  </div>
                  <a href={fullFileUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="gap-1.5">
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                <FileX2 className="h-4 w-4" />
                No file was attached to this content.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={content.title}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function FilePreview({ fileUrl, fileType }: { fileUrl: string; fileType: string | null }) {
  if (isImageType(fileType)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fileUrl}
        alt="Uploaded file preview"
        className="max-h-[420px] w-full rounded-md border border-border object-contain bg-secondary/30"
      />
    );
  }
  if (isPdfType(fileType)) {
    return (
      <iframe
        src={fileUrl}
        title="PDF preview"
        className="h-[480px] w-full rounded-md border border-border"
      />
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
      <Loader2 className="hidden h-4 w-4" />
      Preview isn&apos;t available for this file type — use the download button below to view it.
    </div>
  );
}
