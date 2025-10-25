import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface ProgresoContenido {
  id?: number;
  id_usuario: number;
  id_contenido: number;
  leido: boolean;
  fecha_lectura?: Date;
}

export interface ProgresoModulo {
  moduloId: number;
  porcentajeCompletado: number;
  lecturasCompletadas: number;
  totalLecturas: number;
}

export interface EstadisticasProgreso {
  progresoTotal: number;
  modulosCompletados: number;
  lecturasLeidas: number;
  ultimaActividad: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private readonly API_URL = '/api'; // Ajustar según tu configuración
  
  // Subject para emitir cambios en el progreso en tiempo real
  private progresoSubject = new BehaviorSubject<EstadisticasProgreso | null>(null);
  public progreso$ = this.progresoSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el progreso completo de un usuario
   */
  obtenerProgresoUsuario(idUsuario: number): Observable<ProgresoContenido[]> {
    return this.http.get<ProgresoContenido[]>(`${this.API_URL}/progreso-contenido/${idUsuario}`)
      .pipe(
        catchError(this.handleError<ProgresoContenido[]>('obtenerProgresoUsuario', []))
      );
  }

  /**
   * Marca una lectura como completada
   */
  marcarLecturaCompletada(idUsuario: number, idContenido: number): Observable<any> {
    const progreso: ProgresoContenido = {
      id_usuario: idUsuario,
      id_contenido: idContenido,
      leido: true,
      fecha_lectura: new Date()
    };

    return this.http.post(`${this.API_URL}/progreso-contenido`, progreso)
      .pipe(
        map(response => {
          // Actualizar estadísticas locales después de marcar como completado
          this.actualizarEstadisticasProgreso(idUsuario);
          return response;
        }),
        catchError(this.handleError<any>('marcarLecturaCompletada'))
      );
  }

  /**
   * Obtiene estadísticas generales de progreso
   */
  obtenerEstadisticasProgreso(idUsuario: number): Observable<EstadisticasProgreso> {
    return this.http.get<EstadisticasProgreso>(`${this.API_URL}/estadisticas-progreso/${idUsuario}`)
      .pipe(
        map(stats => {
          this.progresoSubject.next(stats);
          return stats;
        }),
        catchError(this.handleError<EstadisticasProgreso>('obtenerEstadisticasProgreso'))
      );
  }

  /**
   * Obtiene el progreso por módulos
   */
  obtenerProgresoModulos(idUsuario: number): Observable<ProgresoModulo[]> {
    return this.http.get<ProgresoModulo[]>(`${this.API_URL}/progreso-modulos/${idUsuario}`)
      .pipe(
        catchError(this.handleError<ProgresoModulo[]>('obtenerProgresoModulos', []))
      );
  }

  /**
   * Guarda notas de una lectura
   */
  guardarNotasLectura(idUsuario: number, idLectura: number, contenido: string): Observable<any> {
    const notas = {
      id_usuario: idUsuario,
      id_lectura: idLectura,
      contenido: contenido,
      fecha_creacion: new Date()
    };

    return this.http.post(`${this.API_URL}/notas-lectura`, notas)
      .pipe(
        catchError(this.handleError<any>('guardarNotasLectura'))
      );
  }

  /**
   * Obtiene las notas de una lectura
   */
  obtenerNotasLectura(idUsuario: number, idLectura: number): Observable<string> {
    return this.http.get<{contenido: string}>(`${this.API_URL}/notas-lectura/${idUsuario}/${idLectura}`)
      .pipe(
        map(response => response.contenido || ''),
        catchError(this.handleError<string>('obtenerNotasLectura', ''))
      );
  }

  /**
   * Registra tiempo de estudio
   */
  registrarTiempoEstudio(idUsuario: number, idLectura: number, tiempoMinutos: number): Observable<any> {
    const tiempoEstudio = {
      id_usuario: idUsuario,
      id_lectura: idLectura,
      tiempo_minutos: tiempoMinutos,
      fecha: new Date()
    };

    return this.http.post(`${this.API_URL}/tiempo-estudio`, tiempoEstudio)
      .pipe(
        catchError(this.handleError<any>('registrarTiempoEstudio'))
      );
  }

  /**
   * Obtiene el ranking de progreso (opcional para gamificación)
   */
  obtenerRankingProgreso(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/ranking-progreso`)
      .pipe(
        catchError(this.handleError<any[]>('obtenerRankingProgreso', []))
      );
  }

  /**
   * Actualiza las estadísticas de progreso internamente
   */
  private actualizarEstadisticasProgreso(idUsuario: number): void {
    this.obtenerEstadisticasProgreso(idUsuario).subscribe();
  }

  /**
   * Obtiene recomendaciones de contenido basado en progreso
   */
  obtenerRecomendaciones(idUsuario: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/recomendaciones/${idUsuario}`)
      .pipe(
        catchError(this.handleError<any[]>('obtenerRecomendaciones', []))
      );
  }

  /**
   * Manejo genérico de errores
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      // Aquí podrías enviar el error a un servicio de logging
      // this.logError(error);
      
      // Retornar un resultado por defecto para que la app siga funcionando
      return new Observable<T>(observer => {
        observer.next(result as T);
        observer.complete();
      });
    };
  }

  /**
   * Método para resetear progreso (útil para testing o funciones admin)
   */
  resetearProgresoUsuario(idUsuario: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/progreso-contenido/${idUsuario}`)
      .pipe(
        map(response => {
          // Limpiar estado local
          this.progresoSubject.next(null);
          return response;
        }),
        catchError(this.handleError<any>('resetearProgresoUsuario'))
      );
  }

  /**
   * Exportar progreso del usuario (para respaldos o análisis)
   */
  exportarProgreso(idUsuario: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/exportar-progreso/${idUsuario}`, { 
      responseType: 'blob' 
    }).pipe(
      catchError(this.handleError<Blob>('exportarProgreso'))
    );
  }

  /**
   * Método de utilidad para calcular porcentaje de progreso
   */
  calcularPorcentajeProgreso(completadas: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completadas / total) * 100);
  }

  /**
   * Método de utilidad para determinar si un módulo debe estar desbloqueado
   */
  debeEstarDesbloqueado(moduloAnteriorProgreso: number, requerido: number = 80): boolean {
    return moduloAnteriorProgreso >= requerido;
  }

  /**
   * Obtiene el historial de actividad del usuario
   */
  obtenerHistorialActividad(idUsuario: number, limite: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/historial-actividad/${idUsuario}?limite=${limite}`)
      .pipe(
        catchError(this.handleError<any[]>('obtenerHistorialActividad', []))
      );
  }

  /**
   * Método para sincronización offline (funcionalidad futura)
   */
  sincronizarProgresoOffline(datosOffline: any[]): Observable<any> {
    return this.http.post(`${this.API_URL}/sincronizar-offline`, datosOffline)
      .pipe(
        catchError(this.handleError<any>('sincronizarProgresoOffline'))
      );
  }
}