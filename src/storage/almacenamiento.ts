// src/storage/almacenamiento.ts — adaptador genérico de almacenamiento clave-valor.
//
// Nadie en el resto de la app llama a localStorage directamente: todo pasa
// por esta interfaz. Así, cuando en el futuro se compile con Capacitor y se
// quiera pasar a @capacitor/preferences o a SQLite, solo hace falta escribir
// un nuevo adaptador que cumpla la misma interfaz — ningún componente ni
// lógica de negocio tiene que cambiar.
//
// Los métodos son async desde el principio, aunque localStorage en sí es
// síncrono. Es a propósito: @capacitor/preferences e IndexedDB sí son async,
// así que si la interfaz ya lo es desde ahora, cambiar de implementación el
// día de mañana no obliga a tocar ningún "await" en el resto del código —
// solo el propio adaptador.

export interface Almacenamiento {
  obtener<T>(clave: string): Promise<T | null>;
  guardar<T>(clave: string, valor: T): Promise<void>;
  limpiar(clave: string): Promise<void>;
}

export const adaptadorAlmacenamientoLocal: Almacenamiento = {
  async obtener<T>(clave: string): Promise<T | null> {
    try {
      const datosCrudos = localStorage.getItem(clave);
      return datosCrudos ? (JSON.parse(datosCrudos) as T) : null;
    } catch {
      return null;
    }
  },

  async guardar<T>(clave: string, valor: T): Promise<void> {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
    } catch {
      // localStorage lleno o deshabilitado (modo incógnito, cuota superada...):
      // falla en silencio. La app debe seguir siendo usable aunque en ese
      // momento no se pueda persistir nada.
    }
  },

  async limpiar(clave: string): Promise<void> {
    localStorage.removeItem(clave);
  },
};
