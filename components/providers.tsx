"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { NotifyProvider } from "@/lib/notify";
import { AppProvider } from "@/lib/store";
import { SessionGuard } from "@/components/auth/session-guard";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 8_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <NotifyProvider>
        <AppProvider>
          <RegisterServiceWorker />
          <SessionGuard>{children}</SessionGuard>
          <InstallPrompt />
        </AppProvider>
      </NotifyProvider>
    </QueryClientProvider>
  );
}
