import type { Metadata } from "next";
import "@/css/estilos.css";
import { NavegacionPestanas } from "@/components/navegacionPestanas";

export const metadata: Metadata = {
  title: "MiConvoy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <NavegacionPestanas />
        <main className="contenedorPrincipal">{children}</main>
      </body>
    </html>
  );
}
