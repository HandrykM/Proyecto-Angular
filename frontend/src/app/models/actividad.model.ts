export interface Actividad {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: 'simulador' | 'trivia' | 'juego' | 'quiz' | 'pregunta';
  icono: string;
  color: string;
  nivel: 'basico' | 'intermedio' | 'avanzado';
  puntos: number;
  duracion: string;
  completada: boolean;
  progreso: number;
  ultimaVez?: Date;
  puntuacionMaxima?: number;
}

export interface TarjetaAgua {
  id: number;
  nombre: string;
  descripcion: string;
  icono: string;
  imagen?: string;
  categoriaCorrecta: 'reutilizable' | 'tratamiento' | 'no-reutilizable';
  explicacion: string;
  nivel?: 'basico' | 'intermedio' | 'avanzado'; // Agregar esta línea
  activa?: number;
}

export interface ResultadoReutilizable {
  idUsuario: number;
  idActividad: number;
  respuestasCorrectas: number;
  totalTarjetas: number;
  precision: number;
  puntuacion: number;
  tiempoTotal: number;
  nivel: 'basico' | 'intermedio' | 'avanzado';
  completada: boolean;
  medalleta: 'oro' | 'plata' | 'bronce';
  tarjetasErradas?: TarjetaAgua[];
  fecha: Date;
}
// Resto de interfaces igual...

export interface ProgresoActividad {
  id: number;
  idUsuario: number;
  idActividad: number;
  completada: boolean;
  progreso: number; // Porcentaje 0-100
  puntuacionMaxima: number;
  intentos: number;
  tiempoTotal: number; // En minutos
  ultimaActividad: Date;
  datosProgreso?: any; // JSON con datos específicos de la actividad
}

export interface RankingGoGo {
  id: number;
  idUsuario: number;
  nombreUsuario: string;
  puntuacionMaxima: number;
  nivel: number;
  fechaRecord: Date;
  posicion?: number;
  metadata?: any;
}

export interface EstadisticasActividades {
  totalActividades: number;
  actividadesCompletadas: number;
  puntosTotal: number;
  tiempoTotalMinutos: number;
  actividadFavorita: string;
}

export interface HistorialActividad {
  id: number;
  idUsuario: number;
  tipoActividad: 'actividad' | 'quiz' | 'simulador' | 'trivia';
  idReferencia: number;
  titulo: string;
  descripcion?: string;
  resultado: string;
  puntosObtenidos: number;
  fechaActividad: Date;
}

export interface EstadisticasSemanales {
  id: number;
  idUsuario: number;
  semana: string; // Formato YYYY-WW
  actividadesCompletadas: number;
  tiempoTotalMinutos: number;
  puntosObtenidos: number;
  mejorPuntuacion: number;
  actividadesIntentadas: number;
  fechaActualizacion: Date;
}

export interface ResultadoActividad {
  exito: boolean;
  puntuacion: number;
  tiempoTranscurrido: number;
  porcentajeCompletado: number;
  logrosObtenidos?: string[];
  datosEspecificos?: any;
  mensaje?: string;
}

export interface ConfiguracionActividad {
  dificultad?: 'facil' | 'medio' | 'dificil';
  tiempoLimite?: number; // En minutos
  intentosMaximos?: number;
  puntuacionMinima?: number;
  configuracionEspecifica?: any;
}

// Interfaces específicas para cada tipo de actividad

export interface DatosSimulador {
  eficienciaAlcanzada: number;
  ahorroLitros: number;
  decisionesTomadas: number;
  configuracionFinal: any;
  metricas: {
    [categoria: string]: {
      consumo: number;
      eficiencia: number;
      ahorro: number;
    }
  };
}

export interface DatosTrivia {
  dificultad: string;
  respuestasCorrectas: number;
  totalPreguntas: number;
  precision: number;
  rachaMaxima: number;
  tiempoPorPregunta: number[];
  categorias: {
    nombre: string;
    correctas: number;
    total: number;
    porcentaje: number;
  }[];
  medallaObtenida: 'oro' | 'plata' | 'bronce';
}

export interface DatosJuego {
  nivelAlcanzado: number;
  vidas: number;
  objetivosCompletos: number;
  tiempoJugado: number;
  puntuacionDetallada: {
    puntosPorNivel: number[];
    bonificaciones: number;
    penalizaciones: number;
  };
  logros: string[];
}

// Tipo union para datos de progreso específicos
export type DatosProgresoEspecificos = DatosSimulador | DatosTrivia | DatosJuego | any;

// Interface para respuesta del servidor
export interface RespuestaServidor {
  exito: boolean;
  mensaje: string;
  datos?: any;
  error?: string;
}

// Interface para filtros de actividades
export interface FiltrosActividades {
  tipo?: string[];
  nivel?: string[];
  completadas?: boolean;
  puntuacionMinima?: number;
  ordenPor?: 'titulo' | 'puntos' | 'fecha' | 'progreso';
  orden?: 'asc' | 'desc';
}

// Interface para paginación
export interface PaginacionActividades {
  pagina: number;
  elementosPorPagina: number;
  total: number;
  totalPaginas: number;
}

export interface RespuestaActividadesPaginada {
  actividades: Actividad[];
  paginacion: PaginacionActividades;
}

// Enums para mejor tipado
export enum TipoActividad {
  SIMULADOR = 'simulador',
  TRIVIA = 'trivia',
  JUEGO = 'juego',
  QUIZ = 'quiz'
}

export enum NivelDificultad {
  BASICO = 'basico',
  INTERMEDIO = 'intermedio',
  AVANZADO = 'avanzado'
}

export enum EstadoActividad {
  NO_INICIADA = 'no_iniciada',
  EN_PROGRESO = 'en_progreso',
  COMPLETADA = 'completada',
  ABANDONADA = 'abandonada'
}

// Interface para métricas de rendimiento
export interface MetricasRendimiento {
  tiempoPromedioPorActividad: number;
  puntuacionPromedio: number;
  tasaCompletitud: number; // Porcentaje de actividades completadas
  mejorRacha: number; // Días consecutivos con actividad
  actividadesPorSemana: number;
  categoriaFavorita: string;
  horaPreferida: string; // Hora del día más activa
}

// Interface para notificaciones de actividades
export interface NotificacionActividad {
  id: number;
  idUsuario: number;
  tipo: 'logro' | 'recordatorio' | 'nuevo_contenido' | 'ranking';
  titulo: string;
  mensaje: string;
  leida: boolean;
  fechaCreacion: Date;
  datosExtra?: any;
}

