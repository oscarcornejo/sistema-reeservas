/**
 * @fileoverview Layout de la página de búsqueda.
 * Resuelve la sesión en el servidor para mostrar el navbar adecuado
 * (dropdown de usuario si está logueado, o enlace a login si no).
 */

import { Suspense } from "react";
import { auth } from "@/lib/auth/auth";
import PublicNavbar from "@/components/layout/PublicNavbar";
import type { UserRole } from "@/types";

/** Navbar con verificación de sesión */
async function AuthPublicNavbar() {
  const session = await auth();

  const user = session?.user
    ? {
        name: session.user.name || "Usuario",
        email: session.user.email || "",
        role: session.user.role as UserRole,
        image: session.user.image,
      }
    : null;

  return <PublicNavbar user={user} />;
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense
        fallback={
          <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                  T
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  TurnoPro
                </span>
              </div>
            </div>
          </nav>
        }
      >
        <AuthPublicNavbar />
      </Suspense>
      {children}
    </>
  );
}
