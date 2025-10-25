import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, catchError, tap, retry, finalize } from 'rxjs/operators';
import { AuthService } from './auth';
import { LogrosService } from './logros.service';

export interface Lectura {
  id: number;
  id_modulo: number;
  titulo: string;
  descripcion: string;
  contenido: string;
  orden: number;
  
  duracion: number;
  puntos: number;
  completado: boolean;
  porcentaje_leido?: number;
  posicion_scroll?: number;
  tiempo_lectura?: number;
}

export interface MaterialAdicional {
  id?: number;
  tipo: 'pdf' | 'video' | 'imagen' | 'documento' | 'presentacion' | 'hoja_calculo' | 'otro';
  titulo: string;
  descripcion: string;
  url_archivo?: string;
  nombre_archivo?: string;
  tamaño?: number;
  tamañoFormateado?: string;
  icono: string;
}

export interface Modulo {
  id: number;
  titulo: string;
  descripcion: string;
  nivel: 'basico' | 'intermedio' | 'avanzado';
  progreso: number;
  lecturas: Lectura[];
  materialesAdicionales: MaterialAdicional[];
  icono: string;
  color: string;
  bloqueado: boolean;
  duracionTotal: string;
  puntos: number;
  orden: number;
  activo: boolean;
  fecha_creacion?: Date;
  progreso_porcentaje?: number;
  lecturas_completadas?: number;
  total_lecturas?: number;
  total_materiales?: number; 
  completado?: boolean;  
}

export interface ProgresoLectura {
  id_lectura: number;
  porcentaje_leido: number;
  posicion_scroll: number;
  tiempo_lectura: number;
  completado: boolean;
}

export interface ProgresoResponse {
  success: boolean;
  mensaje: string;
  nuevo_progreso: number;
  lecturas_completadas: number;
  total_lecturas: number;
  modulo_completado: boolean;
  siguiente_modulo_desbloqueado: boolean;
}

export interface EstadisticasProgreso {
  progreso_total: number;
  modulos_completados: number;
  lecturas_completadas: number;
  ultima_actividad: string | null;
}

