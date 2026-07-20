import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ContentForm } from "@/components/content-form";

export default function NewContentPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/content"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to content
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Upload Content</CardTitle>
          <CardDescription>
            Add a new lecture note, assignment, syllabus, or research file to your archive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContentForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
