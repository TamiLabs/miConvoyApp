import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Viaje compartido",
  description: "Consulta y organiza las plazas de un viaje compartido en MiConvoy.",
  robots: { index: false, follow: false },
};

export default function ViajeOnlineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
