// src/app/services/logros.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Logro {
  id: number;
  titulo: string;
  descripcion: string;
  icono: string;
  condicionTipo: string;
  condicionValor: number;
  puntosRecompensa: number;
  obtenido: boolean;
  fechaObtenido?: string;
}

export interface LogroNuevo {
  id: number;
  titulo: string;
  descripcion: string;
  icono: string;
  puntosRecompensa: number;
}

@Injectable({
  providedIn: 'root'
})
export class LogrosService {
  private apiUrl = 'http://localhost:3000/api';
  private logrosObtenidosSubject = new Subject<LogroNuevo[]>();
  public logrosObtenidos$ = this.logrosObtenidosSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  obtenerLogrosUsuario(): Observable<{ success: boolean; data: Logro[] }> {
    return this.http.get<{ success: boolean; data: Logro[] }>(`${this.apiUrl}/logros`, {
      headers: this.getHeaders()
    });
  }

  verificarLogros(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logros/verificar`, {}, {
      headers: this.getHeaders()
    }).pipe(
      tap((response: any) => {
        if (response.logrosNuevos && response.logrosNuevos.length > 0) {
          this.mostrarLogrosObtenidos(response.logrosNuevos);
        }
      })
    );
  }

  verificarLogrosDespuesDeAccion(): void {
    this.verificarLogros().subscribe({
      error: (error) => console.error('Error al verificar logros:', error)
    });
  }

  // ✅ MÉTODO PÚBLICO PARA MOSTRAR LOGROS DESDE OTROS SERVICIOS
  mostrarLogrosObtenidos(logros: LogroNuevo[]): void {
    if (logros && logros.length > 0) {
      this.logrosObtenidosSubject.next(logros);
      console.log(`🏆 ${logros.length} nuevo(s) logro(s) obtenido(s)`);
    }
  }

  private mostrarToast(logro: LogroNuevo): void {
    // Este método ya no es necesario, el componente maneja la UI
  }

  private reproducirSonidoLogro(): void {
    try {
      const audio = new Audio('assets/sounds/achievement.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (error) {}
  }
}