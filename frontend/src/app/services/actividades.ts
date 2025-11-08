import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, retry, tap } from 'rxjs/operators';
import { Actividad, ProgresoActividad, EstadisticasActividades } from '../models/actividad.model';
import { environment } from '../environments/environment';
import { LogrosService } from './logros.service';


@Injectable({
  providedIn: 'root'
})
export class ActividadesService {
  private apiUrl = environment.apiUrl; // ✅ Usa environment
  private actividadesSubject = new BehaviorSubject<Actividad[]>([]);
  public actividades$ = this.actividadesSubject.asObservable();

  constructor(private http: HttpClient,
  private logrosService: LogrosService
  )
  
   {}

  /**
   * Obtiene todas las actividades disponibles
   */
  obtenerActividades(): Observable<Actividad[]> {
    return this.http.get<any[]>(`${this.apiUrl}/actividades`)
      .pipe(
        retry(2), // Reintentar 2 veces en caso de error
        map(actividades => this.mapearActividades(actividades)),
        catchError(this.handleError('obtenerActividades', []))
      );
  }

  /**
   * Mapea las actividades del backend al formato del frontend
   */
  private mapearActividades(actividadesBackend: any[]): Actividad[] {
    return actividadesBackend.map(act => ({
      id: act.id,
      titulo: act.titulo,
      descripcion: act.descripcion,
      tipo: act.tipo as 'simulador' | 'trivia' | 'juego',
      icono: act.icono || 'fas fa-gamepad',
      color: act.color || '#3498db',
      nivel: act.nivel as 'basico' | 'intermedio' | 'avanzado',
      puntos: act.puntos || 0,
      duracion: act.duracion || '10-15 min',
      completada: false, // Se actualizará con el progreso
      progreso: 0 // Se actualizará con el progreso
    }));
  }

  /**
   * Obtiene el progreso del usuario para todas las actividades
   */
  obtenerProgresoUsuario(idUsuario: number): Observable<ProgresoActividad[]> {
    return this.http.get<any[]>(`${this.apiUrl}/progreso-actividades/${idUsuario}`)
      .pipe(
        retry(2),
        map(progreso => this.mapearProgreso(progreso)),
        catchError(this.handleError('obtenerProgresoUsuario', []))
      );
  }

  /**
   * Mapea el progreso del backend al formato del frontend
   */
  private mapearProgreso(progresoBackend: any[]): ProgresoActividad[] {
    return progresoBackend.map(prog => ({
      id: prog.id,
      idUsuario: prog.id_usuario,
      idActividad: prog.id_actividad,
      completada: prog.completada === 1,
      progreso: prog.progreso || 0,
      puntuacionMaxima: prog.puntuacion_maxima || 0,
      intentos: prog.intentos || 1,
      tiempoTotal: prog.tiempo_total || 0,
      ultimaActividad: new Date(prog.ultima_actividad),
      datosProgreso: prog.datos_progreso ? JSON.parse(prog.datos_progreso) : null
    }));
  }

  /**
   * Guarda el progreso de una actividad
   */
  guardarProgreso(progreso: ProgresoActividad): Observable<any> {
  const progresoBackend = {
    idUsuario: progreso.idUsuario,
    idActividad: progreso.idActividad,
    completada: progreso.completada,
    progreso: progreso.progreso,
    puntuacionMaxima: progreso.puntuacionMaxima,
    intentos: progreso.intentos,
    tiempoTotal: progreso.tiempoTotal,
    datosProgreso: progreso.datosProgreso
  };

    return this.http.post(`${this.apiUrl}/progreso-actividades`, progresoBackend).pipe(
    retry(1),
    tap((response: any) => {
      // ✅ NOTIFICAR LOGROS OBTENIDOS
      if (response.logrosNuevos && response.logrosNuevos.length > 0) {
        this.logrosService.mostrarLogrosObtenidos(response.logrosNuevos);
      }
    }),
    catchError(this.handleError('guardarProgreso'))
  );
}

