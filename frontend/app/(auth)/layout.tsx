import { GraduationCap } from "lucide-react";

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
          <span className="font-display text-lg font-semibold">Faculty CMS</span>
        </div>

        <div className="relative max-w-md space-y-4">
          <p className="font-mono text-xs uppercase tracking-widest text-primary-foreground/60">
            Est. for the modern faculty archive
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Every lecture, syllabus, and paper — catalogued in one place.
          </h1>
          <p className="text-primary-foreground/70">
            Upload your course materials once, and keep them organized, searchable, and ready
            to share whenever your students or colleagues need them.
          </p>
        </div>

        <p className="relative font-mono text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} Faculty Content Management System
        </p>
      </div>

      <div className="flex items-center justify-center bg-background p-6 md:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
