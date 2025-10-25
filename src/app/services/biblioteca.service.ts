import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Recurso } from '../pages/biblioteca/biblioteca';
import { LogrosService } from './logros.service';

@Injectable({
  providedIn: 'root'
})
export class BibliotecaService {
  private baseUrl = 'http://localhost:3000/api/biblioteca';
  private uploadUrl = 'http://localhost:3000/api/upload';

  constructor(private http: HttpClient, private logrosService: LogrosService) {}

  // Obtener todos los recursos
  getRecursos(): Observable<Recurso[]> {
    return this.http.get<Recurso[]>(`${this.baseUrl}`);
  }

  // Obtener un recurso por ID
  getRecursoById(id: number): Observable<Recurso> {
    return this.http.get<Recurso>(`${this.baseUrl}/${id}`);
  }

  // Crear recurso
  createRecurso(recurso: Recurso): Observable<Recurso> {
    return this.http.post<Recurso>(`${this.baseUrl}`, recurso, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Actualizar recurso
  updateRecurso(id: number, recurso: Partial<Recurso>): Observable<Recurso> {
    return this.http.put<Recurso>(`${this.baseUrl}/${id}`, recurso);
  }

  // Eliminar recurso
  deleteRecurso(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  // Subir archivo de material
  subirArchivo(archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    
    return this.http.post(`${this.uploadUrl}/material`, formData);
  }

  // Subir thumbnail
  subirThumbnail(archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('thumbnail', archivo);
    
    return this.http.post(`${this.uploadUrl}/thumbnail`, formData);
  }

  // Descargar archivo
  descargarArchivo(filename: string): Observable<Blob> {
    return this.http.get(`${this.uploadUrl}/download/${filename}`, {
      responseType: 'blob'
    });
  }

  // Registrar lectura de recurso
  registrarLectura(idRecurso: number, idUsuario: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${idRecurso}/lectura`, { 
      id_usuario: idUsuario 
    }).pipe(
      tap((response: any) => {
        // ✅ NOTIFICAR LOGROS OBTENIDOS
        if (response.logrosNuevos && response.logrosNuevos.length > 0) {
          this.logrosService.mostrarLogrosObtenidos(response.logrosNuevos);
        }
      })
    );
  }

  // Verificar si ya se leyó un recurso
  verificarLectura(idRecurso: number, idUsuario: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${idRecurso}/verificar-lectura`, {
      params: { id_usuario: idUsuario.toString() }
    });
  }
}