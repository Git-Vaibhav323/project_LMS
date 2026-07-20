"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Paperclip, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ACCEPTED_FILE_EXTENSIONS, MAX_FILE_SIZE_MB } from "@/lib/constants";
import { contentService } from "@/services/content.service";
import { getAuthErrorMessage } from "@/context/auth-context";
import { ApiRequestError } from "@/services/api";
import { Content } from "@/lib/types";

interface ContentFormProps {
  mode: "create" | "edit";
  initialContent?: Content;
}

interface FormErrors {
  title?: string;
  description?: string;
  dueDate?: string;
  file?: string;
}

export function ContentForm({ mode, initialContent }: ContentFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialContent?.title ?? "");
  const [description, setDescription] = useState(initialContent?.description ?? "");
  // Store as YYYY-MM-DD string for the date input
  const [dueDate, setDueDate] = useState(
    initialContent?.dueDate
      ? new Date(initialContent.dueDate).toISOString().split("T")[0]
      : ""
  );
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingFileName = initialContent?.fileName;

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (title.trim().length < 3) nextErrors.title = "Title must be at least 3 characters.";
    if (description.trim().length < 10)
      nextErrors.description = "Description must be at least 10 characters.";
    if (dueDate && isNaN(Date.parse(dueDate)))
      nextErrors.dueDate = "Please enter a valid date.";
    if (file && file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      nextErrors.file = `File must be smaller than ${MAX_FILE_SIZE_MB}MB.`;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleFieldErrors(err: unknown) {
    if (err instanceof ApiRequestError && err.fieldErrors) {
      const mapped: FormErrors = {};
      err.fieldErrors.forEach((fieldError) => {
        if (fieldError.field in { title: 1, description: 1, dueDate: 1 }) {
          (mapped as Record<string, string>)[fieldError.field] = fieldError.message;
        }
      });
      setErrors((prev) => ({ ...prev, ...mapped }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        const res = await contentService.create({ title, description, dueDate: dueDate || null, file });
        toast.success("Content uploaded", { description: res.data.title });
        router.push(`/content/${res.data.id}`);
      } else if (initialContent) {
        const res = await contentService.update(initialContent.id, {
          title,
          description,
          dueDate: dueDate || null,
          file,
        });
        toast.success("Content updated", { description: res.data.title });
        router.push(`/content/${res.data.id}`);
      }
      router.refresh();
    } catch (err) {
      handleFieldErrors(err);
      toast.error(
        mode === "create" ? "Couldn't upload content" : "Couldn't update content",
        { description: getAuthErrorMessage(err) }
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="e.g. Introduction to Thermodynamics"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={Boolean(errors.title)}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={5}
          placeholder="Briefly describe what this content covers..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={Boolean(errors.description)}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Last Date of Assignment Submission</Label>
        <Input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-invalid={Boolean(errors.dueDate)}
        />
        {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate}</p>}
        <p className="text-xs text-muted-foreground">
          Optional — set the deadline for assignment submission.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">File (optional)</Label>
        <div
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-secondary/30 px-6 py-8 text-center transition-colors hover:bg-secondary/60"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="h-6 w-6 text-muted-foreground" />
          {file ? (
            <div className="flex items-center gap-2 text-sm">
              <Paperclip className="h-3.5 w-3.5" />
              <span>{file.name}</span>
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                aria-label="Remove selected file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : existingFileName ? (
            <p className="text-sm text-muted-foreground">
              Currently attached: <span className="font-medium">{existingFileName}</span>
              <br />
              Click to replace it.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click to choose a PDF, PPT, DOCX, or image
              <br />
              <span className="text-xs">Max {MAX_FILE_SIZE_MB}MB</span>
            </p>
          )}
          <input
            ref={fileInputRef}
            id="file"
            type="file"
            className="hidden"
            accept={ACCEPTED_FILE_EXTENSIONS}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        {errors.file && <p className="text-sm text-destructive">{errors.file}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "create" ? "Upload content" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
