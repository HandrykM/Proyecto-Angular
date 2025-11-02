import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError, finalize } from 'rxjs/operators';
import { ActividadesService } from '../../services/actividades';
import { ReutilizableService } from '../../services/reutilizable-service';
import { RankingGogoService } from '../../services/ranking-gogo';
import { AuthService } from '../../services/auth';
import { 
  Actividad, 
  EstadisticasActividades, 
  RankingGoGo, 
  ProgresoActividad,
  TipoActividad 
} from '../../models/actividad.model';

@Component({
  selector: 'app-actividades',
  templateUrl: './actividades.html',
  styleUrls: ['./actividades.css'],
  imports: [CommonModule, RouterModule],
  standalone: true
})
export class ActividadesComponent implements OnInit, OnDestroy {
  usuario: { foto?: string; nombre?: string; rol?: string } | null = null;
  actividades: Actividad[] = [];
  estadisticas: EstadisticasActividades | null = null;
  rankingGogo: RankingGoGo[] = [];
  loading = true;
  error: string | null = null;
  usuarioId: number;
  fotoUsuario: string | null = null;
  conectividadOk = false;
  mostrarRanking: boolean = false;


  private destroy$ = new Subject<void>();

  constructor(
    private actividadesService: ActividadesService,
    private rankingService: RankingGogoService,
    private authService: AuthService,
    private router: Router
  ) {
    this.usuarioId = this.authService.getUsuarioId();
    this.fotoUsuario = this.authService.getFotoUsuario();
  }

  ngOnInit(): void {
  // 🔹 Lógica existente
  this.verificarConectividad();

  this.authService.usuario$.subscribe(usuario => {
    this.usuario = usuario;
  });

  // 🔹 Configurar menú hamburguesa (responsive desde la derecha)
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
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Verifica la conectividad con el backend antes de cargar datos
   */
  private verificarConectividad(): void {
    this.actividadesService.verificarConectividad()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conectado: boolean) => {
          this.conectividadOk = conectado;
          if (conectado) {
            this.cargarDatos();
          } else {
            this.cargarDatosFallback();
          }
        },
        error: () => {
          this.conectividadOk = false;
          this.cargarDatosFallback();
        }
      });
  }

  /**
   * Carga todos los datos necesarios del backend
   */
  private cargarDatos(): void {
    this.loading = true;
    this.error = null;
    
    const requests = forkJoin({
      actividades: this.actividadesService.obtenerActividades().pipe(
        catchError(error => {
          console.error('Error al cargar actividades:', error);
          return of([]);
        })
      ),
      progreso: this.actividadesService.obtenerProgresoUsuario(this.usuarioId).pipe(
        catchError(error => {
          console.error('Error al cargar progreso:', error);
          return of([]);
        })
      ),
      estadisticas: this.actividadesService.obtenerEstadisticas(this.usuarioId).pipe(
        catchError(error => {
          console.error('Error al cargar estadísticas:', error);
          return of(null);
        })
      ),
      ranking: this.rankingService.obtenerRanking(10).pipe(
        catchError(error => {
          console.error('Error al cargar ranking:', error);
          return of([]);
        })
      )
    });

    requests.pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (data) => {
        this.procesarDatos(data);
      },
      error: (error) => {
        console.error('Error al cargar datos:', error);
        this.error = 'Error al cargar las actividades. Verifica tu conexión e inténtalo de nuevo.';
        this.cargarDatosFallback();
      }
    });
  }

  /**
   * Carga datos fallback cuando no hay conectividad
   */
  private cargarDatosFallback(): void {
    this.actividades = this.getActividadesEstaticas();
    this.estadisticas = {
      totalActividades: this.actividades.length,
      actividadesCompletadas: 0,
      puntosTotal: 0,
      tiempoTotalMinutos: 0,
      actividadFavorita: 'Ninguna'
    };
    this.rankingGogo = [];
    this.loading = false;
    this.error = 'Modo offline: Conecta a internet para sincronizar tu progreso.';
  }

  /**
   * Obtiene actividades estáticas para modo offline
   */
  private getActividadesEstaticas(): Actividad[] {
    return [
      {
        id: 1,
        titulo: 'Simulador de Gestión del Agua',
        descripcion: 'Aprende a distribuir eficientemente el agua en actividades diarias del hogar',
        tipo: TipoActividad.SIMULADOR,
        icono: 'fas fa-tint',
        color: '#1abc9c',
        nivel: 'basico',
        puntos: 50,
        duracion: '15-20 min',
        completada: false,
        progreso: 0
      },
      {
        id: 2,
        titulo: 'Trivia del Agua: Desafío de Sabiduría',
        descripcion: 'Pon a prueba tus conocimientos sobre el reúso del agua con preguntas de diferentes niveles',
        tipo: TipoActividad.TRIVIA,
        icono: 'fas fa-brain',
        color: '#3498db',
        nivel: 'intermedio',
        puntos: 100,
        duracion: '5-10 min',
        completada: false,
        progreso: 0
      },
      {
        id: 3,
        titulo: 'GoGo - Aventura Acuática',
        descripcion: 'Juego de plataformas donde navegas por un mundo submarino lleno de desafíos',
        tipo: TipoActividad.JUEGO,
        icono: 'fas fa-gamepad',
        color: '#e74c3c',
        nivel: 'avanzado',
        puntos: 100,
        duracion: '20-30 min',
        completada: false,
        progreso: 0
      }
    ];
  }

  /**
   * Procesa los datos recibidos del backend
   */
  private procesarDatos(data: any): void {
    // Combinar actividades con progreso
    this.actividades = data.actividades.map((actividad: Actividad) => {
      const progreso = data.progreso.find((p: ProgresoActividad) => 
        p.idActividad === actividad.id
      );
      
      if (progreso) {
        actividad.completada = progreso.completada;
        actividad.progreso = progreso.progreso;
        actividad.puntuacionMaxima = progreso.puntuacionMaxima;
        actividad.ultimaVez = progreso.ultimaActividad;
      } else {
        actividad.completada = false;
        actividad.progreso = 0;
      }
      
      return actividad;
    });

    this.estadisticas = data.estadisticas;
    this.rankingGogo = data.ranking;
  }

  // Corregir método navegarAActividad:
