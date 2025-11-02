// src/app/services/tienda.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface Producto {
  id: number;
  categoria_id: number;
  tipo: 'titulo' | 'rango' | 'documento' | 'video' | 'curso' | 'recurso' | 'avatar' | 'tema';
  nombre: string;
  descripcion: string;
  precio_puntos: number;
  stock: number | null;
  imagen_url: string;
  archivo_url: string;
  datos_extra: any;
  nivel_requerido: string;
  puntos_minimos: number;
  destacado: boolean;
  categoria_nombre: string;
  categoria_icono: string;
  categoria_color: string;
  ya_comprado: boolean;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  total_productos: number;
}

export interface Puntos {
  ganados: number;
  gastados: number;
  disponible: number;
}

@Injectable({
  providedIn: 'root'
})
export class TiendaService {
  private apiUrl = `${environment.apiUrl}/tienda`;
  
  private puntosSubject = new BehaviorSubject<Puntos | null>(null);
  public puntos$ = this.puntosSubject.asObservable();
  
  constructor(private http: HttpClient) {
    this.cargarPuntos();
  }
  
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  
  // ===== PRODUCTOS =====
  
  obtenerProductos(filters?: { categoria?: number; tipo?: string; destacado?: boolean }): Observable<any> {
    let params: any = {};
    if (filters?.categoria) params.categoria = filters.categoria;
    if (filters?.tipo) params.tipo = filters.tipo;
    if (filters?.destacado) params.destacado = 'true';
    
    return this.http.get(`${this.apiUrl}/productos`, {
      headers: this.getHeaders(),
      params
    });
  }
  
  // ===== CATEGORÍAS =====
  
  obtenerCategorias(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categorias`, {
      headers: this.getHeaders()
    });
  }
  
  // ===== PUNTOS =====
  
  cargarPuntos(): void {
    this.http.get<{ success: boolean; puntos: Puntos }>(`${this.apiUrl}/puntos`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        this.puntosSubject.next(response.puntos);
      },
      error: (error) => console.error('Error cargando puntos:', error)
    });
  }
  
  obtenerPuntos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/puntos`, {
      headers: this.getHeaders()
    }).pipe(
      tap((response: any) => {
        if (response.success) {
          this.puntosSubject.next(response.puntos);
        }
      })
    );
  }
  
  // ===== COMPRAS =====
  
  realizarCompra(productoId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/comprar`, 
      { productoId },
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.cargarPuntos()) // Actualizar puntos después de comprar
    );
  }
  
  obtenerMisCompras(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mis-compras`, {
      headers: this.getHeaders()
    });
  }
  
  // ===== DESBLOQUEO =====
  
  verificarDesbloqueo(tipo: string, contenidoId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/verificar-desbloqueo`, {
      headers: this.getHeaders(),
      params: { tipo, contenidoId: contenidoId.toString() }
    });
  }
}