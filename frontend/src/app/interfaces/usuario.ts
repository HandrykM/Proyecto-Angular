// src/app/interfaces/usuario.interface.ts
export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  telefono?: string;
  nombreUsuario?: string;
  foto?: string;
  fechaRegistro: string;
  rol: 'usuario' | 'admin';
  configuracion: ConfiguracionUsuario;
  estadisticas: EstadisticasUsuario;
}

export interface ConfiguracionUsuario {
  idioma: string;
  modoOscuro: boolean;
  tamanoFuente: 'pequeño' | 'mediano' | 'grande';
  notificaciones: NotificacionesConfig;
}

export interface NotificacionesConfig {
  email: boolean;
  sms: boolean;
  push: boolean;
  recordatorios: boolean;
  logros: boolean;
}

export interface EstadisticasUsuario {
  tiempoTotalEstudio: number; // en minutos
  modulosCompletados: number;
  actividadesCompletadas: number;
  puntosTotal: number;
  racha: number; // días consecutivos
  ultimaActividad: string;
}

export interface HistorialSesion {
  id: number;
  fechaAcceso: string;
  ip: string;
  dispositivo: string;
  navegador: string;
  ubicacion?: string;
  activo: boolean;
}

export interface CambioContrasena {
  contrasenaActual: string;
  nuevaContrasena: string;
  confirmarContrasena: string;
}

export interface Logro {
  id: number;
  titulo: string;
  descripcion: string;
  icono: string;
  fechaObtenido: string;
  categoria: string;
}

export interface CertificadoUsuario {
  id: number;
  titulo: string;
  descripcion: string;
  modulo: string;
  fechaEmision: string;
  urlCertificado: string; // ← Asegúrate que sea camelCase
  codigoVerificacion: string;
  verificado: boolean;
}