navegarAActividad(actividad: Actividad): void {
  console.log('Navegando a actividad:', actividad.titulo, 'Tipo:', actividad.tipo);
  // Registrar inicio de actividad
  this.registrarInicioActividad(actividad.id);

  // Navegar según el tipo de actividad y nivel
  switch (actividad.tipo) {
    
    case 'trivia':
case 'pregunta':
  // Si es básico O es el ID 2 → trivia básica
  // Si es intermedio O es el ID 6 → trivia media
  if (actividad.nivel === 'basico' || actividad.id === 2) {
    this.router.navigate(['/actividades/trivia-basica']);
  } else if (actividad.nivel === 'intermedio' || actividad.id === 6) {
    this.router.navigate(['/actividades/trivia-media']);
  } else {
    this.router.navigate(['/actividades/trivia-basica']); // fallback
  }
  break;

    case 'juego':
      if (actividad.id === 3) {
        // Juego GoGo
        this.router.navigate(['/actividades/juego-gogo']);
      } else if (actividad.id === 7) {
        // Juego Reutilizable o No
        this.router.navigate(['/actividades/juego-reutilizable']);
      } else {
        this.router.navigate(['/actividades/juego-gogo']); // fallback
      }
      break;

      case 'simulador':
      this.router.navigate(['/actividades/simulador-agua']);
      break;

      
      


    case 'quiz':
      this.router.navigate(['/actividades/quiz-rapido']);
      break;

    default:
      console.error('Tipo de actividad no reconocido:', actividad.tipo);
      alert(`Actividad "${actividad.titulo}" aún no está disponible`);
  }
}



  /**
   * Registra el inicio de una actividad
   */
  private registrarInicioActividad(idActividad: number): void {
    this.actividadesService.iniciarActividad(this.usuarioId, idActividad)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Inicio de actividad registrado');
        },
        error: (error) => {
          console.error('Error al registrar inicio:', error);
          // No mostramos error al usuario, no es crítico
        }
      });
  }

  /**
   * Refresca los datos del componente
   */
  refrescarDatos(): void {
    if (this.conectividadOk) {
      this.cargarDatos();
    } else {
      this.verificarConectividad();
    }
  }

  /**
   * Muestra mensaje cuando no hay conectividad
   */
  private mostrarMensajeOffline(): void {
    this.error = 'Sin conexión: Las actividades requieren conexión a internet para guardar el progreso.';
    
    // Limpiar el mensaje después de 3 segundos
    setTimeout(() => {
      if (this.error?.includes('Sin conexión')) {
        this.error = null;
      }
    }, 3000);
  }

  /**
   * Obtiene el texto del estado de una actividad
   */
  getEstadoActividad(actividad: Actividad): string {
    if (!actividad.progreso) return 'Sin empezar';
    if (actividad.completada) return 'Completada';
    if (actividad.progreso > 0) return 'En progreso';
    return 'Sin empezar';
  }

  /**
   * Obtiene la clase CSS para el estado de una actividad
   */
  getClaseEstado(actividad: Actividad): string {
    if (actividad.completada) return 'completada';
    if (actividad.progreso && actividad.progreso > 0) return 'en-progreso';
    return 'sin-empezar';
  }

  /**
   * Calcula el progreso total del usuario
   */
  get progresoTotal(): number {
    if (!this.actividades.length) return 0;
    
    const totalProgreso = this.actividades.reduce((sum, act) => 
      sum + (act.progreso || 0), 0
    );
    
    return Math.round(totalProgreso / this.actividades.length);
  }

  /**
   * Obtiene las actividades por nivel de dificultad
   */
  getActividadesPorNivel(nivel: string): Actividad[] {
    return this.actividades.filter(act => act.nivel === nivel);
  }

  /**
   * Verifica si una actividad está bloqueada
   */
  estaActividadBloqueada(actividad: Actividad): boolean {
    // Lógica para determinar si una actividad debe estar bloqueada
    // Por ejemplo, las actividades avanzadas requieren completar básicas
    if (actividad.nivel === 'avanzado') {
      const actividadesBasicas = this.getActividadesPorNivel('basico');
      return !actividadesBasicas.some(act => act.completada);
    }
    
    if (actividad.nivel === 'intermedio') {
      const actividadesBasicas = this.getActividadesPorNivel('basico');
      const completadasBasicas = actividadesBasicas.filter(act => act.completada).length;
      return completadasBasicas === 0; // Requiere al menos una básica completada
    }
    
    return false; // Las actividades básicas nunca están bloqueadas
  }

  /**
   * Obtiene el mensaje de bloqueo para una actividad
   */
  getMensajeBloqueo(actividad: Actividad): string {
    if (actividad.nivel === 'avanzado') {
      return 'Completa al menos una actividad básica para desbloquear';
    }
    
    if (actividad.nivel === 'intermedio') {
      return 'Completa una actividad básica para desbloquear';
    }
    
    return '';
  }
  

  
}