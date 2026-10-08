import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi perfil",
  description: "Gestiona tu perfil, tus coches y el historial de viajes de MiConvoy.",
  robots: { index: false, follow: false },
};

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  return children;
}
