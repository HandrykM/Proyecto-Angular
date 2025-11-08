import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { takeWhile } from 'rxjs/operators';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { environment } from '../../environments/environment';

import { 
  ModulosService, 
  Modulo, 
  Lectura, 
  MaterialAdicional,
  ProgresoResponse,
  EstadisticasProgreso 
} from '../../services/modulos.service';
import { AuthService } from '../../services/auth';

interface NotificacionTipo {
  mensaje: string;
  tipo: 'success' | 'info' | 'warning' | 'error';
  duracion?: number;
}

@Component({
  selector: 'app-modulos',
  templateUrl: './modulos.html',
  styleUrls: ['./modulos.css'],
  imports: [CommonModule, RouterModule, FormsModule, ],
  standalone: true
})
export class Modulos implements OnInit, OnDestroy {
  
  // Estados principales
  fotoUsuario: string;
  modulos: Modulo[] = [];
  moduloSeleccionado: Modulo | null = null;
  lecturaActual: Lectura | null = null;
  mostrandoLectura: boolean = false;
  
  // Estados de UI
  cargando: boolean = true;
  error: string | null = null;
  notasLectura: string = '';
  guardandoNotas: boolean = false;
  completandoLectura: boolean = false;
  usuario: { foto?: string; nombre?: string; rol?: string } | null = null;
  
  
  // Progreso y estadísticas
  progresoTotal: number = 0;
  estadisticasProgreso: EstadisticasProgreso | null = null;
  
  // Tiempo de lectura
  private tiempoInicioLectura: Date | null = null;
  private tiempoLecturaInterval: Subscription | null = null;
  private tiempoTranscurrido: number = 0; // en minutos
  
  // Subscripciones
  private subscriptions: Subscription[] = [];
  
  // Debug controls (solo desarrollo)
  showDebugControls: boolean = false; // Cambiar a true para testing

  constructor(
    private router: Router,
    private modulosService: ModulosService,
    private authService: AuthService
  ) {
    // Verificar si estamos en modo debug
    this.showDebugControls = !this.esProduccion();
    const foto = this.authService.getFotoUsuario();
this.fotoUsuario = foto !== null ? foto : '';
  }

  ngOnInit(): void {
  // 🔹 Lógica existente
  this.verificarAutenticacion();
  this.inicializarComponente();

  this.authService.usuario$.subscribe(usuario => {
    this.usuario = usuario;
  });

  // ✅ Configurar menú hamburguesa responsive (desde la derecha)
  setTimeout(() => {
    const toggle = document.getElementById('navToggle');
    const menu = document.querySelector('.nav-menu');

    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        menu.classList.toggle('active');
        toggle.classList.toggle('open');
      });
    }
  }, 0);
}


  ngOnDestroy(): void {
    this.limpiarRecursos();
  }

  calcularStrokeDashoffset(): number {
  if (!this.moduloSeleccionado || !this.moduloSeleccionado.progreso) {
    return 220; // Círculo vacío si no hay progreso
  }
  
  const progreso = Math.round(this.moduloSeleccionado.progreso);
  return 220 - (220 * progreso) / 100;
}

// Añadir después de calcularStrokeDashoffset()

/**
 * Obtiene el número de lecturas del módulo seleccionado
 */
obtenerNumeroLecturas(): number {
  return this.moduloSeleccionado?.lecturas?.length || 0;
}

/**
 * Obtiene el número de materiales del módulo seleccionado
 */
obtenerNumeroMateriales(): number {
  return this.moduloSeleccionado?.materialesAdicionales?.length || 0;
}

/**
 * Obtiene las lecturas del módulo seleccionado de forma segura
 */
obtenerLecturasSeguras(): Lectura[] {
  return this.moduloSeleccionado?.lecturas || [];
}

/**
 * Obtiene los materiales del módulo seleccionado de forma segura
 */
