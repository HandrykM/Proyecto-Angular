import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActividadesService } from '../../../services/actividades';
import { AuthService } from '../../../services/auth';
import { ProgresoActividad } from '../../../models/actividad.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-juego-reutilizable',
  templateUrl: './juego-reutilizable.component.html',
  styleUrls: ['./juego-reutilizable.component.css'],
  imports: [CommonModule],
  standalone: true
})
export class JuegoReutilizableComponent implements OnInit, OnDestroy {
  @ViewChild('gameFrame') gameFrame!: ElementRef<HTMLIFrameElement>;

  gameUrl!: SafeResourceUrl;
  cargandoJuego = true;
  showResults = false;
  mostrarStats = true;
  usuarioId: number;
  nivelActual: 'basico' | 'intermedio' | 'avanzado' = 'basico';

  // Datos del juego
  respuestasCorrectas = 0;
  totalTarjetas = 0;
  precision = 0;
  puntuacionFinal = 0;
  tiempoTranscurrido = 0;
  segundosTranscurridos = 0;
  medallaObtenida: 'oro' | 'plata' | 'bronce' = 'bronce';

  tiempoInicio: Date = new Date();
  intervalTimer: any;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private actividadesService: ActividadesService,
    private authService: AuthService
  ) {
    this.usuarioId = this.authService.getUsuarioId();
    this.construirUrlJuego();
  }

  ngOnInit(): void {
    this.iniciarTemporizador();
    this.configurarComunicacionConJuego();
  }

  ngOnDestroy(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private construirUrlJuego(): void {
    const params = new URLSearchParams({
      nivel: this.nivelActual,
      usuario: this.usuarioId.toString()
    });
    this.gameUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `/assets/reutilizable-o-no/index.html?${params.toString()}`
    );
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
      if (event.origin !== window.location.origin) return;

      switch (event.data.type) {
        case 'juego-update':
          this.procesarActualizacionJuego(event.data);
          break;
        case 'juego-completed':
          this.completarJuego(event.data);
          break;
        case 'juego-stats':
          this.actualizarEstadisticas(event.data);
          break;
      }
    });
  }

  private procesarActualizacionJuego(data: any): void {
    this.respuestasCorrectas = data.correctas || 0;
    this.totalTarjetas = data.total || 0;
    this.puntuacionFinal = data.puntuacion || 0;
    
    if (this.totalTarjetas > 0) {
      this.precision = Math.round((this.respuestasCorrectas / this.totalTarjetas) * 100);
    }
  }

  private actualizarEstadisticas(data: any): void {
    this.procesarActualizacionJuego(data);
  }

  private completarJuego(data: any): void {
    this.respuestasCorrectas = data.correctas || this.respuestasCorrectas;
    this.totalTarjetas = data.total || this.totalTarjetas;
    this.precision = data.precision || this.precision;
    this.puntuacionFinal = data.puntuacion || this.puntuacionFinal;
    
    this.determinarMedalla();
    this.showResults = true;
    this.guardarProgreso();
  }

  private determinarMedalla(): void {
    if (this.precision >= 85) {
      this.medallaObtenida = 'oro';
    } else if (this.precision >= 70) {
      this.medallaObtenida = 'plata';
    } else {
      this.medallaObtenida = 'bronce';
    }
  }

  onJuegoCargado(): void {
    setTimeout(() => {
      this.cargandoJuego = false;
    }, 1000);
  }

  toggleStats(): void {
    this.mostrarStats = !this.mostrarStats;
  }

  cambiarNivel(nuevoNivel: 'basico' | 'intermedio' | 'avanzado'): void {
    this.nivelActual = nuevoNivel;
    this.construirUrlJuego();
    this.reiniciarDatos();
    if (this.gameFrame) {
      this.gameFrame.nativeElement.src = this.gameFrame.nativeElement.src;
    }
  }

  private reiniciarDatos(): void {
    this.respuestasCorrectas = 0;
    this.totalTarjetas = 0;
    this.precision = 0;
    this.puntuacionFinal = 0;
    this.tiempoInicio = new Date();
    this.showResults = false;
  }

  reiniciarJuego(): void {
    this.reiniciarDatos();
    if (this.gameFrame) {
      this.gameFrame.nativeElement.src = this.gameFrame.nativeElement.src;
    }
  }

  volverAActividades(): void {
    this.router.navigate(['/actividades']);
  }

  private guardarProgreso(): void {
  const progreso: ProgresoActividad = {
    id: 0, // Agregar esta propiedad
    idUsuario: this.usuarioId,
    idActividad: 7, // ID asignado a esta actividad en la DB
    completada: true,
    progreso: 100,
    puntuacionMaxima: this.puntuacionFinal,
    intentos: 1,
    tiempoTotal: this.tiempoTranscurrido,
    ultimaActividad: new Date(), // Agregar esta propiedad
    datosProgreso: {
      nivel: this.nivelActual,
      precision: this.precision,
      medallaObtenida: this.medallaObtenida,
      respuestasCorrectas: this.respuestasCorrectas,
      totalTarjetas: this.totalTarjetas
    }
  };

  this.actividadesService.guardarProgreso(progreso)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => console.log('Progreso guardado'),
      error: (error) => console.error('Error al guardar:', error)
    });
}
}