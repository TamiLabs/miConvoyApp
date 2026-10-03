import type { Metadata } from "next";
import "@/css/estilos.css";
import { NavegacionPestanas } from "@/components/navegacionPestanas";

export const metadata: Metadata = {
  title: "MiConvoy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      {/* Las extensiones del navegador (p. ej. ColorZilla añade
          cz-shortcut-listen) tocan el body y provocan avisos de
          hidratación: se ignoran a propósito. */}
      <body suppressHydrationWarning>
        <NavegacionPestanas />
        <main className="contenedorPrincipal">{children}</main>
      </body>
    </html>
  );
}
