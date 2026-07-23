import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { login } from "@/lib/api";
import { setCurrentUser } from "@/lib/auth";
import { signInWithGoogle } from "@/lib/firebase";

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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // 1. Sign in with Google via Firebase (opens popup)
      const { idToken } = await signInWithGoogle();

      // 2. Send the Firebase ID token to our backend for verification + employee lookup
      const user = await login({ id_token: idToken });

      // 3. Store the returned employee profile in session storage
      setCurrentUser(user);
      toast.success(`Welcome, ${user.first_name}!`);
      navigate({ to: "/" });
    } catch (error: any) {
      // Firebase popup dismissed by the user — silently ignore
      if (error?.code === "auth/popup-closed-by-user" || error?.code === "auth/cancelled-popup-request") {
        setLoading(false);
        return;
      }

      const msg: string = error?.message ?? "";
      if (msg.includes("401")) {
        toast.error("Access denied. Please use your company (@maqsoftware.com) email address.");
      } else if (msg.includes("popup")) {
        toast.error("The sign-in popup was blocked. Please allow pop-ups for this site and try again.");
      } else {
        toast.error(msg || "Sign-in failed. Please try again.");
      }
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
              Sign in with your MAQ Software Google account to continue.
            </p>
          </div>

          <Button
            id="google-signin-btn"
            type="button"
            className="w-full flex items-center justify-center gap-3"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              "Signing in…"
            ) : (
              <>
                {/* Google "G" logo */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  width="20"
                  height="20"
                >
                  <path
                    fill="#FFC107"
                    d="M43.6 20.1H42V20H24v8h11.3C33.7 32.9 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"
                  />
                  <path
                    fill="#FF3D00"
                    d="m6.3 14.7 6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.4 35.4 26.8 36 24 36c-5.2 0-9.6-3-11.4-7.4L6 33.8C9.3 39.7 16.2 44 24 44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.2 5.2C37 39.3 44 34.3 44 24c0-1.3-.1-2.7-.4-3.9z"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Access is restricted to active MAQ Software employees.
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}
