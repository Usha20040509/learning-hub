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
import { sendMagicLink, isMagicLinkUrl, completeMagicLinkSignIn } from "@/lib/firebase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Learning Hub" },
      { name: "description", content: "Sign in to the Learning Hub portal." },
    ],
  }),
  component: LoginPage,
});

type Stage = "enter-email" | "link-sent" | "completing";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<Stage>("enter-email");
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
        setStage("enter-email");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await sendMagicLink(email.trim().toLowerCase());
      setStage("link-sent");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send the sign-in link. Please try again.");
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

          {/* ── Email entry form ── */}
          {stage === "enter-email" && (
            <>
              <div>
                <h1 className="text-3xl font-semibold">Welcome to Learning Hub</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter your company email and we'll send you a sign-in link.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSendLink}>
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
                <Button
                  id="send-link-btn"
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Sending…" : "Send sign-in link"}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center">
                Access is restricted to active MAQ Software employees.
              </p>
            </>
          )}

          {/* ── Link sent confirmation ── */}
          {stage === "link-sent" && (
            <div className="text-center space-y-4">
              {/* Mail icon */}
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </div>
              </div>

              <h1 className="text-2xl font-semibold">Check your inbox</h1>
              <p className="text-sm text-muted-foreground">
                We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>.
                Click the link in the email to sign in.
              </p>
              <p className="text-xs text-muted-foreground">
                The link expires in 1 hour. Didn't receive it?{" "}
                <button
                  type="button"
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                  onClick={() => setStage("enter-email")}
                >
                  Try again
                </button>
              </p>
            </div>
          )}

        </Card>
      </div>
    </AppLayout>
  );
}
