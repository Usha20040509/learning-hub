import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { login } from "@/lib/api";
import { setCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Learning Hub" },
      { name: "description", content: "Sign in to the Learning Hub portal." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const user = await login({ email: email.trim().toLowerCase() });
      setCurrentUser(user);
      toast.success(`Welcome, ${user.first_name}!`);
      navigate({ to: "/" });
    } catch (error: any) {
      toast.error(
        error?.message?.includes("401")
          ? "Email not recognised. Please use your company email address."
          : (error?.message ?? "Login failed. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-semibold">Welcome to Learning Hub</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your company email address to sign in.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">Company Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@maqsoftware.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            Access is restricted to employees listed in the company roster.
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}
