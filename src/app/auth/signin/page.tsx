import { Suspense } from "react";
import { SignInForm } from "./signin-form";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md rounded-lg border border-terrain-stone/40 bg-snow/90 p-8 dark:border-terrain-surface/50 dark:bg-terrain-deep/90">
          <div className="h-8 animate-pulse rounded bg-terrain-stone/40 dark:bg-terrain-surface/40" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
