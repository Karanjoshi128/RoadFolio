"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function SignInForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("test@roadfolio.dev");
  const [password, setPassword] = useState("Test1234!");
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (res?.error) {
      toast.error("Invalid email or password.");
      return;
    }
    toast.success("Signed in.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="glass-elevated w-full max-w-[24rem] p-6">
      <div className="mb-6 space-y-1.5 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface">
          Sign in to RoadFolio
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Use the seeded test account, or continue with Google.
        </p>
      </div>
      <div className="space-y-4">
        <form onSubmit={handleCredentials} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary-container text-on-primary hover:bg-[#059669]"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        {googleEnabled && (
          <>
            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                OR
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              Continue with Google
            </Button>
          </>
        )}

        <p className="text-center text-xs text-on-surface-variant">
          Seeded test login is pre-filled. Run <code>pnpm db:seed</code> first.
        </p>
      </div>
    </div>
  );
}
