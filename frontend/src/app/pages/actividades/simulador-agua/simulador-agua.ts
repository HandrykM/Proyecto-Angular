import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActividadesService } from '../../../services/actividades';
import { AuthService } from '../../../services/auth';

interface Logro {
  nombre: string;
  icono: string;
  obtenido: boolean;
}

@Component({
  selector: 'app-simulador-agua',
  templateUrl: './simulador-agua.html',
  styleUrls: ['./simulador-agua.css'],
  imports: [CommonModule],
  standalone: true
})
export class SimuladorAguaComponent implements OnInit, OnDestroy {
  @ViewChild('simuladorFrame') simuladorFrame!: ElementRef<HTMLIFrameElement>;

  simuladorUrl: SafeResourceUrl;
  cargandoSimulador = true;
  mostrarInstrucciones = true;
  mostrarResultados = false;

  tiempoInicio: Date = new Date();
  tiempoTranscurrido = 0;
  segundosTranscurridos = 0;
  intervalTimer: any;
  usuarioId: number;

  puntuacionActual = 0;
  puntuacionFinal = 0;
  eficienciaAlcanzada = 0;
  ahoroDiario = 0;
  decisionesTomadas = 0;
  logrosObtenidos: Logro[] = [];

  private logrosDisponibles: Logro[] = [
    { nombre: 'Eficiencia Máxima', icono: 'fas fa-medal', obtenido: false },
    { nombre: 'Ahorro Experto', icono: 'fas fa-trophy', obtenido: false },
    { nombre: 'Gestor Responsable', icono: 'fas fa-leaf', obtenido: false }
  ];

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private actividadesService: ActividadesService,
    private authService: AuthService
  ) {
    this.usuarioId = this.authService.getUsuarioId();
    this.simuladorUrl = this.sanitizer.bypassSecurityTrustResourceUrl('/assets/simulador/index.html');
  }

  ngOnInit(): void {
    this.iniciarTemporizador();
    this.configurarComunicacionConSimulador();
  }

  ngOnDestroy(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }
  }

  private iniciarTemporizador(): void {
    this.intervalTimer = setInterval(() => {
      const tiempoActual = new Date();
      const diferencia = tiempoActual.getTime() - this.tiempoInicio.getTime();
      this.tiempoTranscurrido = Math.floor(diferencia / 60000);
      this.segundosTranscurridos = Math.floor((diferencia % 60000) / 1000);
    }, 1000);
  }

  private configurarComunicacionConSimulador(): void {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'simulador-update') {
        this.procesarActualizacionSimulador(event.data);
      } else if (event.data.type === 'simulador-completed') {
        this.completarSimulacion(event.data);
      }
    });
  }

  private procesarActualizacionSimulador(data: any): void {
    this.puntuacionActual = data.puntuacion || 0;
    this.eficienciaAlcanzada = data.eficiencia || 0;
    this.ahoroDiario = data.ahorro || 0;
    this.decisionesTomadas = data.decisiones || 0;
  }

  private completarSimulacion(data: any): void {
    this.puntuacionFinal = data.puntuacionFinal || this.puntuacionActual;
    this.eficienciaAlcanzada = data.eficienciaFinal || this.eficienciaAlcanzada;
    this.ahoroDiario = data.ahorroFinal || this.ahoroDiario;
    
    this.evaluarLogros();
    this.mostrarResultados = true;
  }

  private evaluarLogros(): void {
    this.logrosObtenidos = [];

    if (this.eficienciaAlcanzada >= 80) {
      const logro = this.logrosDisponibles.find(l => l.nombre === 'Eficiencia Máxima');
      if (logro) {
        logro.obtenido = true;
        this.logrosObtenidos.push(logro);
      }
    }

    if (this.ahoroDiario >= 50) {
      const logro = this.logrosDisponibles.find(l => l.nombre === 'Ahorro Experto');
      if (logro) {
        logro.obtenido = true;
        this.logrosObtenidos.push(logro);
      }
    }

    if (this.decisionesTomadas <= 15 && this.eficienciaAlcanzada >= 70) {
      const logro = this.logrosDisponibles.find(l => l.nombre === 'Gestor Responsable');
      if (logro) {
        logro.obtenido = true;
        this.logrosObtenidos.push(logro);
      }
    }

    this.puntuacionFinal += this.logrosObtenidos.length * 10;
  }

  onSimuladorCargado(): void {
    setTimeout(() => {
      this.cargandoSimulador = false;
    }, 1000);
  }

  toggleInstrucciones(): void {
    this.mostrarInstrucciones = !this.mostrarInstrucciones;
  }

  volverAActividades(): void {
    this.router.navigate(['/actividades']);
  }

  cerrarResultados(): void {
    this.mostrarResultados = false;
  }

  reiniciarSimulador(): void {
    if (this.simuladorFrame) {
      this.simuladorFrame.nativeElement.src = this.simuladorFrame.nativeElement.src;
    }
    
    this.puntuacionActual = 0;
    this.puntuacionFinal = 0;
    this.eficienciaAlcanzada = 0;
    this.ahoroDiario = 0;
    this.decisionesTomadas = 0;
    this.logrosObtenidos = [];
    this.tiempoInicio = new Date();
    
    this.cerrarResultados();
  }

  finalizarActividad(): void {
    const progreso = {
      id: 0,
      idUsuario: this.usuarioId,
      idActividad: 1,
      completada: true,
      progreso: 100,
      puntuacionMaxima: this.puntuacionFinal,
      intentos: 1,
      tiempoTotal: this.tiempoTranscurrido,
      ultimaActividad: new Date(),
      datosProgreso: {
        eficienciaAlcanzada: this.eficienciaAlcanzada,
        ahoroDiario: this.ahoroDiario,
        decisionesTomadas: this.decisionesTomadas,
        logrosObtenidos: this.logrosObtenidos.map(l => l.nombre)
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