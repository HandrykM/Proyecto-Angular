// src/app/services/admin.service.ts (CORREGIDO)
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ===== MÓDULOS MEJORADOS =====
  
  obtenerModulos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/modulos`);
  }

  /**
   * Obtener módulo completo con lecturas y materiales
   */
  obtenerModuloCompleto(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/modulos/${id}/completo`);
  }

  /**
   * Crear módulo con lecturas y materiales
   * @param datos Debe incluir: titulo, descripcion, nivel, orden, lecturas[], materiales[]
   
  crearModuloMejorado(datos: any): Observable<any> {
    console.log('📤 Enviando módulo:', datos);
    return this.http.post(`${this.apiUrl}/modulos`, datos);
  }*/

  /**
   * Actualizar módulo completo
   
  actualizarModuloMejorado(id: number, datos: any): Observable<any> {
    console.log('📤 Actualizando módulo:', id, datos);
    return this.http.put(`${this.apiUrl}/modulos/${id}`, datos);
  }*/
 crearModulo(datos: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/modulos`, datos);
}

actualizarModulo(id: number, datos: any): Observable<any> {
  return this.http.put(`${this.apiUrl}/modulos/${id}`, datos);
}

  /**
   * Eliminar módulo COMPLETAMENTE (no solo inactivar)
   */
  eliminarModulo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/modulos/${id}`);
  }

  /**
   * Toggle activo/inactivo
   */
  toggleActivoModulo(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/modulos/${id}/toggle-activo`, {});
  }

  // ===== USUARIOS =====
  
  obtenerUsuarios(busqueda?: string, rol?: string, orden?: string, limite?: number, offset?: number): Observable<any> {
    let params: any = {};
    if (busqueda) params.busqueda = busqueda;
    if (rol) params.rol = rol;
    if (orden) params.orden = orden;
    if (limite) params.limite = limite.toString();
    if (offset) params.offset = offset.toString();
    
    return this.http.get(`${this.apiUrl}/usuarios`, { params });
  }

  obtenerUsuarioDetalle(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuarios/${id}`);
  }

  crearUsuario(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios`, datos);
  }

  actualizarUsuario(id: number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}`, datos);
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`);
  }

  resetearPassword(id: number, nuevaContrasena: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/${id}/reset-password`, { 
      nuevaContrasena 
    });
  }

  cambiarRol(id: number, rol: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}/cambiar-rol`, { rol });
  }

  resetearProgresoModulos(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/${id}/reset-progreso-modulos`, {});
  }

  resetearProgresoActividades(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/${id}/reset-progreso-actividades`, {});
  }

  resetearPuntos(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/${id}/reset-puntos`, {});
  }

  // ===== ACTIVIDADES =====
  
  obtenerActividades(): Observable<any> {
    return this.http.get(`${this.apiUrl}/actividades`);
  }

  crearActividad(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/actividades`, datos);
  }

  actualizarActividad(id: number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/actividades/${id}`, datos);
  }

  eliminarActividad(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/actividades/${id}`);
  }

  toggleActivoActividad(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/actividades/${id}/toggle-activo`, {});
  }

  // ===== BIBLIOTECA =====
  
  obtenerRecursosBiblioteca(): Observable<any> {
    return this.http.get(`${this.apiUrl}/biblioteca`);
  }

  crearRecursoBiblioteca(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/biblioteca`, datos);
  }

  actualizarRecursoBiblioteca(id: number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/biblioteca/${id}`, datos);
  }

  eliminarRecursoBiblioteca(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/biblioteca/${id}`);
  }

  // ===== ESTADÍSTICAS =====
  
  obtenerEstadisticasGenerales(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estadisticas/general`);
  }

  obtenerEstadisticasUsuarios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estadisticas/usuarios`);
  }

  obtenerEstadisticasActividades(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estadisticas/actividades`);
  }

  // ===== SUBIR ARCHIVOS =====
  
  subirArchivo(formData: FormData): Observable<any> {
  const token = this.authService.getToken();
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.post(`${environment.apiUrl}/upload/material`, formData, {
    headers: headers
  });
}
}