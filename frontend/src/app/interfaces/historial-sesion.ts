// src/app/interfaces/historial-sesion.ts
export interface HistorialSesion {
  id: number;
  idUsuario: number;
  fechaAcceso: Date | string;
  ip: string;
  userAgent: string;
  dispositivo: string;
  navegador: string;
  sistemaOperativo?: string;
  ubicacion?: string;
  activo: boolean;
  fechaCierre?: Date | string;
}

export interface InfoDispositivo {
  tipo: 'desktop' | 'mobile' | 'tablet';
  navegador: string;
  navegadorVersion: string;
  sistema: string;
  sistemaVersion: string;
}

export interface SesionActiva {
  id: number;
  dispositivo: string;
  navegador: string;
  ubicacion: string;
  fechaInicio: Date;
  ultimaActividad: Date;
  esActual: boolean;
}