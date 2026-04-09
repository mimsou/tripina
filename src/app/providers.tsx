"use client";

import { MemberRequestToast } from "@/components/realtime/member-request-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider basePath="/api/auth">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <MemberRequestToast />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
