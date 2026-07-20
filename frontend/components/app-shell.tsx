"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Library, LogOut, Plus, GraduationCap } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/content", label: "My Content", icon: Library },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { faculty, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="h-4.5 w-4.5" />
          </div>
          <span className="font-display text-base font-semibold tracking-tight">
            Faculty CMS
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          <Link href="/content/new">
            <Button className="mt-4 w-full justify-start gap-2" variant="accent">
              <Plus className="h-4 w-4" />
              Upload Content
            </Button>
          </Link>
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{faculty ? initials(faculty.name) : "FC"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{faculty?.name ?? "Loading..."}</p>
              <p className="truncate text-xs text-muted-foreground">{faculty?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start gap-2 text-muted-foreground"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <span className="font-display text-base font-semibold">Faculty CMS</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => logout()} aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="hidden items-center justify-between border-b border-border px-8 py-3 md:flex">
          <nav className="flex gap-4 md:hidden">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium">
                {item.label}
              </Link>
            ))}
          </nav>
          <div />
          <ThemeToggle />
        </div>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>

        <nav className="sticky bottom-0 z-40 flex items-center justify-around border-t border-border bg-card py-2 md:hidden">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-1 text-xs",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/content/new"
            className="flex flex-col items-center gap-1 px-4 py-1 text-xs text-accent"
          >
            <Plus className="h-5 w-5" />
            Upload
          </Link>
        </nav>
      </div>
    </div>
  );
}
