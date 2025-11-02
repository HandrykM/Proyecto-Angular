import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ModulosService, Lectura, Modulo, ProgresoLectura } from '../../services/modulos.service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe'; //

@Component({
  selector: 'app-lectura-viewer',
  templateUrl: './lectura-viewer.html',
  styleUrls: ['./lectura-viewer.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, SafeHtmlPipe]
})
export class LecturaViewerComponent implements OnInit, OnDestroy {
  
  @ViewChild('contenedorLectura', { static: false }) contenedorLectura!: ElementRef;
  
  // Estados principales
  lecturaActual: Lectura | null = null;
  moduloActual: Modulo | null = null;
  
  // Progreso de scroll
  porcentajeLeido: number = 0;
  posicionScroll: number = 0;
  
  // Control de tiempo
  tiempoInicio: Date | null = null;
  tiempoTranscurrido: number = 0;
  
  // Notas
  notasLectura: string = '';  // Inicializando la variable como string vacío

  guardandoNotas: boolean = false;
  
  // UI States
  cargando: boolean = true;
  completandoLectura: boolean = false;
  mostrarBarraProgreso: boolean = false;
  
  // Subjects para debounce
  private scrollSubject = new Subject<number>();
  private tiempoSubject = new Subject<number>();
  
  // Subscripciones
  private subscriptions: Subscription[] = [];
  private intervalTiempo: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modulosService: ModulosService
  ) {}

  ngOnInit(): void {
    this.inicializarComponente();
    this.configurarDebounce();
    this.iniciarContadorTiempo();
  }

  ngOnDestroy(): void {
    this.guardarProgresoFinal();
    this.limpiarRecursos();
  }

  // ==================== INICIALIZACIÓN ====================

  private inicializarComponente(): void {
    const idLectura = this.route.snapshot.paramMap.get('idLectura');
    const idModulo = this.route.snapshot.paramMap.get('idModulo');

    if (!idLectura || !idModulo) {
      this.router.navigate(['/modulos']);
      return;
    }

    this.cargarDatos(parseInt(idLectura), parseInt(idModulo));
  }

  private cargarDatos(idLectura: number, idModulo: number): void {
    this.cargando = true;

    // Cargar lectura
    const lecturaSub = this.modulosService.obtenerLectura(idLectura).subscribe({
      next: (lectura) => {
        this.lecturaActual = lectura;
        this.cargarProgresoGuardado(idLectura);
        this.cargarNotas(idLectura);
      },
      error: (error) => {
        console.error('Error cargando lectura:', error);
        this.mostrarError('No se pudo cargar la lectura');
        this.cargando = false;
      }
    });

    // Cargar módulo
    const moduloSub = this.modulosService.obtenerModulo(idModulo).subscribe({
      next: (modulo) => {
        this.moduloActual = modulo;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando módulo:', error);
        this.cargando = false;
      }
    });

    this.subscriptions.push(lecturaSub, moduloSub);
  }

  private cargarProgresoGuardado(idLectura: number): void {
    const progresoSub = this.modulosService.obtenerProgresoLectura(idLectura).subscribe({
      next: (progreso) => {
        if (progreso) {
          this.porcentajeLeido = progreso.porcentaje_leido;
          this.posicionScroll = progreso.posicion_scroll;
          this.tiempoTranscurrido = progreso.tiempo_lectura;
          
          // Restaurar posición de scroll después de que el DOM esté listo
          setTimeout(() => {
            this.restaurarPosicionScroll();
          }, 500);
        }
      },
      error: (error) => {
        console.warn('No hay progreso previo guardado');
      }
    });

    this.subscriptions.push(progresoSub);
  }

  private cargarNotas(idLectura: number): void {
    const notasSub = this.modulosService.obtenerNotasLectura(idLectura).subscribe({
      next: (notas) => {
        this.notasLectura = notas || '';
      },
      error: (error) => {
        console.warn('Error cargando notas:', error);
      }
    });

    this.subscriptions.push(notasSub);
  }

  // ==================== SCROLL TRACKING ====================

  @HostListener('window:scroll', ['$event'])
  onScroll(event: any): void {
    if (!this.lecturaActual) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    
    if (scrollHeight > 0) {
      const porcentaje = Math.round((scrollTop / scrollHeight) * 100);
      this.porcentajeLeido = Math.min(porcentaje, 100);
      this.posicionScroll = scrollTop;
      
      // Mostrar barra de progreso
      this.mostrarBarraProgreso = scrollTop > 100;
      
      // Emitir para guardar con debounce
      this.scrollSubject.next(this.porcentajeLeido);
    }
  }

  private configurarDebounce(): void {
    // Guardar progreso cada 3 segundos de inactividad en el scroll
    const scrollSub = this.scrollSubject.pipe(
      debounceTime(3000),
      distinctUntilChanged()
    ).subscribe(() => {
      this.guardarProgreso();
    });

    // Guardar tiempo cada minuto
    const tiempoSub = this.tiempoSubject.pipe(
      debounceTime(60000)
    ).subscribe(() => {
      this.guardarTiempo();
    });

    this.subscriptions.push(scrollSub, tiempoSub);
  }

  private restaurarPosicionScroll(): void {
    if (this.posicionScroll > 0) {
      window.scrollTo({
        top: this.posicionScroll,
        behavior: 'smooth'
      });
      
      this.mostrarNotificacion('Continuando donde lo dejaste...', 'info');
    }
  }

  // ==================== GUARDADO DE PROGRESO ====================

  private guardarProgreso(): void {
    if (!this.lecturaActual) return;

    const progresoData: ProgresoLectura = {
      id_lectura: this.lecturaActual.id,
      porcentaje_leido: this.porcentajeLeido,
      posicion_scroll: this.posicionScroll,
      tiempo_lectura: this.tiempoTranscurrido,
      completado: this.lecturaActual.completado || false
    };

    this.modulosService.guardarProgresoLectura(progresoData).subscribe({
      next: () => {
        console.log('Progreso guardado:', this.porcentajeLeido + '%');
      },
      error: (error) => {
        console.warn('Error guardando progreso:', error);
      }
    });
  }

  private guardarProgresoFinal(): void {
    if (!this.lecturaActual) return;

    // Guardar una última vez antes de salir
    this.guardarProgreso();
    this.guardarTiempo();
  }

  // ==================== TIEMPO DE LECTURA ====================

  private iniciarContadorTiempo(): void {
    this.tiempoInicio = new Date();
    
    // Actualizar cada minuto
    this.intervalTiempo = interval(60000).subscribe(() => {
      this.tiempoTranscurrido++;
      this.tiempoSubject.next(this.tiempoTranscurrido);
    });
  }

  private guardarTiempo(): void {
    if (!this.lecturaActual || this.tiempoTranscurrido < 1) return;

    this.modulosService.registrarTiempoEstudio(
      this.lecturaActual.id,
      this.tiempoTranscurrido
    ).subscribe({
      next: () => {
        console.log('Tiempo registrado:', this.tiempoTranscurrido, 'minutos');
      },
      error: (error) => {
        console.warn('Error registrando tiempo:', error);
      }
    });
  }

  obtenerTiempoFormateado(): string {
    if (this.tiempoTranscurrido < 1) return 'Menos de 1 min';
    if (this.tiempoTranscurrido >= 60) {
      const horas = Math.floor(this.tiempoTranscurrido / 60);
      const mins = this.tiempoTranscurrido % 60;
      return `${horas}h ${mins}min`;
    }
    return `${this.tiempoTranscurrido} min`;
  }

  // ==================== COMPLETAR LECTURA ====================

  marcarComoCompletada(): void {
    if (!this.lecturaActual || !this.moduloActual || this.completandoLectura) {
      return;
    }

    if (this.lecturaActual.completado) {
      this.mostrarNotificacion('Esta lectura ya está completada', 'info');
      return;
    }

    this.completandoLectura = true;

    // Guardar progreso y tiempo antes de completar
    this.guardarProgresoFinal();

    const sub = this.modulosService.marcarLecturaCompletada(
      this.lecturaActual.id,
      this.moduloActual.id
    ).subscribe({
      next: (response) => {
        this.lecturaActual!.completado = true;
        this.mostrarNotificacion('¡Lectura completada! +' + this.lecturaActual!.puntos + ' puntos', 'success');
        
        if (response.modulo_completado) {
          this.mostrarNotificacion('¡Felicidades! Completaste el módulo: ' + this.moduloActual!.titulo, 'success');
        }
        
        this.completandoLectura = false;
      },
      error: (error) => {
        console.error('Error completando lectura:', error);
        this.mostrarError('Error al completar la lectura');
        this.completandoLectura = false;
      }
    });

    this.subscriptions.push(sub);
  }

  // ==================== NOTAS ====================

  guardarNotas(): void {
    if (!this.lecturaActual || this.guardandoNotas) return;

    this.guardandoNotas = true;

    const sub = this.modulosService.guardarNotasLectura(
      this.lecturaActual.id,
      this.notasLectura
    ).subscribe({
      next: () => {
        this.mostrarNotificacion('Notas guardadas correctamente', 'success');
        this.guardandoNotas = false;
      },
      error: (error) => {
        console.error('Error guardando notas:', error);
        this.mostrarError('Error al guardar las notas');
        this.guardandoNotas = false;
      }
    });

    this.subscriptions.push(sub);
  }

  onNotasChange(event: any): void {
  this.notasLectura = event.target?.value || ''; // Aseguramos que notasLectura nunca sea undefined
}


  // ==================== NAVEGACIÓN ====================

  cerrarLectura(): void {
    this.guardarProgresoFinal();
    this.router.navigate(['/modulos', this.moduloActual?.id]);
  }

  // ==================== UTILIDADES ====================

  private limpiarRecursos(): void {
    this.subscriptions.forEach(sub => {
      if (sub && !sub.closed) {
        sub.unsubscribe();
      }
    });
    
    if (this.intervalTiempo) {
      this.intervalTiempo.unsubscribe();
    }
  }

  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'info' | 'warning' | 'error'): void {
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
    // Aquí puedes implementar un sistema de notificaciones toast
  }

  private mostrarError(mensaje: string): void {
    this.mostrarNotificacion(mensaje, 'error');
  }
}