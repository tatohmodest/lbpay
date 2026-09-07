"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { NotifyProvider } from "@/lib/notify";
import { AppProvider } from "@/lib/store";
import { SessionGuard } from "@/components/auth/session-guard";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { PushPrompt } from "@/components/pwa/push-prompt";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { NotificationInbox } from "@/components/notification-inbox";
import { NativeShell } from "@/components/native-shell";
import { I18nProvider } from "@/lib/i18n/use-i18n";
import type { Locale } from "@/lib/i18n/locale";

export function AppProviders({ locale, children }: { locale: Locale; children: ReactNode }) {
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
      <I18nProvider locale={locale}>
        <NotifyProvider>
          <AppProvider>
            <RegisterServiceWorker />
            <NativeShell />
            <SessionGuard>{children}</SessionGuard>
            <InstallPrompt />
            <PushPrompt />
            <NotificationInbox />
          </AppProvider>
        </NotifyProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
