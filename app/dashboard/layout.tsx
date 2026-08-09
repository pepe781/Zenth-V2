"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/");
        return;
      }
      setSession(data.session);
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!newSession) {
          router.push("/");
        }
        setSession(newSession);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-slate-400">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-xl font-bold text-white">Zenth</span>
          <Link
            href="/dashboard"
            className="text-slate-400 text-sm hover:text-white transition-colors"
          >
            Panel
          </Link>
          <Link
            href="/dashboard/reviews"
            className="text-slate-400 text-sm hover:text-white transition-colors"
          >
            Reseñas
          </Link>
          <Link
            href="/dashboard/settings"
            className="text-slate-400 text-sm hover:text-white transition-colors"
          >
            Perfil del Negocio
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">{session?.user.email}</span>
          <button
            onClick={handleLogout}
            className="text-slate-400 text-sm hover:text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
