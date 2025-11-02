import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { retry, catchError, map } from 'rxjs/operators';
import { RankingGoGo } from '../models/actividad.model';

@Injectable({
  providedIn: 'root'
})
export class RankingGogoService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el ranking de GoGo con límite especificado
   */
  obtenerRanking(limite: number = 10): Observable<RankingGoGo[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ranking-gogo?limite=${limite}`)
      .pipe(
        retry(2),
        map(ranking => this.mapearRanking(ranking)),
        catchError(this.handleError('obtenerRanking', []))
      );
  }

  /**
   * Mapea el ranking del backend al formato del frontend
   */
  private mapearRanking(rankingBackend: any[]): RankingGoGo[] {
    return rankingBackend.map((item, index) => ({
      id: item.id,
      idUsuario: item.id_usuario,
      nombreUsuario: item.nombreUsuario,
      puntuacionMaxima: item.puntuacion_maxima || 0,
      nivel: item.nivel || 1,
      fechaRecord: new Date(item.fecha_record),
      posicion: index + 1
    }));
  }

  /**
   * Actualiza la puntuación de un usuario en el ranking
   * USANDO PATCH para actualizar o crear si no existe
   */
  /**
 * Actualiza la puntuación de un usuario en el ranking
 */
actualizarPuntuacion(
  idUsuario: number, 
  puntuacion: number, 
  nivel: number, 
  metadata?: any
): Observable<any> {
  const datos = {
    idUsuario,
    puntuacionMaxima: puntuacion,
    nivel,
    metadata
  };

  // ⚠️ CAMBIO: Mantener POST pero con la nueva lógica del backend
  return this.http.post(`${this.apiUrl}/ranking-gogo`, datos)
    .pipe(
      retry(1),
      catchError(this.handleError('actualizarPuntuacion'))
    );
}

  /**
   * Obtiene la posición de un usuario específico en el ranking
   */
  obtenerPosicionUsuario(idUsuario: number): Observable<number> {
    return this.obtenerRanking(100).pipe(
      map(ranking => {
        const posicion = ranking.findIndex(item => item.idUsuario === idUsuario);
        return posicion !== -1 ? posicion + 1 : 0;
      })
    );
  }

  /**
   * Obtiene el record personal de un usuario
   */
  obtenerRecordPersonal(idUsuario: number): Observable<RankingGoGo | null> {
    return this.obtenerRanking(100).pipe(
      map(ranking => ranking.find(item => item.idUsuario === idUsuario) || null)
    );
  }

  /**
   * Obtiene estadísticas del ranking general
   */
  obtenerEstadisticasRanking(): Observable<{
    totalJugadores: number;
    mejorPuntuacion: number;
    promedioNivel: number;
    ultimaActualizacion: Date;
  }> {
    return this.obtenerRanking(100).pipe(
      map(ranking => {
        if (ranking.length === 0) {
          return {
            totalJugadores: 0,
            mejorPuntuacion: 0,
            promedioNivel: 0,
            ultimaActualizacion: new Date()
          };
        }

        const totalJugadores = ranking.length;
        const mejorPuntuacion = Math.max(...ranking.map(r => r.puntuacionMaxima));
        const promedioNivel = ranking.reduce((sum, r) => sum + r.nivel, 0) / totalJugadores;
        const ultimaActualizacion = new Date(Math.max(...ranking.map(r => r.fechaRecord.getTime())));

        return {
          totalJugadores,
          mejorPuntuacion,
          promedioNivel: Math.round(promedioNivel * 100) / 100,
          ultimaActualizacion
        };
      })
    );
  }

  /**
   * Verifica si una puntuación es un nuevo record para el usuario
   */
  esNuevoRecord(idUsuario: number, puntuacion: number): Observable<boolean> {
    return this.obtenerRecordPersonal(idUsuario).pipe(
      map(record => {
        if (!record) return true; // Si no hay record previo, cualquier puntuación es nueva
        return puntuacion > record.puntuacionMaxima;
      })
    );
  }

  /**
   * Manejo genérico de errores
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`RankingGogoService ${operation} failed:`, error);
      
      if (error.error instanceof ErrorEvent) {
        console.error('Error del cliente:', error.error.message);
      } else {
        console.error(
          `Backend returned code ${error.status}, ` +
          `body was: ${JSON.stringify(error.error)}`);
      }
      
      return of(result as T);
    };
  }
}