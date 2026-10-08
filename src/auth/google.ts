import { OAuth2Client } from "google-auth-library";
import type { NextRequest } from "next/server";

const CLIENTE_SESION = new OAuth2Client();
export const COOKIE_SESION_GOOGLE = "miconvoy_google_session";

export interface IdentidadGoogle {
  correo: string;
  nombre: string | null;
  foto: string | null;
}

export async function verificarIdTokenGoogle(token: string): Promise<IdentidadGoogle | null> {
  const audiencia = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!audiencia || !token || token.length > 8192) return null;

  try {
    const ticket = await CLIENTE_SESION.verifyIdToken({ idToken: token, audience: audiencia });
    const datos = ticket.getPayload();
    if (!datos?.email || datos.email_verified !== true) return null;
    return {
      correo: datos.email.trim().toLowerCase(),
      nombre: datos.name ?? null,
      foto: datos.picture ?? null,
    };
  } catch {
    return null;
  }
}

export async function obtenerSesionGoogle(peticion: NextRequest): Promise<IdentidadGoogle | null> {
  const token = peticion.cookies.get(COOKIE_SESION_GOOGLE)?.value;
  return token ? verificarIdTokenGoogle(token) : null;
}

