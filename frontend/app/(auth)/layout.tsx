import { GraduationCap, FolderOpen, Search, Share2 } from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: FolderOpen,
    title: "One home for everything",
    body: "Lecture notes, assignments, syllabi, and papers — kept together instead of scattered across drives and inboxes.",
  },
  {
    icon: Search,
    title: "Find it in seconds",
    body: "Search and sort your archive so last semester's material is never more than a few keystrokes away.",
  },
  {
    icon: Share2,
    title: "Ready when students are",
    body: "Attach files, set submission dates, and share what matters without the usual back-and-forth.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground md:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 27px, currentColor 27px, currentColor 28px)",
          }}
        />
        <div className="relative flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-foreground/10">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold">Faculty LMS</span>
        </div>

        <div className="relative max-w-md space-y-8">
          <div className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-primary-foreground/60">
              Built for the way faculty actually work
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight">
              Your course material, finally in one calm place.
            </h1>
            <p className="text-primary-foreground/70">
              Spend less time hunting for files and more time teaching. Faculty LMS keeps
              everything you hand out to a class organized, searchable, and easy to share.
            </p>
          </div>

          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-foreground/10">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium leading-tight">{title}</p>
                  <p className="mt-1 text-sm text-primary-foreground/60">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} Faculty LMS · Made for educators
        </p>
      </div>

      <div className="flex items-center justify-center bg-background p-6 md:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