  /**
   * Obtiene las estadísticas del usuario
   */
  obtenerEstadisticas(idUsuario: number): Observable<EstadisticasActividades> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas-actividades/${idUsuario}`)
      .pipe(
        retry(2),
        map(stats => this.mapearEstadisticas(stats)),
        catchError(this.handleError('obtenerEstadisticas', this.getEstadisticasVacias()))
      );
  }

  /**
   * Mapea las estadísticas del backend al formato del frontend
   */
  private mapearEstadisticas(statsBackend: any): EstadisticasActividades {
    return {
      totalActividades: statsBackend.totalActividades || 0,
      actividadesCompletadas: statsBackend.actividadesCompletadas || 0,
      puntosTotal: statsBackend.puntosTotal || 0,
      tiempoTotalMinutos: statsBackend.tiempoTotalMinutos || 0,
      actividadFavorita: statsBackend.actividadFavorita || 'Ninguna'
    };
  }

  /**
   * Obtiene el historial de actividades del usuario
   */
  obtenerHistorialActividades(idUsuario: number, limite: number = 20): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/historial-actividades/${idUsuario}?limite=${limite}`)
      .pipe(
        retry(2),
        catchError(this.handleError('obtenerHistorialActividades', []))
      );
  }

  /**
   * Combina actividades con progreso del usuario
   */
  obtenerActividadesConProgreso(idUsuario: number): Observable<Actividad[]> {
    return this.obtenerActividades().pipe(
      map(actividades => {
        this.obtenerProgresoUsuario(idUsuario).subscribe(progreso => {
          const actividadesConProgreso = actividades.map(actividad => {
            const progresoActividad = progreso.find(p => p.idActividad === actividad.id);
            if (progresoActividad) {
              actividad.completada = progresoActividad.completada;
              actividad.progreso = progresoActividad.progreso;
              actividad.puntuacionMaxima = progresoActividad.puntuacionMaxima;
              actividad.ultimaVez = progresoActividad.ultimaActividad;
            }
            return actividad;
          });
          this.actividadesSubject.next(actividadesConProgreso);
        });
        return actividades;
      })
    );
  }

  /**
   * Actualiza una actividad específica con nuevo progreso
   */
  actualizarActividadProgreso(idActividad: number, progreso: Partial<ProgresoActividad>): void {
    const actividadesActuales = this.actividadesSubject.value;
    const actividadIndex = actividadesActuales.findIndex(a => a.id === idActividad);
    
    if (actividadIndex !== -1) {
      const actividadActualizada = {
        ...actividadesActuales[actividadIndex],
        completada: progreso.completada ?? actividadesActuales[actividadIndex].completada,
        progreso: progreso.progreso ?? actividadesActuales[actividadIndex].progreso,
        puntuacionMaxima: progreso.puntuacionMaxima ?? actividadesActuales[actividadIndex].puntuacionMaxima,
        ultimaVez: progreso.ultimaActividad ?? actividadesActuales[actividadIndex].ultimaVez
      };
      
      actividadesActuales[actividadIndex] = actividadActualizada;
      this.actividadesSubject.next([...actividadesActuales]);
    }
  }

  /**
   * Registra el inicio de una actividad
   */
  iniciarActividad(idUsuario: number, idActividad: number): Observable<any> {
    const progresoInicial: ProgresoActividad = {
      id: 0,
      idUsuario: idUsuario,
      idActividad: idActividad,
      completada: false,
      progreso: 0,
      puntuacionMaxima: 0,
      intentos: 1,
      tiempoTotal: 0,
      ultimaActividad: new Date()
    };

    return this.guardarProgreso(progresoInicial);
  }

  /**
   * Finaliza una actividad con resultados
   */
  finalizarActividad(
  idUsuario: number, 
  idActividad: number, 
  resultados: {
    completada: boolean;
    puntuacion: number;
    tiempoMinutos: number;
    datosAdicionales?: any;
  }
): Observable<any> {
  const progreso: ProgresoActividad = {
    id: 0,
    idUsuario: idUsuario,
    idActividad: idActividad,
    completada: resultados.completada,
    progreso: resultados.completada ? 100 : 50,
    puntuacionMaxima: resultados.puntuacion,
    intentos: 1,
    tiempoTotal: resultados.tiempoMinutos,
    ultimaActividad: new Date(),
    datosProgreso: resultados.datosAdicionales
  };

  return this.guardarProgreso(progreso).pipe(
    map(response => {
      // Actualizar la actividad localmente
      this.actualizarActividadProgreso(idActividad, progreso);
      
      // ✅ Los logros ya se notifican en guardarProgreso
      return response;
    })
  );
}

  /**
   * Obtiene estadísticas vacías por defecto
   */
  private getEstadisticasVacias(): EstadisticasActividades {
    return {
      totalActividades: 0,
      actividadesCompletadas: 0,
      puntosTotal: 0,
      tiempoTotalMinutos: 0,
      actividadFavorita: 'Ninguna'
    };
  }

  /**
   * Manejo genérico de errores
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      // Log del error para debugging
      if (error.error instanceof ErrorEvent) {
        // Error del lado del cliente
        console.error('Error del cliente:', error.error.message);
      } else {
        // Error del backend
        console.error(
          `Backend returned code ${error.status}, ` +
          `body was: ${JSON.stringify(error.error)}`);
      }
      
      // Devolver un resultado por defecto para que la app siga funcionando
      return of(result as T);
    };
  }

  /**
   * Verifica la conectividad con el backend
   */
  verificarConectividad(): Observable<boolean> {
    return this.http.get(`${this.apiUrl}/health-check`, { observe: 'response' })
      .pipe(
        map(response => response.status === 200),
        catchError(() => of(false))
      );
  }

  /**
   * Limpia la caché local de actividades
   */
  limpiarCache(): void {
    this.actividadesSubject.next([]);
  }

  /**
   * Obtiene el progreso de una actividad específica
   */
  obtenerProgresoActividad(idUsuario: number, idActividad: number): Observable<ProgresoActividad | null> {
    return this.obtenerProgresoUsuario(idUsuario).pipe(
      map(progresos => progresos.find(p => p.idActividad === idActividad) || null)
    );
  }
}