obtenerMaterialesSeguras(): MaterialAdicional[] {
  return this.moduloSeleccionado?.materialesAdicionales || [];
}

  // === INICIALIZACIÓN === //

  private verificarAutenticacion(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
  }

  private inicializarComponente(): void {
    this.suscribirEstados();
    this.cargarDatos();
  }

  private suscribirEstados(): void {
    // Suscribirse a cambios en módulos
    const modulosSub = this.modulosService.modulos$.subscribe(modulos => {
      this.modulos = modulos;
      this.actualizarProgresoTotal();
    });

    // Suscribirse a estado de carga
    const cargandoSub = this.modulosService.cargando$.subscribe(cargando => {
      this.cargando = cargando;
    });

    // Suscribirse a errores
    const errorSub = this.modulosService.error$.subscribe(error => {
      if (error) {
        this.mostrarError(error);
      }
    });

    this.subscriptions.push(modulosSub, cargandoSub, errorSub);
  }
  

  private cargarDatos(): void {
    this.error = null;

    // Cargar módulos con progreso
    const modulosPromise = this.modulosService.cargarModulosConProgreso().subscribe({
      next: (modulos) => {
        console.log('Módulos cargados exitosamente:', modulos.length);
        // Los módulos ya se actualizan automáticamente por el subject
      },
      error: (error) => {
        console.error('Error cargando módulos:', error);
        this.mostrarError('Error al cargar los módulos. Verifica tu conexión e intenta de nuevo.');
      }
    });

    // Cargar estadísticas
    const estadisticasPromise = this.modulosService.obtenerEstadisticasProgreso().subscribe({
      next: (stats) => {
        this.estadisticasProgreso = stats;
        //console.log('Estadísticas cargadas:', stats);
      },
      error: (error) => {
        console.warn('Error cargando estadísticas (no crítico):', error);
      }
    });

    this.subscriptions.push(modulosPromise, estadisticasPromise);
  }

  private limpiarRecursos(): void {
    // Limpiar subscripciones
    this.subscriptions.forEach(sub => {
      if (sub && !sub.closed) {
        sub.unsubscribe();
      }
    });
    this.subscriptions = [];

    // Registrar tiempo final si hay lectura activa
    if (this.tiempoInicioLectura && this.lecturaActual) {
      this.registrarTiempoLectura();
    }

    // Limpiar interval de tiempo
    this.detenerContadorTiempo();
  }

  // === NAVEGACIÓN ENTRE VISTAS === //

  seleccionarModulo(modulo: Modulo): void {
  if (!modulo) {
    console.error('Módulo no válido');
    return;
  }

  if (modulo.bloqueado) {
    this.mostrarNotificacion({
      mensaje: 'Este módulo está bloqueado. Completa el anterior primero.',
      tipo: 'warning'
    });
    return;
  }
  
  console.log('Cargando módulo:', modulo.titulo);
  this.cargando = true;

  // ✅ CORRECCIÓN: Cargar detalles COMPLETOS del módulo
  const sub = this.modulosService.obtenerModulo(modulo.id).subscribe({
    next: (moduloCompleto) => {
      console.log('Módulo cargado con:', {
        lecturas: moduloCompleto.lecturas?.length,
        materiales: moduloCompleto.materialesAdicionales?.length
      });
      
      // ✅ Asegurar que los arrays existan
      if (!moduloCompleto.lecturas) {
        moduloCompleto.lecturas = [];
      }
      if (!moduloCompleto.materialesAdicionales) {
        moduloCompleto.materialesAdicionales = [];
      }
      
      this.moduloSeleccionado = moduloCompleto;
      this.mostrandoLectura = false;
      this.lecturaActual = null;
      this.cargando = false;
    },
    error: (error) => {
      console.error('Error cargando módulo:', error);
      this.mostrarError('Error al cargar el módulo');
      this.cargando = false;
    }
  });

  this.subscriptions.push(sub);
}

  abrirLectura(lectura: Lectura, modulo: Modulo): void {
  if (!lectura || !modulo) {
    console.error('Lectura o módulo no válido');
    return;
  }

  console.log('Abriendo lectura:', lectura.titulo);
  console.log('Datos de lectura recibidos:', lectura); // 🔍 Debug
  
  // ✅ Mostrar la vista de lectura inmediatamente
  this.mostrandoLectura = true;
  this.moduloSeleccionado = { ...modulo };
  this.cargando = true; // Mostrar loading mientras carga
  
  // ✅ Cargar el contenido COMPLETO de la lectura desde el servidor
  const sub = this.modulosService.obtenerLectura(lectura.id).subscribe({
    next: (lecturaCompleta) => {
      console.log('Lectura completa cargada:', lecturaCompleta);
      console.log('Contenido de lectura:', lecturaCompleta.contenido); // 🔍 Debug
      
      this.lecturaActual = lecturaCompleta;
      this.cargando = false;
      
      // Verificar si el contenido está vacío
      if (!lecturaCompleta.contenido || lecturaCompleta.contenido.trim() === '') {
        console.warn('⚠️ La lectura no tiene contenido');
        this.mostrarNotificacion({
          mensaje: 'Esta lectura no tiene contenido disponible',
          tipo: 'warning'
        });
      }
      
      // Inicializar tiempo de lectura
      this.iniciarContadorTiempo();
      
      // Cargar notas existentes
      this.cargarNotasLectura(lecturaCompleta.id);
    },
    error: (error) => {
      console.error('❌ Error cargando lectura completa:', error);
      this.cargando = false;
      this.mostrarError('Error al cargar el contenido de la lectura');
      this.cerrarLectura();
    }
  });

  this.subscriptions.push(sub);
}

