export interface Preferencias {
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

export interface ConfiguracionIdioma {
  codigo: string;
  nombre: string;
  nativo: string;
  bandera: string;
}

export const IDIOMAS_DISPONIBLES: ConfiguracionIdioma[] = [
  {
    codigo: 'es',
    nombre: 'Español',
    nativo: 'Español',
    bandera: '🇪🇸'
  },
  {
    codigo: 'en',
    nombre: 'English',
    nativo: 'English',
    bandera: '🇺🇸'
  },
  {
    codigo: 'pt',
    nombre: 'Portuguese',
    nativo: 'Português',
    bandera: '🇵🇹'
  }
];

export interface OpcionesFuente {
  valor: 'pequeño' | 'mediano' | 'grande';
  etiqueta: string;
  tamanoPx: number;
}

export const TAMANOS_FUENTE: OpcionesFuente[] = [
  {
    valor: 'pequeño',
    etiqueta: 'Pequeño',
    tamanoPx: 14
  },
  {
    valor: 'mediano',
    etiqueta: 'Mediano',
    tamanoPx: 16
  },
  {
    valor: 'grande',
    etiqueta: 'Grande',
    tamanoPx: 18
  }
];