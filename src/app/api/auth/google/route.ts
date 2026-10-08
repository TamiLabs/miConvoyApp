import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION_GOOGLE, verificarIdTokenGoogle } from "@/auth/google";

export const dynamic = "force-dynamic";

export async function POST(peticion: NextRequest) {
  let cuerpo: { credential?: string };
  try {
    cuerpo = (await peticion.json()) as { credential?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  if (!cuerpo.credential) {
    return NextResponse.json({ ok: false, error: "Falta la credencial de Google." }, { status: 400 });
  }
  const identidad = await verificarIdTokenGoogle(cuerpo.credential);
  if (!identidad) {
    return NextResponse.json(
      { ok: false, error: "No se pudo verificar la cuenta de Google. Vuelve a iniciar sesión." },
      { status: 401 },
    );
  }

  const respuesta = NextResponse.json({ ok: true, identidad });
  respuesta.cookies.set(COOKIE_SESION_GOOGLE, cuerpo.credential, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60,
  });
  return respuesta;
}

export async function DELETE() {
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(COOKIE_SESION_GOOGLE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return respuesta;
}
