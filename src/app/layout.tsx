import type { Metadata } from "next";
import "@/css/estilos.css";
import { NavegacionPestanas } from "@/components/navegacionPestanas";
import { AvisosApp } from "@/components/avisosApp";

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: {
    default: "MiConvoy | Organiza viajes compartidos en coche",
    template: "%s | MiConvoy",
  },
  description:
    "Organiza viajes en coche, comparte plazas y reparte combustible y gastos de forma clara con MiConvoy.",
  applicationName: "MiConvoy",
  keywords: [
    "compartir coche",
    "viajes compartidos",
    "calcular gastos de viaje",
    "repartir gasolina",
    "organizar viaje en coche",
  ],
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "MiConvoy",
    title: "MiConvoy | Organiza viajes compartidos en coche",
    description:
      "Calcula gastos, organiza coches y comparte plazas para viajar en grupo.",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
    title: "MiConvoy | Organiza viajes compartidos en coche",
    description:
      "Calcula gastos, organiza coches y comparte plazas para viajar en grupo.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      {/* Las extensiones del navegador (p. ej. ColorZilla añade
          cz-shortcut-listen) tocan el body y provocan avisos de
          hidratación: se ignoran a propósito. */}
      <body suppressHydrationWarning>
        <NavegacionPestanas />
        <AvisosApp />
        <main className="contenedorPrincipal">{children}</main>
      </body>
    </html>
  );
}
