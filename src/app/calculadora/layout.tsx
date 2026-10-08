import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora de gastos de viaje",
  description:
    "Calcula cuánto cuesta un viaje en coche y reparte combustible, peajes y otros gastos entre los pasajeros.",
  ...(process.env.NEXT_PUBLIC_SITE_URL
    ? { alternates: { canonical: "/calculadora" } }
    : {}),
};

export default function CalculadoraLayout({ children }: { children: React.ReactNode }) {
  return children;
}