export interface NotasLectura {
  id?: number;
  id_usuario: number;
  id_lectura: number;
  contenido: string;
  fecha_creacion?: Date;
  fecha_modificacion?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ModulosService {
  private readonly API_URL = 'http://localhost:3000/api';
  private readonly MODULOS_URL = `${this.API_URL}/modulos`;
  private readonly MATERIALES_URL = `${this.API_URL}/materiales`;
  
  private modulosSubject = new BehaviorSubject<Modulo[]>([]);
  private cargandoSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  public modulos$ = this.modulosSubject.asObservable();
  public cargando$ = this.cargandoSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(
    private http: HttpClient, 
    private authService: AuthService,
    private logrosService: LogrosService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private setLoading(loading: boolean): void {
    this.cargandoSubject.next(loading);
  }

  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  

  // ==================== MÓDULOS ====================

  cargarModulosConProgreso(): Observable<Modulo[]> {
    this.setLoading(true);
    this.setError(null);
    
    return this.http.get<{data: any[]}>(`${this.MODULOS_URL}/con-progreso`, { 
      headers: this.getHeaders() 
    }).pipe(
      retry(2),
      map((response: any) => {
        const modulos = this.procesarModulos(response.data || response);
        this.modulosSubject.next(modulos);
        return modulos;
      }),
      finalize(() => this.setLoading(false)),
      catchError(error => {
        this.setLoading(false);
        const errorMessage = this.getErrorMessage(error);
        this.setError(errorMessage);
        console.error('Error cargando módulos:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerModulo(id: number): Observable<Modulo> {
  if (!id || id <= 0) {
    return throwError(() => new Error('ID de módulo inválido'));
  }

  return this.http.get<{data: Modulo}>(`${this.MODULOS_URL}/${id}`, { 
    headers: this.getHeaders() 
  }).pipe(
    map(response => response.data),
    catchError(error => {
      console.error('Error obteniendo módulo:', error);
      return throwError(() => error);
    })
  );
}

  // ==================== LECTURAS ====================

  obtenerLecturasModulo(idModulo: number): Observable<Lectura[]> {
    return this.http.get<{data: Lectura[]}>(`${this.MODULOS_URL}/${idModulo}/lecturas`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error obteniendo lecturas:', error);
        return of([]);
      })
    );
  }

  obtenerLectura(idLectura: number): Observable<Lectura> {
    return this.http.get<{data: Lectura}>(`${this.MODULOS_URL}/lecturas/${idLectura}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error obteniendo lectura:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== PROGRESO DE LECTURA CON SCROLL ====================

  guardarProgresoLectura(progresoData: ProgresoLectura): Observable<any> {
    return this.http.post(`${this.MODULOS_URL}/progreso-lectura`, progresoData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.warn('Error guardando progreso de lectura:', error);
        return of({ success: false });
      })
    );
  }

  obtenerProgresoLectura(idLectura: number): Observable<ProgresoLectura | null> {
    return this.http.get<{data: ProgresoLectura}>(`${this.MODULOS_URL}/progreso-lectura/${idLectura}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data),
      catchError(error => {
        console.warn('Error obteniendo progreso de lectura:', error);
        return of(null);
      })
    );
  }

  marcarLecturaCompletada(idLectura: number, idModulo: number): Observable<ProgresoResponse> {
  if (!idLectura || !idModulo || idLectura <= 0 || idModulo <= 0) {
    return throwError(() => new Error('IDs de lectura y módulo son requeridos'));
  }

  const payload = {
    id_lectura: idLectura,
    id_modulo: idModulo
  };

  return this.http.post<ProgresoResponse>(`${this.MODULOS_URL}/progreso/marcar-lectura`, payload, {
    headers: this.getHeaders()
  }).pipe(
    tap((response: ProgresoResponse & { logrosNuevos?: any[] }) => {
      this.actualizarProgresoModuloLocal(idModulo, response.nuevo_progreso);
      
      // ✅ NOTIFICAR LOGROS OBTENIDOS
      if (response.logrosNuevos && response.logrosNuevos.length > 0) {
        this.logrosService.mostrarLogrosObtenidos(response.logrosNuevos);
      }
      
      if (response.modulo_completado) {
        console.log('¡Módulo completado!', `Has completado el módulo exitosamente`);
      }
      if (response.siguiente_modulo_desbloqueado) {
        console.log('¡Nuevo módulo desbloqueado!', `Ya puedes acceder al siguiente módulo`);
      }
    }),
    catchError(error => {
      console.error('Error marcando lectura completada:', error);
      const errorMessage = this.getErrorMessage(error);
      return throwError(() => new Error(errorMessage));
    })
  );
}

  // ==================== MATERIALES ADICIONALES ====================

  obtenerMaterialesModulo(idModulo: number): Observable<MaterialAdicional[]> {
    return this.http.get<{data: MaterialAdicional[]}>(`${this.MATERIALES_URL}/modulo/${idModulo}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error obteniendo materiales:', error);
        return of([]);
      })
    );
  }

  descargarMaterial(material: MaterialAdicional): Observable<Blob> {
  if (!material.id) {
    console.error('❌ Material sin ID:', material);
    return throwError(() => new Error('Material no tiene ID válido'));
  }

  const token = this.authService.getToken();
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  console.log('📥 Descargando material ID:', material.id);

  // Usar la nueva ruta de descarga por ID
  return this.http.get(
    `${this.API_URL}/materiales/descargar/${material.id}`,
    { 
      responseType: 'blob',
      headers: headers
    }
  ).pipe(
    tap(() => console.log('✅ Material descargado')),
    catchError(error => {
      console.error('❌ Error descargando material:', error);
      return throwError(() => new Error('Error descargando material'));
    })
  );
}

  subirMaterial(formData: FormData): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // No agregar Content-Type, FormData lo maneja automáticamente
    });

    return this.http.post(`${this.MATERIALES_URL}/subir`, formData, {
      headers: headers
    }).pipe(
      catchError(error => {
        console.error('Error subiendo material:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== NOTAS ====================

  guardarNotasLectura(idLectura: number, contenido: string): Observable<{success: boolean; mensaje: string}> {
    if (!idLectura || idLectura <= 0) {
      return throwError(() => new Error('ID de lectura requerido'));
    }

    const notas = {
      id_lectura: idLectura,
      contenido: contenido || ''
    };

    return this.http.post<{success: boolean; mensaje: string}>(`${this.MODULOS_URL}/notas-lectura`, notas, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error guardando notas:', error);
        const errorMessage = this.getErrorMessage(error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  obtenerNotasLectura(idLectura: number): Observable<string> {
    if (!idLectura || idLectura <= 0) {
      return of('');
    }

    const idUsuario = this.authService.getUserId();
    return this.http.get<{contenido: string}>(`${this.MODULOS_URL}/notas-lectura/${idUsuario}/${idLectura}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.contenido || ''),
      catchError(error => {
        console.warn('Error obteniendo notas (usando valor por defecto):', error);
        return of('');
      })
    );
  }

  // ==================== ESTADÍSTICAS ====================

  registrarTiempoEstudio(idLectura: number, tiempoMinutos: number): Observable<{success: boolean; mensaje: string; logrosNuevos?: any[]}> {
  if (!idLectura || !tiempoMinutos || idLectura <= 0 || tiempoMinutos <= 0) {
    return throwError(() => new Error('Datos de tiempo inválidos'));
  }

  const payload = {
    id_lectura: idLectura,
    tiempo_minutos: Math.round(tiempoMinutos)
  };

  return this.http.post<{success: boolean; mensaje: string; logrosNuevos?: any[]}>(
    `${this.MODULOS_URL}/tiempo-estudio`, 
    payload, 
    { headers: this.getHeaders() }
  ).pipe(
    tap(response => {
      // ✅ NOTIFICAR LOGROS POR TIEMPO DE ESTUDIO
      if (response.logrosNuevos && response.logrosNuevos.length > 0) {
        this.logrosService.mostrarLogrosObtenidos(response.logrosNuevos);
      }
    }),
    catchError(error => {
      console.warn('Error registrando tiempo (continuando):', error);
      return of({ success: false, mensaje: 'Error registrando tiempo' });
    })
  );
}

  obtenerEstadisticasProgreso(): Observable<EstadisticasProgreso> {
    return this.http.get<EstadisticasProgreso>(`${this.MODULOS_URL}/progreso/estadisticas`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo estadísticas:', error);
        return of({
          progreso_total: 0,
          modulos_completados: 0,
          lecturas_completadas: 0,
          ultima_actividad: null
        });
      })
    );
  }

