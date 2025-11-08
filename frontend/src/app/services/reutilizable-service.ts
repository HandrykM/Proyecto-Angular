import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';

interface TarjetaAgua {
  id: number;
  nombre: string;
  descripcion: string;
  icono: string;
  nivel: 'basico' | 'intermedio' | 'avanzado';
  categoriaCorrecta: 'reutilizable' | 'tratamiento' | 'no-reutilizable';
  explicacion: string;
}

interface ResultadoJuegoReutilizable {
  correctas: number;
  total: number;
  precision: number;
  puntuacion: number;
  tiempoTotal: number;
  nivel: 'basico' | 'intermedio' | 'avanzado';
}

@Injectable({
  providedIn: 'root'
})
export class ReutilizableService {
  private apiUrl = environment.apiUrl; // ✅ Usa environment
  private resultadosSubject = new BehaviorSubject<ResultadoJuegoReutilizable | null>(null);
  public resultados$ = this.resultadosSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
 * Obtiene todas las tarjetas de agua según el nivel
 */
obtenerTarjetas(nivel: 'basico' | 'intermedio' | 'avanzado'): Observable<TarjetaAgua[]> {
  return this.http.get<TarjetaAgua[]>(`${this.apiUrl}/reutilizable/tarjetas`)
    .pipe(
      map(tarjetas => {
        const nivelMap: { [key: string]: number } = {
          'basico': 1,
          'intermedio': 2,
          'avanzado': 3
        };
        const nivelRequerido = nivelMap[nivel] || 1;
        
        return tarjetas.filter(t => {
          const nivelTarjeta = nivelMap[(t.nivel || 'basico')] || 1;
          return nivelTarjeta <= nivelRequerido;
        });
      })
    );
}

  /**
 * Verifica si una tarjeta aplica para el nivel
 */
private verificarNivel(tarjeta: any, nivel: string): boolean {
  const nivelMap: { [key: string]: number } = {
    'basico': 1,
    'intermedio': 2,
    'avanzado': 3
  };
  const tarjetaNivel = (tarjeta.nivel as string) || 'basico';
  return nivelMap[tarjetaNivel] <= (nivelMap[nivel] || 1);
}

  /**
   * Guarda el resultado del juego
   */
  guardarResultado(idUsuario: number, resultado: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reutilizable/resultado`, {
      idUsuario,
      ...resultado
    });
  }

  /**
   * Obtiene el historial de resultados del usuario
   */
  obtenerHistorial(idUsuario: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reutilizable/historial/${idUsuario}`);
  }

  /**
   * Obtiene estadísticas del usuario en este juego
   */
  obtenerEstadisticas(idUsuario: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/reutilizable/estadisticas/${idUsuario}`);
  }

  /**
   * Actualiza los resultados localmente
   */
  actualizarResultados(resultado: ResultadoJuegoReutilizable): void {
    this.resultadosSubject.next(resultado);
  }
}