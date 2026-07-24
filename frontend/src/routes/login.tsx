import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { login } from "@/lib/api";
import { setCurrentUser } from "@/lib/auth";
import { signInWithPassword, signUpWithPassword, resetPassword, isMagicLinkUrl, completeMagicLinkSignIn } from "@/lib/firebase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Learning Hub" },
      { name: "description", content: "Sign in to the Learning Hub portal." },
    ],
  }),
  component: LoginPage,
});

type Stage = "sign-in" | "sign-up" | "forgot-password" | "completing";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<Stage>("sign-in");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // On mount: check if the current URL is a Firebase magic link and auto-complete sign-in
  useEffect(() => {
    if (!isMagicLinkUrl()) return;

    setStage("completing");

    completeMagicLinkSignIn()
      .then(async ({ idToken }) => {
        const user = await login({ id_token: idToken });
        setCurrentUser(user);
        toast.success(`Welcome, ${user.first_name}!`);
        navigate({ to: "/" });
      })
      .catch((err: any) => {
        const msg: string = err?.message ?? "";
        if (msg.includes("401")) {
          toast.error("Access denied. Please use your company email address.");
        } else {
          toast.error("Sign-in failed. The link may have expired — please request a new one.");
        }
        setStage("sign-in");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    try {
      const { idToken } = await signInWithPassword(email.trim().toLowerCase(), password);
      const user = await login({ id_token: idToken });
      setCurrentUser(user);
      toast.success(`Welcome back, ${user.first_name}!`);
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err?.message ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    try {
      const { idToken } = await signUpWithPassword(email.trim().toLowerCase(), password);
      const user = await login({ id_token: idToken });
      setCurrentUser(user);
      toast.success(`Account created! Welcome, ${user.first_name}!`);
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to sign up.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      toast.success("Password reset email sent! Check your inbox.");
      setStage("sign-in");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md p-8 space-y-6">

          {/* ── Completing sign-in (URL contains OOB code) ── */}
          {stage === "completing" && (
            <div className="text-center space-y-3">
              <h1 className="text-2xl font-semibold">Signing you in…</h1>
              <p className="text-sm text-muted-foreground">
                Verifying your sign-in link, please wait.
              </p>
              <div className="flex justify-center pt-2">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            </div>
          )}

          {/* ── Sign In form ── */}
          {stage === "sign-in" && (
            <>
              <div>
                <h1 className="text-3xl font-semibold">Welcome to Learning Hub</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter your company email and password to sign in.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSignIn}>
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
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => setStage("forgot-password")}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <Button
                  id="sign-in-btn"
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Signing in…" : "Sign In"}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center">
                New user?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setStage("sign-up")}
                >
                  Sign up here
                </button>
              </p>
            </>
          )}

          {/* ── Sign Up form ── */}
          {stage === "sign-up" && (
            <>
              <div>
                <h1 className="text-3xl font-semibold">Create an Account</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Sign up to access the Learning Hub.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSignUp}>
                <div>
                  <Label htmlFor="signup-email">Company Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@maqsoftware.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Choose a Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Signing up…" : "Sign Up"}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setStage("sign-in")}
                >
                  Sign in here
                </button>
              </p>
            </>
          )}

          {/* ── Forgot Password form ── */}
          {stage === "forgot-password" && (
            <>
              <div>
                <h1 className="text-2xl font-semibold">Reset Password</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter your email address and we will send you a link to set a new password.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleResetPassword}>
                <div>
                  <Label htmlFor="reset-email">Company Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@maqsoftware.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Sending link…" : "Send Reset Link"}
                </Button>
              </form>

              <div className="text-center mt-2">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setStage("sign-in")}
                >
                  &larr; Back to sign in
                </button>
              </div>
            </>
          )}

        </Card>
      </div>
    </AppLayout>
  );
}
