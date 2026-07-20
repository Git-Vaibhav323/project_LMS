"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, getAuthErrorMessage } from "@/context/auth-context";
import { ApiRequestError } from "@/services/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(getAuthErrorMessage(err));
      if (err instanceof ApiRequestError && err.fieldErrors) {
        const mapped: Record<string, string> = {};
        err.fieldErrors.forEach((fe) => (mapped[fe.field] = fe.message));
        setFieldErrors(mapped);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2 text-center md:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GraduationCap className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-1.5 text-center md:text-left">
        <h2 className="font-display text-2xl font-semibold">Create your account</h2>
        <p className="text-sm text-muted-foreground">
          Register as faculty to start managing your teaching content.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Dr. Ava Whitfield"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {fieldErrors.password ? (
            <p className="text-sm text-destructive">{fieldErrors.password}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Use 8+ characters with at least one letter and one number.
            </p>
          )}
        </div>

        {error && !Object.keys(fieldErrors).length && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
