"use client";

import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/context/auth-context";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, faculty } = useAuth();

  if (isLoading || !faculty) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