  // ==================== UTILIDADES ====================

  resetearProgresoModulo(idModulo: number): Observable<{success: boolean; mensaje: string}> {
    if (!idModulo || idModulo <= 0) {
      return throwError(() => new Error('ID de módulo inválido'));
    }

    return this.http.delete<{success: boolean; mensaje: string}>(`${this.MODULOS_URL}/progreso/modulo/${idModulo}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        this.cargarModulosConProgreso().subscribe({
          error: (error) => console.warn('Error recargando módulos después del reset:', error)
        });
      }),
      catchError(error => {
        console.error('Error reseteando progreso:', error);
        const errorMessage = this.getErrorMessage(error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // ==================== PROCESAMIENTO DE DATOS ====================

  private procesarModulos(data: any[]): Modulo[] {
    if (!Array.isArray(data)) {
      console.warn('Datos de módulos no es un array:', data);
      return [];
    }
    
    return data.map(modulo => this.procesarModuloIndividual(modulo))
              .sort((a, b) => a.orden - b.orden);
  }

  private procesarModuloIndividual(data: any): Modulo {
    const lecturas: Lectura[] = [];
    if (data.lectura_titulo && data.lectura_contenido) {
      lecturas.push({
        id: data.id,
        id_modulo: data.id,
        titulo: data.lectura_titulo,
        descripcion: data.descripcion || '',
        contenido: data.lectura_contenido,
        orden: 1,
        duracion: 10,
        puntos: 50,
        completado: (data.progreso_porcentaje || data.progreso || 0) >= 100
      });
    }

    return {
      id: data.id,
      titulo: data.titulo || 'Módulo sin título',
      descripcion: data.descripcion || '',
      nivel: data.nivel || 'basico',
      progreso: Math.round(data.progreso_porcentaje || data.progreso || 0),
      lecturas: lecturas,
      materialesAdicionales: this.procesarMateriales(data.material_adicional),
      icono: data.icono || 'fas fa-book',
      color: data.color || '#00a8e8',
      bloqueado: data.bloqueado !== undefined ? data.bloqueado : false,
      duracionTotal: this.calcularDuracionTotal(lecturas),
      puntos: data.puntos || 100,
      orden: data.orden || 1,
      activo: data.activo !== undefined ? data.activo : true,
      fecha_creacion: data.fecha_creacion ? new Date(data.fecha_creacion) : undefined,
      progreso_porcentaje: Math.round(data.progreso_porcentaje || data.progreso || 0),
      lecturas_completadas: data.lecturas_completadas || 0,
      total_lecturas: data.total_lecturas || 0,
      total_materiales: data.total_materiales || 0,
      completado: Math.round(data.progreso_porcentaje || data.progreso || 0) >= 100
    };
  }

  private procesarMateriales(materialesData: any): MaterialAdicional[] {
    if (!materialesData) {
      return [];
    }
    
    try {
      const materiales = typeof materialesData === 'string' 
        ? JSON.parse(materialesData) 
        : materialesData;
        
      return Array.isArray(materiales) ? materiales : [];
    } catch (error) {
      console.error('Error procesando materiales:', error);
      return [];
    }
  }

  private calcularDuracionTotal(lecturas: Lectura[]): string {
    if (!Array.isArray(lecturas) || lecturas.length === 0) return '10 min';
    
    let totalMinutos = lecturas.reduce((sum, lectura) => sum + (lectura.duracion || 10), 0);
    
    if (totalMinutos >= 60) {
      const horas = Math.floor(totalMinutos / 60);
      const minutos = totalMinutos % 60;
      return `${horas}h ${minutos}min`;
    }
    return `${totalMinutos} min`;
  }

  private actualizarProgresoModuloLocal(idModulo: number, nuevoProgreso: number): void {
    const modulosActuales = this.modulosSubject.value;
    const moduloIndex = modulosActuales.findIndex(m => m.id === idModulo);
    
    if (moduloIndex !== -1) {
      modulosActuales[moduloIndex].progreso = nuevoProgreso;
      modulosActuales[moduloIndex].progreso_porcentaje = nuevoProgreso;
      
      if (nuevoProgreso >= 100 && modulosActuales[moduloIndex].lecturas.length > 0) {
        modulosActuales[moduloIndex].lecturas[0].completado = true;
      }
      
      this.actualizarBloqueoModulos(modulosActuales);
      
      if (nuevoProgreso >= 100) {
        const puntosObtenidos = modulosActuales[moduloIndex].puntos || 100;
        console.log(`¡Módulo completado! +${puntosObtenidos} puntos obtenidos`);
      }
      
      this.modulosSubject.next([...modulosActuales]);
    }
  }

  private actualizarModuloLocal(modulo: Modulo): void {
    const modulosActuales = this.modulosSubject.value;
    const moduloIndex = modulosActuales.findIndex(m => m.id === modulo.id);
    
    if (moduloIndex !== -1) {
      modulosActuales[moduloIndex] = modulo;
      this.modulosSubject.next([...modulosActuales]);
    }
  }

  private actualizarBloqueoModulos(modulos: Modulo[]): void {
    modulos.forEach((modulo, index) => {
      if (index === 0) {
        modulo.bloqueado = false;
      } else {
        const moduloAnterior = modulos[index - 1];
        modulo.bloqueado = (moduloAnterior.progreso || 0) < 80;
      }
    });
  }

  private getErrorMessage(error: any): string {
    if (error.error?.error) {
      return error.error.error;
    }
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.message) {
      return error.message;
    }
    if (error.status === 401) {
      return 'Sesión expirada. Por favor inicia sesión nuevamente.';
    }
    if (error.status === 403) {
      return 'No tienes permisos para realizar esta acción.';
    }
    if (error.status === 404) {
      return 'Recurso no encontrado.';
    }
    if (error.status === 500) {
      return 'Error interno del servidor. Por favor intenta más tarde.';
    }
    if (error.status === 0) {
      return 'No se puede conectar al servidor. Verifica tu conexión.';
    }
    return 'Ha ocurrido un error inesperado.';
  }

  // ==================== PÚBLICOS ====================

  calcularProgresoTotal(): number {
    const modulos = this.modulosSubject.value;
    if (modulos.length === 0) return 0;
    
    const sumaProgresos = modulos.reduce((suma, modulo) => {
      return suma + Math.round(modulo.progreso || 0); // ✅ REDONDEAR
    }, 0);
    
    return Math.round(sumaProgresos / modulos.length); // ✅ REDONDEAR
  }

  obtenerNivelColor(nivel: string): string {
    const colores = {
      'basico': '#2ecc71',
      'intermedio': '#f39c12',
      'avanzado': '#e74c3c'
    };
    return colores[nivel as keyof typeof colores] || '#6c757d';
  }

  debeEstarDesbloqueado(moduloAnteriorProgreso: number): boolean {
    return moduloAnteriorProgreso >= 80;
  }

  obtenerModulos(): Modulo[] {
    return this.modulosSubject.value;
  }

  hayModulosCargados(): boolean {
    return this.modulosSubject.value.length > 0;
  }

  limpiarEstado(): void {
    this.modulosSubject.next([]);
    this.cargandoSubject.next(false);
    this.errorSubject.next(null);
  }

  recargarModulos(): Observable<Modulo[]> {
    this.limpiarEstado();
    return this.cargarModulosConProgreso();
  }
}