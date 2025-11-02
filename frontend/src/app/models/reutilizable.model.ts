export interface TarjetaAgua {
  id: number;
  nombre: string;
  descripcion: string;
  icono: string;
  imagen?: string;
  categoriaCorrecta: 'reutilizable' | 'tratamiento' | 'no-reutilizable';
  explicacion: string;
}

export interface ResultadoJuegoReutilizable {
  idUsuario: number;
  idActividad: number;
  respuestasCorrectas: number;
  totalTarjetas: number;
  precision: number;
  puntuacion: number;
  tiempoTotal: number;
  nivel: 'basico' | 'intermedio' | 'avanzado';
  intentos: number;
  tarjetasErradas: TarjetaAgua[];
  fechaCompletado: Date;
  datosProgreso?: {
    tiempoPromedioPorTarjeta: number;
    primerIntento: boolean;
    medallaObtenida: 'oro' | 'plata' | 'bronce';
  };
}

export interface PuntajeReutilizable {
  tarjetasCorrectas: number;
  tarjetasIncorrectas: number;
  tarjetasOmitidas: number;
  puntosPorAcierto: number;
  bonificacionesAplicadas: number;
  puntuacionFinal: number;
}