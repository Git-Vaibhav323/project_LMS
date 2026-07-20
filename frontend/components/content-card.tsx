"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Download, MoreVertical, Pencil, Trash2, FileX2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteDialog } from "@/components/delete-dialog";
import { formatDate } from "@/lib/format";
import { getFileIcon } from "@/lib/file-icon";
import { contentService } from "@/services/content.service";
import { getAuthErrorMessage } from "@/context/auth-context";
import { Content } from "@/lib/types";

export function ContentCard({
  content,
  onDeleted,
}: {
  content: Content;
  onDeleted?: (id: string) => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();
  const FileIconComp = getFileIcon(content.fileType);

  const handleDelete = async () => {
    try {
      await contentService.remove(content.id);
      toast.success("Content deleted", { description: content.title });
      onDeleted?.(content.id);
      setDeleteOpen(false);
    } catch (err) {
      toast.error("Couldn't delete content", { description: getAuthErrorMessage(err) });
    }
  };

  return (
    <>
      <Card className="group flex animate-fade-up flex-col overflow-hidden transition-shadow hover:shadow-md">
        <div className="catalog-edge" />
        <Link href={`/content/${content.id}`} className="flex flex-1 flex-col">
          <CardContent className="flex flex-1 flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              {content.dueDate ? (
                <Badge variant="accent" className="flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" />
                  Due {formatDate(content.dueDate)}
                </Badge>
              ) : (
                <Badge variant="secondary">No due date</Badge>
              )}
              <span className="font-mono text-xs text-muted-foreground">
                {formatDate(content.createdAt)}
              </span>
            </div>

            <h3 className="mt-3 line-clamp-2 font-display text-lg font-semibold leading-snug">
              {content.title}
            </h3>
            <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
              {content.description}
            </p>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              {content.fileUrl ? (
                <>
                  <FileIconComp className="h-3.5 w-3.5" />
                  <span className="truncate">{content.fileName}</span>
                </>
              ) : (
                <>
                  <FileX2 className="h-3.5 w-3.5" />
                  <span>No file attached</span>
                </>
              )}
            </div>
          </CardContent>
        </Link>

        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          {content.fileUrl ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={(e) => {
                e.preventDefault();
                window.open(content.fileUrl!, "_blank");
              }}
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More actions">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/content/${content.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={content.title}
        onConfirm={handleDelete}
      />
    </>
  );
}
