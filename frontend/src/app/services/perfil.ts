// src/app/services/perfil.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of, Subject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth';
import { environment } from '../environments/environment';
import { 
  Usuario, 
  HistorialSesion, 
  CambioContrasena, 
  Logro, 
  CertificadoUsuario,
  ConfiguracionUsuario 
} from '../interfaces/usuario';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  private apiUrl = environment.apiUrl; // ✅ Usa environment
  private usuarioActualSubject = new BehaviorSubject<Usuario | null>(null);
  public usuarioActual$ = this.usuarioActualSubject.asObservable();
  // Subject para emitir actualizaciones del historial de actividad
  private historialSubject = new Subject<any[]>();
  public historial$ = this.historialSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.cargarUsuarioDesdeStorage();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private cargarUsuarioDesdeStorage(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.obtenerPerfilCompleto().subscribe({
        next: (usuario) => this.usuarioActualSubject.next(usuario),
        error: (error) => console.error('Error al cargar perfil:', error)
      });
    }
  }

  // === INFORMACIÓN PERSONAL === //
  obtenerPerfilCompleto(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/perfil`, {
      headers: this.getHeaders()
    });
  }

  actualizarInformacionPersonal(data: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/perfil/informacion`, data, {
      headers: this.getHeaders()
    }).pipe(
      tap(usuario => {
        // Actualizar en AuthService también
        this.authService.actualizarUsuario(usuario);
      })
    );
  }

  /**
   * Subir foto de perfil - MEJORADO con actualización en AuthService
   */
  subirFotoPerfil(archivo: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('foto', archivo);
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });

    return this.http.post<{ url: string }>(`${this.apiUrl}/perfil/foto`, formData, {
      headers
    }).pipe(
      tap(response => {
        // ✅ CRÍTICO: Actualizar foto en AuthService inmediatamente
        if (response.url) {
          this.authService.actualizarFotoUsuario(response.url);
        }
      })
    );
  }

  // === SEGURIDAD === //
  cambiarContrasena(data: CambioContrasena): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(`${this.apiUrl}/perfil/contrasena`, data, {
      headers: this.getHeaders()
    });
  }

  obtenerHistorialSesiones(): Observable<HistorialSesion[]> {
    return this.http.get<HistorialSesion[]>(`${this.apiUrl}/perfil/historial-sesiones`, {
      headers: this.getHeaders()
    });
  }

  cerrarSesionRemota(sesionId: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/perfil/sesiones/${sesionId}`, {
      headers: this.getHeaders()
    });
  }

  // === CONFIGURACIÓN === //
  actualizarConfiguracion(config: ConfiguracionUsuario): Observable<ConfiguracionUsuario> {
    return this.http.put<ConfiguracionUsuario>(`${this.apiUrl}/perfil/configuracion`, config, {
      headers: this.getHeaders()
    });
  }

  // === ESTADÍSTICAS Y LOGROS === //
  obtenerLogros(): Observable<Logro[]> {
    return this.http.get<{success: boolean; data: Logro[]}>(`${this.apiUrl}/logros`, {
      headers: this.getHeaders()
    }).pipe(map(response => response.data));
  }

  verificarLogros(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logros/verificar`, {}, {
      headers: this.getHeaders()
    });
  }

  obtenerCertificados(): Observable<CertificadoUsuario[]> {
    return this.http.get<{success: boolean; data: any[]}>(`${this.apiUrl}/certificados`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        // Mapear los nombres de campos correctamente
        return response.data.map(cert => ({
          id: cert.id,
          titulo: cert.titulo,
          descripcion: cert.descripcion,
          modulo: cert.modulo,
          fechaEmision: cert.fecha_emision,
          urlCertificado: cert.url_certificado,
          codigoVerificacion: cert.codigo_verificacion,
          verificado: cert.verificado
        }));
      })
    );
  }

  verificarElegibilidadCertificado(): Observable<any> {
    return this.http.get(`${this.apiUrl}/certificados/elegibilidad`, {
      headers: this.getHeaders()
    });
  }

  generarCertificado(): Observable<any> {
    return this.http.post(`${this.apiUrl}/certificados/generar`, {}, {
      headers: this.getHeaders()
    });
  }

  obtenerEstadisticasDetalladas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/perfil/estadisticas`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtener historial de actividad con filtros
   */
  obtenerHistorialActividad(limite: number = 50, offset: number = 0, tipo?: string): Observable<any[]> {
    let url = `${this.apiUrl}/perfil/historial?limite=${limite}&offset=${offset}`;
    
    if (tipo) {
      url += `&tipo=${tipo}`;
    }

    return this.http.get<{success: boolean; data: any[]}>(url, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError((error: any) => {
        console.error('Error obteniendo historial:', error);
        return of([]);
      })
    );
  }

  /**
   * Refrescar y emitir historial de actividad (útil para que componentes se sincronicen)
   */
  refreshHistorial(limite: number = 50, offset: number = 0, tipo?: string): void {
    this.obtenerHistorialActividad(limite, offset, tipo).subscribe({
      next: (hist) => {
        try {
          this.historialSubject.next(hist || []);
        } catch (e) {
          console.warn('Error emitiendo historial:', e);
        }
      },
      error: (err) => {
        console.error('Error refrescando historial:', err);
        this.historialSubject.next([]);
      }
    });
  }

  // === CUENTA === //
  eliminarCuenta(confirmacion: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/perfil/eliminar`, {
      headers: this.getHeaders(),
      body: { confirmacion }
    });
  }

  cerrarSesion(): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/auth/logout`, {}, {
      headers: this.getHeaders()
    });
  }

  // === UTILIDADES === //
  actualizarUsuarioLocal(usuario: Usuario): void {
    this.usuarioActualSubject.next(usuario);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    
    // ✅ También actualizar en AuthService
    this.authService.actualizarUsuario(usuario);
  }

  obtenerUsuarioActual(): Usuario | null {
    return this.usuarioActualSubject.value;
  }

  limpiarDatos(): void {
    this.usuarioActualSubject.next(null);
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}