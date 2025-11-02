import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RankingGogoService } from '../../../services/ranking-gogo';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActividadesService } from '../../../services/actividades';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-juego-gogo',
  templateUrl: './juego-gogo.html',
  styleUrls: ['./juego-gogo.css'],
  imports: [CommonModule],
  standalone: true
})
export class JuegoGogoComponent implements OnInit, OnDestroy {
  @ViewChild('juegoFrame') juegoFrame!: ElementRef<HTMLIFrameElement>;

  juegoUrl: SafeResourceUrl;
  cargandoJuego = true;
  mostrarResultados = false;
  juegoActivo = true;
  
  // Datos del juego
  usuarioId: number;
  puntuacionActual = 0;
  puntuacionFinal = 0;
  nivel = 1;
  tiempoInicio: Date = new Date();
  tiempoTranscurrido = 0;
  segundosTranscurridos = 0;
  intervalTimer: any;
  modoJuego: 'normal' | 'ranked' = 'normal';
  //gotasAtrapadas = 0;

  calcularEficiencia(): number {
    return Math.min(100, this.puntuacionFinal / 10);
  }

  // ⚠️ AÑADIR este método para calcular gotas atrapadas
  calcularGotasAtrapadas(): number {
    return Math.floor(this.puntuacionFinal / 10);
  }

  // Flag para evitar múltiples actualizaciones
  private rankingActualizado = false;

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private actividadesService: ActividadesService,
    private rankingService: RankingGogoService,
    private authService: AuthService
  ) {
    this.usuarioId = this.authService.getUsuarioId();
    this.juegoUrl = this.sanitizer.bypassSecurityTrustResourceUrl('/assets/juego-gogo/index.html');
  }
  
   // ✅ AÑADE ESTAS PROPIEDADES COMPUTADAS
  get gotasAtrapadas(): number {
    return Math.floor(this.puntuacionFinal / 10);
  }
  get eficiencia(): number {
    return Math.min(100, this.puntuacionFinal / 10);
  }

  ngOnInit(): void {
    this.iniciarTemporizador();
    this.configurarComunicacionConJuego();
    this.enviarUserIdAlJuego();
  }

  ngOnDestroy(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }
  }

  private enviarUserIdAlJuego(): void {
    setTimeout(() => {
      if (this.juegoFrame?.nativeElement?.contentWindow) {
        this.juegoFrame.nativeElement.contentWindow.postMessage({
          type: 'user-id',
          userId: this.usuarioId
        }, '*');
      }
    }, 1000);
  }

  private iniciarTemporizador(): void {
    this.intervalTimer = setInterval(() => {
      const tiempoActual = new Date();
      const diferencia = tiempoActual.getTime() - this.tiempoInicio.getTime();
      this.tiempoTranscurrido = Math.floor(diferencia / 60000);
      this.segundosTranscurridos = Math.floor((diferencia % 60000) / 1000);
    }, 1000);
  }

  private configurarComunicacionConJuego(): void {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'gogo-score-update') {
        this.puntuacionActual = event.data.score || 0;
        this.nivel = event.data.level || 1;
      } else if (event.data.type === 'gogo-game-over') {
        this.completarJuego(event.data);
      } else if (event.data.type === 'gogo-finish') {
        this.finalizarActividad();
      }
    });
  }

  private completarJuego(data: any): void {
    if (this.rankingActualizado) {
      return;
    }

    this.puntuacionFinal = data.finalScore || this.puntuacionActual;
    this.nivel = data.level || this.nivel;
    this.modoJuego = data.mode || 'normal';
    //this.gotasAtrapadas = data.dropsCollected || Math.floor(this.puntuacionFinal / 10);
    
    this.rankingActualizado = true;
    
    // Actualizar ranking siempre que haya puntaje (en modo clasificatoria)
    this.rankingService.actualizarPuntuacion(this.usuarioId, this.puntuacionFinal, this.nivel)
      .subscribe({
        next: () => console.log('Ranking actualizado correctamente'),
        error: (error) => console.error('Error actualizando ranking:', error)
      });
    
    // ⚠️ OCULTAR JUEGO Y MOSTRAR RESULTADOS
    this.juegoActivo = false;
    this.mostrarResultados = true;
  }

  private guardarProgresoActividad(): void {
    const completada = this.modoJuego === 'normal' && this.puntuacionFinal >= 1000;
    const progreso = {
      id: 0,
      idUsuario: this.usuarioId,
      idActividad: 3,
      completada: completada,
      progreso: Math.min(100, Math.floor(this.puntuacionFinal / 10)),
      puntuacionMaxima: this.puntuacionFinal,
      intentos: 1,
      tiempoTotal: this.tiempoTranscurrido,
      ultimaActividad: new Date(),
      datosProgreso: {
        nivel: this.nivel,
        puntuacionFinal: this.puntuacionFinal,
        modo: this.modoJuego,
        gotasAtrapadas: this.gotasAtrapadas
      }
    };

    this.actividadesService.guardarProgreso(progreso).subscribe({
      next: () => console.log('Progreso guardado exitosamente'),
      error: (error) => console.error('Error al guardar progreso:', error)
    });
  }

  onJuegoCargado(): void {
    setTimeout(() => {
      this.cargandoJuego = false;
      this.enviarUserIdAlJuego();
    }, 1000);
  }

  volverAActividades(): void {
    this.router.navigate(['/actividades']);
  }

  cerrarResultados(): void {
    this.mostrarResultados = false;
  }

  reiniciarJuego(): void {
    if (this.juegoFrame) {
      this.juegoFrame.nativeElement.src = this.juegoFrame.nativeElement.src;
    }
    
    this.puntuacionActual = 0;
    this.puntuacionFinal = 0;
    this.nivel = 1;
    this.tiempoInicio = new Date();
    this.rankingActualizado = false;
    
    // ⚠️ MOSTRAR JUEGO DE NUEVO Y OCULTAR RESULTADOS
    this.juegoActivo = true;
    this.mostrarResultados = false;
  }

  finalizarActividad(): void {
    const progreso = {
      id: 0,
      idUsuario: this.usuarioId,
      idActividad: 3, // ID del juego GoGo
      completada: this.puntuacionFinal > 0,
      progreso: Math.min(100, Math.floor(this.puntuacionFinal / 10)),
      puntuacionMaxima: this.puntuacionFinal,
      intentos: 1,
      tiempoTotal: this.tiempoTranscurrido,
      ultimaActividad: new Date(),
      datosProgreso: {
        nivel: this.nivel,
        puntuacionFinal: this.puntuacionFinal
      }
    };

    this.actividadesService.guardarProgreso(progreso).subscribe({
      next: () => {
        console.log('Progreso guardado exitosamente');
        this.volverAActividades();
      },
      error: (error) => {
        console.error('Error al guardar progreso:', error);
        this.volverAActividades();
      }
    });
  }

}