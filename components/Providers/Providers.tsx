"use client";

import React, { useEffect, useRef } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { peekGuestDataForSync, clearGuestDataAfterSync } from "@/lib/guestProgress";

function GuestProgressSync() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user || isSyncingRef.current) return;

    const { hasData, guestExp, lessons, tests } = peekGuestDataForSync();
    if (!hasData) return;

    isSyncingRef.current = true;

    fetch("/api/guest/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestExp, lessons, tests }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          clearGuestDataAfterSync();
          window.dispatchEvent(
            new CustomEvent("pimwai-guest-synced", {
              detail: data.updatedUser || null,
            })
          );
          router.refresh();
        }
      })
      .catch((err) => {
        console.error("Failed to sync guest progress:", err);
      })
      .finally(() => {
        isSyncingRef.current = false;
      });
  }, [status, session?.user, router]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <GuestProgressSync />
      {children}
    </SessionProvider>
  );
}
