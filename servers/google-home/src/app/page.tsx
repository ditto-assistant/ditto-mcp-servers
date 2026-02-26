"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/dashboard/Dashboard";

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkConfig() {
      try {
        const res = await fetch("/api/config");
        if (res.ok) {
          const data = await res.json();
          if (data?.google?.clientId) {
            setReady(true);
          } else {
            router.replace("/setup");
            return;
          }
        } else {
          router.replace("/setup");
          return;
        }
      } catch {
        router.replace("/setup");
        return;
      } finally {
        setLoading(false);
      }
    }
    checkConfig();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!ready) return null;

  return <Dashboard />;
}
