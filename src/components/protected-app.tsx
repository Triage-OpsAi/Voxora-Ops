"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function ProtectedApp({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthStore((state) => state.hydrated);
  const token = useAuthStore((state) => state.token);
  const setSession = useAuthStore((state) => state.setSession);
  const signout = useAuthStore((state) => state.signout);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace(`/signin?next=${encodeURIComponent(pathname)}`);
      return;
    }

    let cancelled = false;
    setValidating(true);
    api.me(token)
      .then(({ user }) => {
        if (!cancelled) setSession({ token, user });
      })
      .catch(() => {
        if (!cancelled) {
          signout();
          router.replace(`/signin?next=${encodeURIComponent(pathname)}`);
        }
      })
      .finally(() => {
        if (!cancelled) setValidating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hydrated, pathname, router, setSession, signout, token]);

  if (!hydrated || !token || validating) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#08090d] text-sm text-zinc-500">
        Loading workspace...
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
