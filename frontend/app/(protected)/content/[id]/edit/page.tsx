"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, FileX2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ContentForm } from "@/components/content-form";
import { contentService } from "@/services/content.service";
import { getAuthErrorMessage } from "@/context/auth-context";
import { ApiRequestError } from "@/services/api";
import { Content } from "@/lib/types";

export default function EditContentPage() {
  const params = useParams<{ id: string }>();
  const [content, setContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={content ? `/content/${content.id}` : "/content"}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {isLoading ? (
        <Skeleton className="h-96 rounded-lg" />
      ) : notFound || !content ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileX2 className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Content not found</p>
            <Link href="/content">
              <Button className="mt-2" variant="outline">
                Back to content
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Edit Content</CardTitle>
            <CardDescription>Update the details or replace the attached file.</CardDescription>
          </CardHeader>
          <CardContent>
            <ContentForm mode="edit" initialContent={content} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
