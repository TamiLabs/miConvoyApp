// src/db.ts — punto único de conexión a la base de datos.
//
// Hoy apunta al Postgres de Docker (DATABASE_URL en .env); en el futuro
// apuntará al servidor real (Neon/Supabase/...) cambiando SOLO esa variable,
// sin tocar código. El singleton vía globalThis evita agotar conexiones en
// desarrollo (hot-reload de Next).

import { PrismaClient } from "@prisma/client";

const globalConPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const baseDatos =
  globalConPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalConPrisma.prisma = baseDatos;
