"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { signInWithGoogleAction } from "./actions";

function GoogleSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" className="w-full" loading={pending}>
      Continue with Google
    </Button>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "Server configuration error — check AUTH_SECRET / NEXTAUTH_SECRET and OAuth env vars.",
  AccessDenied: "Access was denied.",
  Verification: "The sign-in link is no longer valid.",
  OAuthSignin: "Could not start Google sign-in. Check client ID and callback URL in Google Cloud.",
  OAuthCallback: "Google returned an error — verify redirect URI matches your app URL.",
  OAuthCreateAccount: "Could not create your account. Try again or use email.",
  Callback: "Something went wrong during sign-in.",
  Default: "Sign-in failed. Please try again.",
};

export function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const errorCode = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const errorMessage = useMemo(() => {
    if (!errorCode) return null;
    return ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default;
  }, [errorCode]);

  return (
    <Card className="w-full max-w-md space-y-6 p-8">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Sign in to plan and share your next escape. New here? Same button — we&apos;ll create your account.
        </p>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-200"
        >
          {errorMessage}
        </div>
      ) : null}

      <form action={signInWithGoogleAction} className="w-full">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <GoogleSubmitButton />
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-terrain-stone/40 dark:border-terrain-surface/50" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-snow px-2 dark:bg-terrain-night">or email</span>
        </div>
      </div>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          void signIn("resend", { email, callbackUrl });
        }}
      >
        <Input
          type="email"
          required
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          Send magic link
        </Button>
      </form>
    </Card>
  );
}
