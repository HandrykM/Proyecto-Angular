import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BibliotecaService } from '../../services/biblioteca.service';
import { PerfilService } from '../../services/perfil';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription, of } from 'rxjs';
import { timeout, finalize, catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth';

export interface Recurso {
  id: number;
  titulo: string;
  descripcion: string;
  contenido?: string;
  tipo: 'video' | 'infografia' | 'estudio' | 'guia';
  thumbnail: string;
  url: string;
  autor?: string;
  duracion?: string;
  fecha_creacion?: string;
  categoria?: string;
  puntos?: number;
  nivel?: 'basico' | 'intermedio' | 'avanzado';
}

interface FiltrosBiblioteca {
  busqueda: string;
  tipos: string[];
  niveles: string[];
  categorias: string[];
}



@Component({
  selector: 'app-biblioteca',
  templateUrl: './biblioteca.html',
  styleUrls: ['./biblioteca.css'],
  imports: [CommonModule, RouterModule, FormsModule],
  standalone: true
})
export class Biblioteca implements OnInit, OnDestroy {
  cargandoVideo: boolean = false;
  videoError: string | null = null;
  fotoUsuario: string;
  usuario: { foto?: string; nombre?: string; rol?: string; id?: number } | null = null;

  // Estados principales
  recursos: Recurso[] = [];
  recursoSeleccionado: Recurso | null = null;
  mostrandoRecurso: boolean = false;
  favoritos: number[] = [];
  recursosLeidos: Set<number> = new Set();

  // Estados de UI
  cargando: boolean = true;
  error: string | null = null;
  cargandoRecurso: boolean = false;
  puntosGanados: number = 0;
  mostrarPuntos: boolean = false;
  previewObjectUrl: string | null = null;
previewUrl: SafeResourceUrl | null = null;
  sanitizedRecursoUrl: SafeResourceUrl | null = null;

// helper para detectar mp4
isMp4(url: string | undefined): boolean {
  if (!url) return false;
  
  // Si es YouTube, definitivamente NO es MP4
  if (this.obtenerIdYoutube(url)) return false;
  
  // Verificar extensión .mp4
  return /\.mp4(\?|#|$)/i.test(url);
}

  // Filtros y búsqueda
  filtros: FiltrosBiblioteca = {
    busqueda: '',
    tipos: [],
    niveles: [],
    categorias: []
  };

  // Pestañas
  pestanaActiva: 'todos' | 'favoritos' | 'recientes' = 'todos';

  // Categorías y tipos disponibles
  tiposDisponibles = [
    { key: 'video', label: 'Videos', icono: 'fas fa-video', color: '#e74c3c' },
    { key: 'infografia', label: 'Infografías', icono: 'fas fa-chart-bar', color: '#2ecc71' },
    { key: 'estudio', label: 'Estudios', icono: 'fas fa-file-alt', color: '#8b5cf6' },
    { key: 'guia', label: 'Guías', icono: 'fas fa-book', color: '#f59e0b' }
  ];

  nivelesDisponibles = [
    { key: 'basico', label: 'Básico', color: '#2ecc71' },
    { key: 'intermedio', label: 'Intermedio', color: '#f39c12' },
    { key: 'avanzado', label: 'Avanzado', color: '#e74c3c' }
  ];

  private subscriptions: Subscription[] = [];
  private currentPreviewSub?: Subscription;
  // Tamaño máximo (bytes) para previsualizar inline en el navegador (10MB)
  private readonly MAX_PREVIEW_SIZE = 10 * 1024 * 1024;

  onVideoLoad(): void {
  console.log('Video metadata cargada');
  this.cargandoVideo = false;
  this.videoError = null;
}

  onVideoError(event: any): void {
  console.error('❌ Error en video element:', event);
  this.cargandoVideo = false;
  
  const videoElement = event.target as HTMLVideoElement;
  if (videoElement?.error) {
    switch (videoElement.error.code) {
      case 1: this.videoError = 'Carga interrumpida'; break;
      case 2: this.videoError = 'Error de red'; break;
      case 3: this.videoError = 'Error de decodificación'; break;
      case 4: this.videoError = 'Formato no soportado'; break;
      default: this.videoError = 'Error desconocido';
    }
  } else {
    this.videoError = 'No se pudo reproducir el video';
  }
}

  constructor(
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private bibliotecaService: BibliotecaService,
    private perfilService: PerfilService
  ) {
    const foto = this.authService.getFotoUsuario();
    this.fotoUsuario = foto !== null ? foto : '';
  }

  ngOnInit(): void {
  // 🔹 Lógica existente
  this.cargarRecursos();
  this.cargarFavoritos();

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
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  obtenerLabelTipo(tipoKey: string): string {
    const tipo = this.tiposDisponibles.find(t => t.key === tipoKey);
    return tipo ? tipo.label : '';
  }

  // === CARGA DE DATOS === //
  private cargarRecursos(): void {
    this.cargando = true;
    this.error = null;

    const sub = this.bibliotecaService.getRecursos().subscribe({
      next: (data: Recurso[]) => {
        this.recursos = data;
        this.cargando = false;
        this.cargarRecursosLeidos();
      },
      error: (err) => {
        console.error('Error al cargar recursos:', err);
        this.error = 'Error al cargar la biblioteca';
        this.cargando = false;
      }
    });

    this.subscriptions.push(sub);
  }

  private cargarRecursosLeidos(): void {
    if (!this.usuario?.id) return;

    this.recursos.forEach(recurso => {
      const sub = this.bibliotecaService.verificarLectura(recurso.id, this.usuario!.id!).subscribe({
        next: (response) => {
          if (response.leido) {
            this.recursosLeidos.add(recurso.id);
          }
        },
        error: (err) => console.error('Error verificando lectura:', err)
      });
      this.subscriptions.push(sub);
    });
  }

  private cargarFavoritos(): void {
    const favoritosGuardados = localStorage.getItem('hydrosave-favoritos-biblioteca');
    if (favoritosGuardados) {
      this.favoritos = JSON.parse(favoritosGuardados);
    }
  }

  private guardarFavoritos(): void {
    localStorage.setItem('hydrosave-favoritos-biblioteca', JSON.stringify(this.favoritos));
  }

  // === GESTIÓN DE FILTROS === //
  alternarFiltroTipo(tipo: string): void {
    const index = this.filtros.tipos.indexOf(tipo);
    if (index === -1) {
      this.filtros.tipos.push(tipo);
    } else {
      this.filtros.tipos.splice(index, 1);
    }
  }

  alternarFiltroNivel(nivel: string): void {
    const index = this.filtros.niveles.indexOf(nivel);
    if (index === -1) {
      this.filtros.niveles.push(nivel);
    } else {
      this.filtros.niveles.splice(index, 1);
    }
  }

  limpiarFiltros(): void {
    this.filtros = {
      busqueda: '',
      tipos: [],
      niveles: [],
      categorias: []
    };
  }

  // === FUNCIONES DE FILTRADO === //
  obtenerRecursosFiltrados(): Recurso[] {
    let recursos = [...this.recursos];

    if (this.pestanaActiva === 'favoritos') {
      recursos = recursos.filter(r => this.esFavorito(r.id));
    }

    if (this.filtros.busqueda.trim()) {
      const busqueda = this.filtros.busqueda.toLowerCase();
      recursos = recursos.filter(r => 
        r.titulo.toLowerCase().includes(busqueda) ||
        r.descripcion.toLowerCase().includes(busqueda) ||
        r.autor?.toLowerCase().includes(busqueda) ||
        r.categoria?.toLowerCase().includes(busqueda)
      );
    }

    if (this.filtros.tipos.length > 0) {
      recursos = recursos.filter(r => this.filtros.tipos.includes(r.tipo));
    }

    if (this.filtros.niveles.length > 0) {
      recursos = recursos.filter(r => r.nivel && this.filtros.niveles.includes(r.nivel));
    }

    return recursos;
  }

  // Verificar si hay pocos elementos para ajustar grid
  tienePocoElementos(): boolean {
    return this.obtenerRecursosFiltrados().length <= 3;
  }

  // === GESTIÓN DE FAVORITOS === //
  alternarFavorito(recurso: Recurso): void {
    const index = this.favoritos.indexOf(recurso.id);
    if (index === -1) {
      this.favoritos.push(recurso.id);
      this.mostrarMensaje(`"${recurso.titulo}" agregado a favoritos`, 'success');
    } else {
      this.favoritos.splice(index, 1);
      this.mostrarMensaje(`"${recurso.titulo}" removido de favoritos`, 'info');
    }
    this.guardarFavoritos();
  }

  esFavorito(id: number): boolean {
    return this.favoritos.includes(id);
  }

  esRecursoLeido(id: number): boolean {
    return this.recursosLeidos.has(id);
  }

  // === NAVEGACIÓN Y VISUALIZACIÓN === //
  abrirRecurso(recurso: Recurso): void {
  console.log('🎬 Abriendo recurso:', { 
    id: recurso.id, 
    tipo: recurso.tipo, 
    url: recurso.url?.substring(0, 50) + '...' 
  });

  // Resetear estados
  this.recursoSeleccionado = recurso;
  this.mostrandoRecurso = true;
  this.cargandoRecurso = true;
  this.cargandoVideo = false;
  this.videoError = null;
  this.puntosGanados = 0;
  this.mostrarPuntos = false;

  // Limpiar preview anterior
  if (this.previewObjectUrl) {
    try { URL.revokeObjectURL(this.previewObjectUrl); } catch(e) {/*ignore*/}
    this.previewObjectUrl = null;
  }
  this.previewUrl = null;
  this.sanitizedRecursoUrl = null;

  // ✅ CAMBIO PRINCIPAL: Registrar como "visto" para videos, "leído" para el resto
  if (this.usuario?.id && !this.esRecursoLeido(recurso.id)) {
    const tipoEvento: 'leido' | 'visto' = recurso.tipo === 'video' ? 'visto' : 'leido';
    this.registrarLectura(recurso.id, tipoEvento);
  }

  // CASO 1: VIDEO
  if (recurso.tipo === 'video') {
    const youtubeId = this.obtenerIdYoutube(recurso.url);
    
    if (youtubeId) {
      // ES YOUTUBE
      console.log('✅ Video de YouTube detectado:', youtubeId);
      this.cargandoRecurso = false;
      this.cargandoVideo = false;
      // No hacer nada más, el template maneja YouTube
    } else if (this.isMp4(recurso.url)) {
      // ES MP4 LOCAL
      console.log('✅ Video MP4 local detectado');
      this.cargarVideoMp4(recurso);
    } else {
      // URL desconocida
      console.warn('⚠️ URL de video no reconocida:', recurso.url);
      this.cargandoRecurso = false;
      this.videoError = 'Formato de video no soportado';
    }
    return;
  }

  // CASO 2: PDF/INFOGRAFÍA/GUÍA/ESTUDIO
  if (['infografia', 'guia', 'estudio'].includes(recurso.tipo)) {
    if (recurso.tipo === 'estudio' && recurso.url) {
      try {
        this.sanitizedRecursoUrl = this.sanitizarUrl(
          recurso.url + '#toolbar=1&navpanes=0&scrollbar=1'
        );
      } catch (e) {
        console.error('Error sanitizing estudio URL:', e);
        this.sanitizedRecursoUrl = null;
      }
    }
    
    if (recurso.url) {
      this.previsualizarArchivo(recurso);
    } else {
      this.cargandoRecurso = false;
    }
    return;
  }

  // CASO 3: OTROS TIPOS
  this.cargandoRecurso = false;
}
esVideo(recurso: Recurso): boolean {
  return recurso.tipo === 'video';
}

private cargarVideoMp4(recurso: Recurso): void {
  console.log('🎥 Cargando video MP4...');
  this.cargandoVideo = true;
  
  const filename = this.obtenerNombreArchivo(recurso.url);

  // Cancelar descarga previa
  if (this.currentPreviewSub) {
    try { this.currentPreviewSub.unsubscribe(); } catch(e) {/*ignore*/}
    this.currentPreviewSub = undefined;
  }

  // Timeout de 8 segundos para videos
  this.currentPreviewSub = this.bibliotecaService
    .descargarArchivo(filename)
    .pipe(
      timeout(8000),
      catchError(err => {
        console.error('❌ Error descargando video:', err);
        
        // FALLBACK: Intentar URL directa
        console.log('🔄 Intentando URL directa...');
        try {
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(recurso.url);
          this.cargandoRecurso = false;
          this.cargandoVideo = false;
          
          // Dar tiempo al navegador para renderizar el video
          setTimeout(() => {
            const videoElement = document.querySelector('.video-player') as HTMLVideoElement;
            if (videoElement) {
              console.log('✅ Video element encontrado con URL directa');
              videoElement.load();
            }
          }, 200);
        } catch(e) {
          console.error('❌ Error con URL directa:', e);
          this.videoError = 'No se pudo cargar el video';
          this.cargandoVideo = false;
        }
        
        return of(null as unknown as Blob);
      }),
      finalize(() => {
        this.cargandoRecurso = false;
      })
    )
    .subscribe((blob: Blob | null) => {
      if (!blob || blob.size === 0) {
        console.warn('⚠️ Blob vacío o nulo');
        
        // Intentar URL directa como último recurso
        try {
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(recurso.url);
          this.cargandoVideo = false;
          
          setTimeout(() => {
            const videoElement = document.querySelector('.video-player') as HTMLVideoElement;
            if (videoElement) {
              videoElement.load();
            }
          }, 200);
        } catch(e) {
          this.videoError = 'No se pudo cargar el video';
          this.cargandoVideo = false;
        }
        return;
      }

      console.log('✅ Blob recibido:', blob.size, 'bytes');

      // Crear objectURL
      try {
        if (this.previewObjectUrl) {
          URL.revokeObjectURL(this.previewObjectUrl);
        }
        
        this.previewObjectUrl = URL.createObjectURL(blob);
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewObjectUrl);
        
        console.log('✅ ObjectURL creado');
        
        // Dar tiempo al DOM para actualizar
        setTimeout(() => {
          const videoElement = document.querySelector('.video-player') as HTMLVideoElement;
          if (videoElement) {
            console.log('✅ Video element encontrado en DOM');
            videoElement.load();
          } else {
            console.warn('⚠️ Video element no encontrado en DOM');
          }
          this.cargandoVideo = false;
        }, 200);
        
      } catch (e) {
        console.error('❌ Error creando objectURL:', e);
        this.videoError = 'Error al procesar el video';
        this.cargandoVideo = false;
      }
    });

  if (this.currentPreviewSub) {
    this.subscriptions.push(this.currentPreviewSub);
  }
}

// nueva función: previsualizar archivo (usa descargarArchivo del servicio)
previsualizarArchivo(recurso: Recurso): void {
  if (!recurso?.url) {
    this.cargandoRecurso = false;
    this.previewUrl = null;
    return;
  }

  console.log('📄 Previsualizando archivo PDF/documento:', recurso.url);
  this.cargandoRecurso = true;

  const filename = this.obtenerNombreArchivo(recurso.url);

  if (this.currentPreviewSub) {
    try { this.currentPreviewSub.unsubscribe(); } catch(e) {/*ignore*/}
    this.currentPreviewSub = undefined;
  }

  this.currentPreviewSub = this.bibliotecaService
    .descargarArchivo(filename)
    .pipe(
      timeout(10000),
      catchError(err => {
        console.error('Error en descarga de archivo:', err);
        this.mostrarError('No se pudo previsualizar el archivo. Puedes descargarlo.');
        return of(null as unknown as Blob);
      }),
      finalize(() => {
        this.cargandoRecurso = false;
      })
    )
    .subscribe((blob: Blob | null) => {
      if (!blob || blob.size === 0) {
        this.previewUrl = null;
        return;
      }

      if (blob.size > this.MAX_PREVIEW_SIZE) {
        console.warn(`Archivo muy grande: ${blob.size} bytes`);
        this.mostrarError('El archivo es muy grande. Descárgalo para verlo.');
        this.previewUrl = null;
        return;
      }

      if (this.previewObjectUrl) {
        try { URL.revokeObjectURL(this.previewObjectUrl); } catch(e) {/*ignore*/}
      }

      try {
        this.previewObjectUrl = URL.createObjectURL(blob);
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewObjectUrl);
      } catch (e) {
        console.error('Error creando objectURL:', e);
        this.previewUrl = null;
      }
    });

  if (this.currentPreviewSub) {
    this.subscriptions.push(this.currentPreviewSub);
  }
} 

  private autoReproducirVideo(): void {
  setTimeout(() => {
    if (this.isMp4(this.recursoSeleccionado?.url)) {
      const videoElement = document.querySelector('.video-player') as HTMLVideoElement;
      if (videoElement) {
        console.log('Video element encontrado, configurando...');
        videoElement.preload = 'auto';
        videoElement.playsInline = true;
        
        // Intentar reproducir
        videoElement.play().catch(error => {
          console.warn('Autoplay no permitido:', error);
        });
      } else {
        console.warn('Video element no encontrado en DOM');
      }
    } else {
      const iframe = document.querySelector('.video-container iframe') as HTMLIFrameElement;
      if (iframe && iframe.src) {
        if (!iframe.src.includes('autoplay=1')) {
          iframe.src = iframe.src.includes('?') 
            ? iframe.src + '&autoplay=1' 
            : iframe.src + '?autoplay=1';
        }
      }
    }
  }, 100);
}


  private registrarLectura(idRecurso: number, tipo: 'leido' | 'visto' = 'leido'): void {
    if (!this.usuario?.id) return;

    const sub = this.bibliotecaService.registrarLectura(idRecurso, this.usuario.id, tipo).subscribe({
      next: (response) => {
        if (!response.yaLeido && tipo === 'leido') {
          // solo agregamos a recursosLeidos los que son tipo 'leido' (infografías/guías/estudios)
          this.recursosLeidos.add(idRecurso);
        }

        this.puntosGanados = response.puntosObtenidos || 0;

        if (this.puntosGanados > 0) {
          this.mostrarPuntos = true;
          setTimeout(() => {
            this.mostrarPuntos = false;
          }, 5000);
        }

        // Refrescar historial de actividad en Perfil si existe (para que aparezca inmediatamente)
        try {
          this.perfilService.refreshHistorial();
        } catch (e) {
          console.warn('No fue posible refrescar historial en PerfilService:', e);
        }
      },
      error: (err) => console.error('Error registrando lectura:', err)
    });

    this.subscriptions.push(sub);
  }

  // MODIFICAR cerrarRecurso para revocar objectURL
cerrarRecurso(): void {
  console.log('🚪 Cerrando modal de recurso');
  
  // Cancelar cualquier operación en curso
  if (this.currentPreviewSub) {
    try { 
      this.currentPreviewSub.unsubscribe();
      console.log('✅ Subscripción cancelada');
    } catch(e) {
      console.error('Error cancelando subscripción:', e);
    }
    this.currentPreviewSub = undefined;
  }

  // Limpiar objectURL
  if (this.previewObjectUrl) {
    try { 
      URL.revokeObjectURL(this.previewObjectUrl);
      console.log('✅ ObjectURL revocado');
    } catch(e) {
      console.error('Error revocando objectURL:', e);
    }
    this.previewObjectUrl = null;
  }

  // Resetear TODOS los estados
  this.mostrandoRecurso = false;
  this.recursoSeleccionado = null;
  this.previewUrl = null;
  this.sanitizedRecursoUrl = null;
  this.mostrarPuntos = false;
  this.puntosGanados = 0;
  this.cargandoVideo = false;
  this.videoError = null;
  this.cargandoRecurso = false;
  
  console.log('Modal cerrado completamente');
}
  // === DESCARGA DE ARCHIVOS === //
  descargarArchivo(): void {
    if (!this.recursoSeleccionado?.url) return;

    const filename = this.obtenerNombreArchivo(this.recursoSeleccionado.url);
    
    const sub = this.bibliotecaService.descargarArchivo(filename).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.recursoSeleccionado?.titulo || filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.mostrarMensaje('Archivo descargado exitosamente', 'success');
      },
      error: (err) => {
        console.error('Error descargando archivo:', err);
        this.mostrarError('Error al descargar el archivo');
      }
    });

    this.subscriptions.push(sub);
  }

  private obtenerNombreArchivo(url: string): string {
    const partes = url.split('/');
    return partes[partes.length - 1];
  }

  // === FUNCIONES AUXILIARES === //
  obtenerIconoTipo(tipo: string): string {
    const tipoConfig = this.tiposDisponibles.find(t => t.key === tipo);
    return tipoConfig?.icono || 'fas fa-file';
  }

  obtenerColorTipo(tipo: string): string {
    const tipoConfig = this.tiposDisponibles.find(t => t.key === tipo);
    return tipoConfig?.color || '#6c757d';
  }

  obtenerColorNivel(nivel?: string): string {
    if (!nivel) return '#6c757d';
    const nivelConfig = this.nivelesDisponibles.find(n => n.key === nivel);
    return nivelConfig?.color || '#6c757d';
  }

  obtenerIdYoutube(url: string): string {
  if (!url) return '';
  
  // Patrones de YouTube
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/,
    /youtube\.com\/watch\?.*v=([^&\s]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return '';
}

  sanitizarUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  cambiarPestana(pestana: 'todos' | 'favoritos' | 'recientes'): void {
    this.pestanaActiva = pestana;
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'info' | 'warning' = 'info'): void {
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
  }

  private mostrarError(mensaje: string): void {
    this.error = mensaje;
    setTimeout(() => {
      this.error = null;
    }, 5000);
  }
}