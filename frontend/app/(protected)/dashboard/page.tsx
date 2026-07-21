"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FileStack, Plus, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { ContentCard } from "@/components/content-card";
import { useAuth, getAuthErrorMessage } from "@/context/auth-context";
import { contentService } from "@/services/content.service";
import { Content } from "@/lib/types";

export default function DashboardPage() {
  const { faculty } = useAuth();
  const [total, setTotal] = useState<number | null>(null);
  const [recent, setRecent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await contentService.dashboardSummary();
        if (!active) return;
        setTotal(res.data.total);
        setRecent(res.data.recent);
      } catch (err) {
        toast.error("Couldn't load dashboard", { description: getAuthErrorMessage(err) });
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const firstName = faculty?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const subline =
    total === 0
      ? "Your archive is a blank page — let's add the first thing to it."
      : "Here's a quick look at what you've got so far.";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-muted-foreground">{subline}</p>
        </div>
        <Link href="/content/new" className="w-full sm:w-auto">
          <Button size="lg" variant="accent" className="w-full gap-2 sm:w-auto">
            <Plus className="h-4 w-4" />
            Upload Content
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </>
        ) : (
          <>
            <StatCard label="Total Content" value={total ?? 0} icon={FileStack} />
            <StatCard label="Recent Uploads" value={recent.length} icon={Clock} accent />
            <StatCard
              label="With Due Dates"
              value={recent.filter((c) => c.dueDate).length}
              icon={Sparkles}
            />
          </>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recent uploads</h2>
          <Link href="/content" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-lg" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <FileStack className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="font-medium">Your archive is empty</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Upload your first lecture note, syllabus, or research file to get started.
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((item) => (
              <ContentCard
                key={item.id}
                content={item}
                onDeleted={(id) => setRecent((prev) => prev.filter((c) => c.id !== id))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