// Después de marcar lectura completada, actualizar módulo seleccionado
private actualizarModuloSeleccionado(idModulo: number, nuevoProgreso: number): void {
  if (this.moduloSeleccionado && this.moduloSeleccionado.id === idModulo) {
    this.moduloSeleccionado = {
      ...this.moduloSeleccionado,
      progreso: Math.round(nuevoProgreso),
      progreso_porcentaje: Math.round(nuevoProgreso),
      completado: nuevoProgreso >= 100
    };
  }
}

  cerrarLectura(): void {
    // Registrar tiempo antes de cerrar
    if (this.tiempoInicioLectura && this.lecturaActual) {
      this.registrarTiempoLectura();
    }

    this.detenerContadorTiempo();
    this.mostrandoLectura = false;
    this.lecturaActual = null;
    this.tiempoInicioLectura = null;
    this.notasLectura = '';
  }

  volverAModulos(): void {
    this.moduloSeleccionado = null;
    this.cerrarLectura();
  }

  // === FUNCIONES DE PROGRESO === //

  marcarLecturaCompletada(lectura: Lectura, modulo: Modulo): void {
  if (!lectura || !modulo || this.completandoLectura) {
    return;
  }

  if (lectura.completado) {
    this.mostrarNotificacion({
      mensaje: 'Esta lectura ya está completada.',
      tipo: 'info'
    });
    return;
  }

  console.log('Marcando lectura como completada:', lectura.titulo);
  this.completandoLectura = true;

  if (this.tiempoInicioLectura) {
    this.registrarTiempoLectura();
  }

  const subscription = this.modulosService.marcarLecturaCompletada(lectura.id, modulo.id)
    .subscribe({
      next: (response: ProgresoResponse) => {
        console.log('Lectura completada exitosamente:', response);
        
        // ✅ CORRECCIÓN 1: Actualizar estado local INMEDIATAMENTE
        if (this.lecturaActual) {
          this.lecturaActual.completado = true;
        }
        
        // ✅ CORRECCIÓN 2: Actualizar la lectura en la lista del módulo seleccionado
        if (this.moduloSeleccionado && this.moduloSeleccionado.lecturas) {
          const lecturaIndex = this.moduloSeleccionado.lecturas.findIndex(l => l.id === lectura.id);
          if (lecturaIndex !== -1) {
            this.moduloSeleccionado.lecturas[lecturaIndex].completado = true;
          }
        }
        
        // ✅ CORRECCIÓN 3: Actualizar módulo seleccionado con nuevo progreso
        this.actualizarModuloSeleccionado(modulo.id, response.nuevo_progreso);
        
        // ✅ CORRECCIÓN 4: Actualizar en la lista de módulos
        const moduloEnLista = this.modulos.find(m => m.id === modulo.id);
        if (moduloEnLista) {
          moduloEnLista.progreso = Math.round(response.nuevo_progreso);
          moduloEnLista.progreso_porcentaje = Math.round(response.nuevo_progreso);
          moduloEnLista.completado = response.modulo_completado;
          
          // ✅ Actualizar lectura en el módulo de la lista
          if (moduloEnLista.lecturas) {
            const lecturaEnLista = moduloEnLista.lecturas.find(l => l.id === lectura.id);
            if (lecturaEnLista) {
              lecturaEnLista.completado = true;
            }
          }
        }
        
        this.mostrarFeedbackProgreso(response, modulo);
        this.completandoLectura = false;
      },
      error: (error) => {
        console.error('Error marcando lectura completada:', error);
        this.mostrarError('Error al guardar el progreso. Por favor, intenta de nuevo.');
        this.completandoLectura = false;
      }
    });

  this.subscriptions.push(subscription);
}

  private mostrarFeedbackProgreso(response: ProgresoResponse, modulo: Modulo): void {
    if (response.modulo_completado) {
      this.mostrarNotificacion({
        mensaje: `¡Felicidades! Completaste el módulo: ${modulo.titulo}`,
        tipo: 'success',
        duracion: 6000
      });
    } else {
      this.mostrarNotificacion({
        mensaje: `Progreso actualizado: ${response.nuevo_progreso}% en ${modulo.titulo}`,
        tipo: 'info',
        duracion: 4000
      });
    }

    if (response.siguiente_modulo_desbloqueado) {
      setTimeout(() => {
        this.mostrarNotificacion({
          mensaje: '¡Nuevo módulo desbloqueado! Ya puedes acceder al siguiente módulo.',
          tipo: 'success',
          duracion: 5000
        });
      }, 1000);
    }
  }

  // === FUNCIONES DE NOTAS === //

  private cargarNotasLectura(idLectura: number): void {
    if (!idLectura || idLectura <= 0) return;

    const subscription = this.modulosService.obtenerNotasLectura(idLectura)
      .subscribe({
        next: (notas) => {
          this.notasLectura = notas || '';
        },
        error: (error) => {
          console.warn('Error cargando notas (usando valor por defecto):', error);
          this.notasLectura = '';
        }
      });

    this.subscriptions.push(subscription);
  }

  guardarNotasLectura(): void {
    if (!this.lecturaActual || this.guardandoNotas) {
      return;
    }

    this.guardandoNotas = true;

    const subscription = this.modulosService.guardarNotasLectura(
      this.lecturaActual.id, 
      this.notasLectura || ''
    ).subscribe({
      next: () => {
        this.mostrarNotificacion({
          mensaje: 'Notas guardadas correctamente',
          tipo: 'success',
          duracion: 3000
        });
        this.guardandoNotas = false;
      },
      error: (error) => {
        console.error('Error guardando notas:', error);
        this.mostrarError('Error al guardar las notas. Por favor, intenta de nuevo.');
        this.guardandoNotas = false;
      }
    });

    this.subscriptions.push(subscription);
  }

  onNotasChange(event: any): void {
    this.notasLectura = event.target?.value || '';
  }

  // === FUNCIONES DE MATERIALES === //

  descargarMaterial(material: any): void {
  console.log('🔽 Intentando descargar:', material);
  
  if (!material?.id) {
    this.mostrarError('Material no válido para descarga');
    return;
  }

  this.mostrarNotificacion({
    mensaje: `Descargando ${material.titulo}...`,
    tipo: 'info',
    duracion: 2000
  });

  const subscription = this.modulosService.descargarMaterial(material)
    .subscribe({
      next: (blob) => {
        if (blob && blob.size > 0) {
          // Extraer extensión del nombre del archivo
          const extension = material.filename?.split('.').pop() || 
                          material.url?.split('.').pop() || 
                          'pdf';
          
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${material.titulo}.${extension}`;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          this.mostrarNotificacion({
            mensaje: `${material.titulo} descargado exitosamente`,
            tipo: 'success',
            duracion: 3000
          });
        } else {
          this.mostrarError('El archivo descargado está vacío');
        }
      },
      error: (error) => {
        console.error('❌ Error descargando material:', error);
        this.mostrarError('Error al descargar el material. Verifica tu conexión.');
      }
    });

  this.subscriptions.push(subscription);
}

  private descargarArchivo(blob: Blob, filename: string): void {
    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.pdf`; // Asumir PDF por defecto
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creando enlace de descarga:', error);
      this.mostrarError('Error al procesar la descarga.');
    }
  }

  // === FUNCIONES DE TIEMPO === //

  private iniciarContadorTiempo(): void {
    this.tiempoInicioLectura = new Date();
    this.tiempoTranscurrido = 0;
    
    // Actualizar tiempo cada minuto
    this.tiempoLecturaInterval = interval(60000) // 60 segundos
      .subscribe(() => {
        if (this.tiempoInicioLectura) {
          const ahora = new Date();
          this.tiempoTranscurrido = Math.round(
            (ahora.getTime() - this.tiempoInicioLectura.getTime()) / (1000 * 60)
          );
        }
      });
  }

  private detenerContadorTiempo(): void {
    if (this.tiempoLecturaInterval) {
      this.tiempoLecturaInterval.unsubscribe();
      this.tiempoLecturaInterval = null;
    }
  }

  private registrarTiempoLectura(): void {
    if (!this.tiempoInicioLectura || !this.lecturaActual) return;

    const tiempoTranscurrido = Math.round(
      (new Date().getTime() - this.tiempoInicioLectura.getTime()) / (1000 * 60)
    );

    // Solo registrar si el tiempo es mayor a 1 minuto
    if (tiempoTranscurrido >= 1) {
      const subscription = this.modulosService.registrarTiempoEstudio(
        this.lecturaActual.id, 
        tiempoTranscurrido
      ).subscribe({
        next: () => {
          console.log(`Tiempo de estudio registrado: ${tiempoTranscurrido} minutos`);
        },
        error: (error) => {
          console.warn('Error registrando tiempo de estudio:', error);
          // No mostrar error al usuario, es información opcional
        }
      });

      this.subscriptions.push(subscription);
    }
  }

  obtenerTiempoTranscurrido(): string {
    if (!this.tiempoInicioLectura) return '0 min';
    
    const ahora = new Date();
    const minutos = Math.round(
      (ahora.getTime() - this.tiempoInicioLectura.getTime()) / (1000 * 60)
    );
    
    if (minutos >= 60) {
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      return `${horas}h ${mins}min`;
    }
    return `${minutos} min`;
  }

  // === FUNCIONES AUXILIARES === //

  private cargarDetallesModulo(idModulo: number): void {
    if (!idModulo || idModulo <= 0) return;

    const subscription = this.modulosService.obtenerModulo(idModulo)
      .subscribe({
        next: (modulo) => {
          console.log('Detalles del módulo cargados:', modulo.titulo);
          // Actualizar módulo en la lista
          const index = this.modulos.findIndex(m => m.id === idModulo);
          if (index !== -1) {
            this.modulos[index] = modulo;
          }
          // Actualizar módulo seleccionado
          this.moduloSeleccionado = modulo;
        },
        error: (error) => {
          console.error('Error cargando detalles del módulo:', error);
          this.mostrarError('Error al cargar los detalles del módulo.');
        }
      });

    this.subscriptions.push(subscription);
  }

  private actualizarProgresoTotal(): void {
    this.progresoTotal = this.modulosService.calcularProgresoTotal();
  }

  // === FUNCIONES PÚBLICAS PARA EL TEMPLATE === //

  calcularProgresoTotal(): number {
    return this.progresoTotal;
  }

  obtenerNivelColor(nivel: string): string {
    return this.modulosService.obtenerNivelColor(nivel);
  }

  // === MANEJO DE MENSAJES === //

  private mostrarNotificacion(notificacion: NotificacionTipo): void {
    console.log(`[${notificacion.tipo.toUpperCase()}] ${notificacion.mensaje}`);
    
    // Crear elemento de notificación
    const notification = this.crearElementoNotificacion(notificacion);
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover después del tiempo especificado
    const duracion = notificacion.duracion || 4000;
    setTimeout(() => {
      this.removerNotificacion(notification);
    }, duracion);
  }

  private crearElementoNotificacion(notificacion: NotificacionTipo): HTMLElement {
    const notification = document.createElement('div');
    notification.className = `notification notification-${notificacion.tipo}`;
    
    // Configurar estilos
    const colores = {
      success: '#2ecc71',
      info: '#3498db', 
      warning: '#f39c12',
      error: '#e74c3c'
    };
    
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1002;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      background-color: ${colores[notificacion.tipo]};
      max-width: 400px;
      word-wrap: break-word;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    // Agregar icono según tipo
    const iconos = {
      success: '✓',
      info: 'ℹ',
      warning: '⚠',
      error: '✕'
    };
    
    notification.innerHTML = `
      <span style="margin-right: 0.5rem; font-weight: bold;">${iconos[notificacion.tipo]}</span>
      ${notificacion.mensaje}
    `;
    
    return notification;
  }

  private removerNotificacion(notification: HTMLElement): void {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }

  private mostrarError(mensaje: string): void {
    this.error = mensaje;
    console.error('Error mostrado al usuario:', mensaje);
    
    // Auto-limpiar error después de 6 segundos
    setTimeout(() => {
      if (this.error === mensaje) { // Solo limpiar si es el mismo error
        this.error = null;
      }
    }, 6000);
  }

  // === FUNCIONES DE UTILIDAD === //

  private esProduccion(): boolean {
    return environment.production;
  }

  recargarModulos(): void {
    this.mostrarNotificacion({
      mensaje: 'Recargando módulos...',
      tipo: 'info',
      duracion: 2000
    });

    const subscription = this.modulosService.recargarModulos()
      .subscribe({
        next: () => {
          this.mostrarNotificacion({
            mensaje: 'Módulos recargados exitosamente',
            tipo: 'success'
          });
        },
        error: (error) => {
          console.error('Error recargando módulos:', error);
          this.mostrarError('Error al recargar módulos. Verifica tu conexión.');
        }
      });

    this.subscriptions.push(subscription);
  }

  // === FUNCIONES DEBUG (SOLO DESARROLLO) === //

  resetearProgreso(): void {
    if (!this.showDebugControls) return;

    const confirmacion = confirm('¿Estás seguro de que quieres resetear todo el progreso? Esta acción no se puede deshacer.');
    if (!confirmacion) return;

    this.mostrarNotificacion({
      mensaje: 'Reseteando progreso...',
      tipo: 'warning',
      duracion: 3000
    });

    // Resetear progreso de todos los módulos
    const resetPromises = this.modulos.map(modulo => 
      this.modulosService.resetearProgresoModulo(modulo.id).subscribe({
        next: () => {
          console.log(`Progreso reseteado para módulo ${modulo.id}`);
        },
        error: (error) => {
          console.error(`Error reseteando progreso del módulo ${modulo.id}:`, error);
        }
      })
    );

    // Esperar un poco y recargar
    setTimeout(() => {
      this.recargarModulos();
    }, 2000);
  }

  // === GETTERS PARA EL TEMPLATE === //

  get hayModulos(): boolean {
    return this.modulos && this.modulos.length > 0;
  }

  get modulosDesbloqueados(): Modulo[] {
    return this.modulos.filter(m => !m.bloqueado);
  }

  get modulosCompletados(): Modulo[] {
    return this.modulos.filter(m => (m.progreso || 0) >= 100);
  }

  get siguienteModuloPorCompletar(): Modulo | null {
    return this.modulos.find(m => !m.bloqueado && (m.progreso || 0) < 100) || null;
  }
}