import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BibliotecaService } from '../../services/biblioteca.service';
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
  return /\.mp4(\?|$)/i.test(url);
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

  constructor(
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private bibliotecaService: BibliotecaService
  ) {
    const foto = this.authService.getFotoUsuario();
    this.fotoUsuario = foto !== null ? foto : '';
  }

  ngOnInit(): void {
    this.cargarRecursos();
    this.cargarFavoritos();
    this.authService.usuario$.subscribe(usuario => {
      this.usuario = usuario;
    });
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
  this.recursoSeleccionado = recurso;
  this.mostrandoRecurso = true;
  this.cargandoRecurso = true;
  this.puntosGanados = 0;
  this.mostrarPuntos = false;
  // Debug inmediato (mirar consola)
  console.log('abrirRecurso ->', { id: recurso.id, tipo: recurso.tipo, url: recurso.url });

  // Precompute sanitized URL for estudio PDFs to avoid calling sanitizarUrl() in template
  if (recurso.tipo === 'estudio' && recurso.url) {
    try {
      this.sanitizedRecursoUrl = this.sanitizarUrl(recurso.url + '#toolbar=1&navpanes=0&scrollbar=1');
    } catch (e) {
      console.error('Error sanitizing estudio URL:', e);
      this.sanitizedRecursoUrl = null;
    }
  } else {
    this.sanitizedRecursoUrl = null;
  }

    // Registrar lectura y otorgar puntos
    if (this.usuario?.id && !this.esRecursoLeido(recurso.id)) {
    this.registrarLectura(recurso.id);
  }

  // Si el recurso tiene URL y es un archivo que podemos previsualizar, obtener blob
  if (recurso.url && (recurso.tipo === 'infografia' || recurso.tipo === 'guia' || recurso.tipo === 'estudio' || this.isMp4(recurso.url))) {
    this.previsualizarArchivo(recurso);
  } else {
    // Si es video de YouTube u otro embed, no necesitamos descargar
    setTimeout(() => {
      this.cargandoRecurso = false;
      if (recurso.tipo === 'video') this.autoReproducirVideo();
    }, 400);
  }
}

// nueva función: previsualizar archivo (usa descargarArchivo del servicio)
previsualizarArchivo(recurso: Recurso): void {
  if (!recurso?.url) {
    this.cargandoRecurso = false;
    this.previewUrl = null;
    return;
  }

  console.log('previsualizarArchivo: iniciando para', recurso.url);
  this.cargandoRecurso = true;

  // obtener nombre si tu servicio descarga por filename
  const filename = this.obtenerNombreArchivo(recurso.url);

  // cancelar previsualización previa si existe
  if (this.currentPreviewSub) {
    try { this.currentPreviewSub.unsubscribe(); } catch(e) {/*ignore*/}
    this.currentPreviewSub = undefined;
  }

  // Añadir timeout para evitar spinner infinito (10s) y finalize para limpiar
  this.currentPreviewSub = this.bibliotecaService
    .descargarArchivo(filename)
    .pipe(
      timeout(10000), // 10 segundos
      catchError(err => {
        console.error('Error en descarga/previsualización:', err);
        this.mostrarError('No se pudo previsualizar el archivo. Puedes descargarlo.');
        return of(null as unknown as Blob);
      }),
      finalize(() => {
        this.cargandoRecurso = false;
        console.log('previsualizarArchivo: finalize para', recurso.url);
      })
    )
    .subscribe((blob: Blob | null) => {
      console.log('previsualizarArchivo: respuesta recibida para', recurso.url, 'blob=', blob);
      if (!blob) {
        this.previewUrl = null;
        return;
      }

      if (blob.size === 0) {
        console.warn('previsualizarArchivo: blob vacío (size=0) para', recurso.url);
        this.mostrarError('No se pudo previsualizar el archivo (respuesta vacía). Intenta descargarlo.');
        this.previewUrl = null;
        return;
      }

      // Si el blob es demasiado grande, no intentamos renderizar inline
      if (blob.size && blob.size > this.MAX_PREVIEW_SIZE) {
        console.warn(`Blob demasiado grande para previsualizar (${blob.size} bytes)`);
        this.mostrarError('El archivo es demasiado grande para previsualizar. Descárgalo para verlo.');
        this.previewUrl = null;
        return;
      }

      // revocar si existe uno anterior
      if (this.previewObjectUrl) {
        try { URL.revokeObjectURL(this.previewObjectUrl); } catch(e) {/*ignore*/}
        this.previewObjectUrl = null;
        this.previewUrl = null;
      }

      // crear objectURL y sanitizar
      try {
        this.previewObjectUrl = URL.createObjectURL(blob);
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewObjectUrl);
      } catch (e) {
        console.error('Error creando objectURL para previsualizar:', e);
        this.previewUrl = null;
      }

      // Si es video mp4, autoload/play opcional
      if (recurso.tipo === 'video' && this.isMp4(recurso.url)) {
        this.autoReproducirVideo();
      }
    });

  if (this.currentPreviewSub) this.subscriptions.push(this.currentPreviewSub);
}

  private autoReproducirVideo(): void {
    setTimeout(() => {
      const iframe = document.querySelector('.video-container iframe') as HTMLIFrameElement;
      if (iframe && iframe.src) {
        // Agregar autoplay al src si no lo tiene
        if (!iframe.src.includes('autoplay=1')) {
          iframe.src = iframe.src.includes('?') 
            ? iframe.src + '&autoplay=1' 
            : iframe.src + '?autoplay=1';
        }
      }
    }, 100);
  }

  private registrarLectura(idRecurso: number): void {
    if (!this.usuario?.id) return;

    const sub = this.bibliotecaService.registrarLectura(idRecurso, this.usuario.id).subscribe({
      next: (response) => {
        if (!response.yaLeido) {
          this.recursosLeidos.add(idRecurso);
          this.puntosGanados = response.puntosObtenidos || 0;
          
          if (this.puntosGanados > 0) {
            this.mostrarPuntos = true;
            setTimeout(() => {
              this.mostrarPuntos = false;
            }, 5000);
          }
        }
      },
      error: (err) => console.error('Error registrando lectura:', err)
    });

    this.subscriptions.push(sub);
  }

  // MODIFICAR cerrarRecurso para revocar objectURL
cerrarRecurso(): void {
  this.mostrandoRecurso = false;
  this.recursoSeleccionado = null;
  this.mostrarPuntos = false;
  this.puntosGanados = 0;
  // cancelar descarga/previsualización en curso
  if (this.currentPreviewSub) {
    try { this.currentPreviewSub.unsubscribe(); } catch(e) {/*ignore*/}
    this.currentPreviewSub = undefined;
  }

  if (this.previewObjectUrl) {
    try { URL.revokeObjectURL(this.previewObjectUrl); } catch(e){/*ignore*/ }
    this.previewObjectUrl = null;
    this.previewUrl = null;
  }

  // limpiar cualquier URL pre-sanitizada
  this.sanitizedRecursoUrl = null;

  // asegurar estado de carga
  this.cargandoRecurso = false;
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
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const coincidencia = url.match(regex);
    return coincidencia?.[1] || '';
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