// src/app/pages/admin/admin.component.ts
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth';
import { BibliotecaService } from '../../services/biblioteca.service';
import { IconSelectorComponent } from '../../components/icon-selector/icon-selector.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface Lectura {
  titulo: string;
  descripcion: string;
  contenido: string;
  duracion?: string;
}

interface MaterialAdicional {
  titulo: string;
  descripcion: string;
  tipo: 'infografia' | 'guia' | 'video' | 'otro';
  archivo?: File;
  url?: string;
  previsualizacion?: string;
}

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  fecha_registro: string;
  modulos_completados: number;
  actividades_completadas: number;
  puntos_totales: number;
  recursos_leidos: number;
  foto?: string;
}

interface Modulo {
  id: number;
  titulo: string;
  descripcion: string;
  nivel: string;
  orden: number;
  puntos: number;
  activo: boolean;
  usuarios_completados: number;
  icono?: string;
  color?: string;
}

interface Actividad {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: string;
  nivel: string;
  puntos: number;
  activo: boolean;
  usuarios_completaron: number;
  icono?: string;
  color?: string;
  duracion?: string;
  orden?: number;
}

interface Recurso {
  id: number;
  titulo: string;
  descripcion: string;
  autor: string;
  tipo: string;
  url: string;
  nivel: string;
  categoria: string;
  thumbnail?: string;
  duracion?: string;
  puntos?: number;
}

interface EstadisticasGenerales {
  total_usuarios: number;
  total_admins: number;
  total_modulos: number;
  total_actividades: number;
  total_recursos: number;
  total_certificados: number;
  tiempo_total_estudio: number;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule ] //, IconSelectorComponent]
})
export class AdminComponent implements OnInit, AfterViewInit, OnDestroy {
  
  private busquedaSubject = new Subject<string>();

  seccionActiva: string = 'dashboard';
  cargando = false;
  error: string | null = null;
  usuario: any = null;
  fotoUsuario: string | null = null;
  sidebarAbierta: boolean = true;

  // Estados de datos
  usuarios: Usuario[] = [];
  modulos: Modulo[] = [];
  actividades: Actividad[] = [];
  recursos: Recurso[] = [];
  estadisticasGenerales: EstadisticasGenerales | null = null;

  // Paginación
  paginaActual = 1;
  totalPaginas = 1;
  itemsPorPagina = 20;

  // Filtros
  busqueda = '';
  filtroRol = '';
  ordenUsuarios = 'fecha_desc';

  // Modales
  mostrarModalUsuario = false;
  mostrarModalModulo = false;
  mostrarModalActividad = false;
  mostrarModalRecurso = false;
  mostrarOpcionesReset = false;

  // Formularios
  formUsuario!: FormGroup;
  formModulo!: FormGroup;
  formActividad!: FormGroup;
  formRecurso!: FormGroup;

  // Variables adicionales para el formulario de biblioteca:
archivoSeleccionado: File | null = null;
thumbnailSeleccionado: File | null = null;
previsualizacionArchivo: string | null = null;
previsualizacionThumbnail: string | null = null;
subiendoArchivo: boolean = false;

  // Edición
  usuarioEnEdicion: Usuario | null = null;
  moduloEnEdicion: Modulo | null = null;
  actividadEnEdicion: Actividad | null = null;
  recursoEnEdicion: Recurso | null = null;
  usuarioSeleccionadoReset: Usuario | null = null;

  // Módulos mejorados
  lecturasTemporal: Lectura[] = [{ titulo: '', descripcion: '', contenido: '', duracion: '10 min' }];
  materialesSeleccionados: MaterialAdicional[] = [];
  archivosCargando: boolean = false;

  // Colores disponibles para módulos
  coloresPorNivel = {
    'basico': { valor: '#1abc9c', nombre: 'Básico' },
    'intermedio': { valor: '#f39c12', nombre: 'Intermedio' },
    'avanzado': { valor: '#e74c3c', nombre: 'Avanzado' }
  };
  coloresPorNivelArray = Object.values(this.coloresPorNivel);

  private subscriptions: Subscription[] = [];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private bibliotecaService: BibliotecaService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.inicializarFormularios();
  }

  selectArchivoRecurso() {
    document.getElementById('archivoRecurso')?.click();
  }

  selectThumbnailRecurso() {
    document.getElementById('thumbnailRecurso')?.click();
  }

  

   ngOnInit(): void {
  this.verificarAccesoAdmin();
  this.cargarDatosUsuario();
  this.cargarDashboard();
  
  // ✅ Configurar búsqueda automática con debounce
  this.busquedaSubject.pipe(
    debounceTime(500),
    distinctUntilChanged()
  ).subscribe(termino => {
    this.busqueda = termino;
    this.paginaActual = 1;
    this.cargarUsuarios();
  });
}

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
   // this.limpiarRecursos();
  // ✅ Completar subject de búsqueda
  this.busquedaSubject.complete();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
  }

  // ✅ Búsqueda en tiempo real
onBusquedaChange(event: any): void {
  const termino = event.target.value;
  this.busquedaSubject.next(termino);
}

// ✅ Refrescar usuarios
refrescarUsuarios(): void {
  this.mostrarNotificacion({
    mensaje: 'Actualizando lista de usuarios...',
    tipo: 'info',
    duracion: 2000
  });
  
  this.cargarUsuarios();
}

  private mostrarNotificacion(notificacion: any): void {
    // Implementación de notificación visual
    console.log(`[${notificacion.tipo}] ${notificacion.mensaje}`);
  }

  // Actualizar el FormGroup de recurso:
inicializarFormRecurso(): void {
  this.formRecurso = this.formBuilder.group({
    titulo: ['', Validators.required],
    descripcion: [''],
    contenido: [''],
    autor: ['', Validators.required],
    tipo: ['video', Validators.required],
    url: [''],
    thumbnail: [''],
    nivel: ['basico'],
    categoria: [''],
    duracion: [''],
    puntos: [0, [Validators.min(0)]],
    archivoUrl: [''],
    thumbnailUrl: ['']
  });
}

  private inicializarFormularios(): void {
    // Formulario Usuario CON contraseña
    this.formUsuario = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.minLength(6)]],
      telefono: [''],
      nombreUsuario: [''],
      rol: ['usuario', Validators.required]
    });

    this.formModulo = this.formBuilder.group({
      titulo: ['', Validators.required],
      descripcion: ['', Validators.required],
      nivel: ['basico', Validators.required],
      orden: [1, [Validators.required, Validators.min(1)]],
      icono: ['fas fa-book'],
      color: [''],
      puntos: [100, [Validators.min(0)]]
    });

    this.formActividad = this.formBuilder.group({
      titulo: ['', Validators.required],
      descripcion: ['', Validators.required],
      tipo: ['quiz', Validators.required],
      nivel: ['basico', Validators.required],
      puntos: [10, [Validators.min(0)]],
      icono: ['fas fa-gamepad'],
      color: ['#3498db'],
      duracion: ['10-15 min'],
      orden: [1, [Validators.min(1)]]
    });

    this.formRecurso = this.formBuilder.group({
      titulo: ['', Validators.required],
      descripcion: [''],
      autor: ['', Validators.required],
      tipo: ['video', Validators.required],
      url: [''],
      thumbnail: [''],
      nivel: ['basico'],
      categoria: [''],
      duracion: [''],
      puntos: [0, [Validators.min(0)]],
      archivoUrl: [''],
      thumbnailUrl: ['']
    });
  }

  private verificarAccesoAdmin(): void {
    const user = this.authService.getUser();
    if (!user || user.rol !== 'admin') {
      this.router.navigate(['/inicio']);
    }
  }

  private cargarDatosUsuario(): void {
    this.usuario = this.authService.getUser();
    this.fotoUsuario = this.authService.getFotoUsuario();
    if (this.usuario && !this.fotoUsuario) {
      this.fotoUsuario = this.usuario.foto || null;
    }
  }

  toggleSidebar(): void {
    this.sidebarAbierta = !this.sidebarAbierta;
  }

  // Función para manejar selección de archivo
onArchivoSeleccionado(event: any): void {
  const file = event.target.files[0];
  if (file) {
    this.archivoSeleccionado = file;
    
    // Crear previsualización si es imagen
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previsualizacionArchivo = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.previsualizacionArchivo = null;
    }
  }
}

async guardarModulo(): Promise<void> {
  if (this.formModulo.invalid) {
    this.mostrarError('Completa todos los campos');
    return;
  }

  this.archivosCargando = true;

  try {
    // 1. Subir materiales primero
    const materialesConUrl = [];
    for (const material of this.materialesSeleccionados) {
      if (material.archivo) {
        const formData = new FormData();
        formData.append('archivo', material.archivo);
        
        const response = await this.adminService.subirArchivo(formData).toPromise();
        
        // ⬇️ GUARDAR HASH Y SIZE
        materialesConUrl.push({
          titulo: material.titulo,
          descripcion: material.descripcion,
          tipo: material.tipo,
          url: response.data.url,
          filename: response.data.filename,
          hash: response.data.hash,        // ✅ NUEVO
          size: response.data.size,        // ✅ NUEVO
          icono: this.obtenerIconoPorTipo(material.tipo)
        });

        // Mostrar si fue reutilizado
        if (response.reutilizado) {
          console.log(`♻️ Archivo "${material.archivo.name}" ya existía, se reutilizó`);
        }
      } else {
        materialesConUrl.push(material);
      }
    }

    // 2. Luego guardar el módulo con las URLs de los materiales
    const moduloData = {
      titulo: this.formModulo.value.titulo,
      descripcion: this.formModulo.value.descripcion,
      nivel: this.formModulo.value.nivel,
      orden: this.formModulo.value.orden,
      icono: this.formModulo.value.icono,
      color: this.formModulo.value.color,
      puntos: this.formModulo.value.puntos,
      lecturas: this.lecturasTemporal,
      materiales: materialesConUrl
    };

    const operacion = this.moduloEnEdicion
      ? this.adminService.actualizarModulo(this.moduloEnEdicion.id, moduloData)
      : this.adminService.crearModulo(moduloData);

    const response = await operacion.toPromise();
    
    alert('Módulo guardado');
    this.cerrarModalModulo();
    this.cargarModulos();

  } catch (error: any) {
    this.mostrarError('Error: ' + (error.error?.mensaje || error.message));
  } finally {
    this.archivosCargando = false;
  }
}

// Función auxiliar para obtener icono por tipo
private obtenerIconoPorTipo(tipo: string): string {
  const iconos: { [key: string]: string } = {
    'infografia': 'fas fa-image',
    'guia': 'fas fa-file-pdf',
    'video': 'fas fa-video',
    'otro': 'fas fa-file'
  };
  return iconos[tipo] || 'fas fa-file';
}

agregarLectura() {
  this.lecturasTemporal.push({
    titulo: '',
    descripcion: '',
    contenido: '',
    duracion: ''
  });
}

eliminarLectura(index: number) {
  this.lecturasTemporal.splice(index, 1);
}

// ==================== ARCHIVOS Y MATERIALES ====================

onMaterialSeleccionado(event: any, tipo: string) {
  const archivo = (event.target as HTMLInputElement).files?.[0];
  if (!archivo) return;

  const nuevoMaterial: MaterialAdicional = {
    titulo: archivo.name.split('.')[0], // Nombre sin extensión
    descripcion: '', // Iniciar vacío para que el usuario lo complete
    tipo: tipo as 'infografia' | 'guia' | 'video' | 'otro',
    archivo
  };

  this.materialesSeleccionados.push(nuevoMaterial);
  console.log('Material agregado:', nuevoMaterial);
  
  // Limpiar input
  (event.target as HTMLInputElement).value = '';
}

// Función para editar descripción de material
editarDescripcionMaterial(index: number, nuevaDescripcion: string) {
  if (this.materialesSeleccionados[index]) {
    this.materialesSeleccionados[index].descripcion = nuevaDescripcion;
  }
}

// Función para editar título de material
editarTituloMaterial(index: number, nuevoTitulo: string) {
  if (this.materialesSeleccionados[index]) {
    this.materialesSeleccionados[index].titulo = nuevoTitulo;
  }
}



eliminarMaterial(index: number) {
  this.materialesSeleccionados.splice(index, 1);
  console.log('Material eliminado en índice', index);
}



// Función para manejar selección de thumbnail
onThumbnailSeleccionado(event: any): void {
  const file = event.target.files[0];
  if (file) {
    this.thumbnailSeleccionado = file;
    
    // Crear previsualización
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previsualizacionThumbnail = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
}

// Función para subir archivo
async subirArchivoMaterial(): Promise<string | null> {
  if (!this.archivoSeleccionado) return null;
  
  this.subiendoArchivo = true;
  
  try {
    const response = await this.bibliotecaService
      .subirArchivo(this.archivoSeleccionado)
      .toPromise();
    
    this.subiendoArchivo = false;
    return response.data.url;
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    this.subiendoArchivo = false;
    this.mostrarError('Error al subir el archivo');
    return null;
  }
}

// Función para subir thumbnail
async subirThumbnailMaterial(): Promise<string | null> {
  if (!this.thumbnailSeleccionado) return null;
  
  this.subiendoArchivo = true;
  
  try {
    const response = await this.bibliotecaService
      .subirThumbnail(this.thumbnailSeleccionado)
      .toPromise();
    
    this.subiendoArchivo = false;
    return response.data.url;
  } catch (error) {
    console.error('Error subiendo thumbnail:', error);
    this.subiendoArchivo = false;
    this.mostrarError('Error al subir la imagen');
    return null;
  }
}

  cambiarSeccion(seccion: string): void {
    this.seccionActiva = seccion;
    this.error = null;

    switch (seccion) {
      case 'dashboard':
        this.cargarDashboard();
        break;
      case 'usuarios':
        this.cargarUsuarios();
        break;
      case 'modulos':
        this.cargarModulos();
        break;
      case 'actividades':
        this.cargarActividades();
        break;
      case 'biblioteca':
        this.cargarRecursos();
        break;
    }
  }

  // ===== DASHBOARD =====
  private cargarDashboard(): void {
    this.cargando = true;
    const sub = this.adminService.obtenerEstadisticasGenerales().subscribe({
      next: (response) => {
        this.estadisticasGenerales = response.data;
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarError('Error al cargar estadísticas');
        this.cargando = false;
      }
    });
    this.subscriptions.push(sub);
  }

  // ===== USUARIOS =====
  cargarUsuarios(): void {
    this.cargando = true;
    const sub = this.adminService.obtenerUsuarios(
      this.busqueda,
      this.filtroRol,
      this.ordenUsuarios,
      this.itemsPorPagina,
      (this.paginaActual - 1) * this.itemsPorPagina
    ).subscribe({
      next: (response) => {
        this.usuarios = response.data;
        this.totalPaginas = Math.ceil(response.total / this.itemsPorPagina);
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarError('Error al cargar usuarios');
        this.cargando = false;
      }
    });
    this.subscriptions.push(sub);
  }

  abrirModalUsuario(usuario?: Usuario): void {
    if (usuario) {
      this.usuarioEnEdicion = usuario;
      this.formUsuario.patchValue(usuario);
    } else {
      this.usuarioEnEdicion = null;
      this.formUsuario.reset({ rol: 'usuario' });
    }
    this.mostrarModalUsuario = true;
  }

  guardarUsuario(): void {
    if (this.formUsuario.invalid) return;
    this.cargando = true;
    const datos = this.formUsuario.value;
    const operacion = this.usuarioEnEdicion
      ? this.adminService.actualizarUsuario(this.usuarioEnEdicion.id, datos)
      : this.adminService.crearUsuario(datos);

    const sub = operacion.subscribe({
      next: () => {
        alert(this.usuarioEnEdicion ? 'Usuario actualizado' : 'Usuario creado');
        this.cerrarModalUsuario();
        this.cargarUsuarios();
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarError(error.error?.mensaje || 'Error al guardar usuario');
        this.cargando = false;
      }
    });
    this.subscriptions.push(sub);
  }

  eliminarUsuario(usuario: Usuario): void {
    if (!confirm(`¿Eliminar al usuario ${usuario.nombre}?`)) return;
    const sub = this.adminService.eliminarUsuario(usuario.id).subscribe({
      next: () => {
        alert('Usuario eliminado');
        this.cargarUsuarios();
      },
      error: (error) => {
        this.mostrarError('Error al eliminar usuario');
      }
    });
    this.subscriptions.push(sub);
  }

  cambiarRolUsuario(usuario: Usuario): void {
    const nuevoRol = usuario.rol === 'admin' ? 'usuario' : 'admin';
    if (!confirm(`¿Cambiar rol de ${usuario.nombre} a ${nuevoRol}?`)) return;
    const sub = this.adminService.cambiarRol(usuario.id, nuevoRol).subscribe({
      next: () => {
        alert('Rol actualizado');
        this.cargarUsuarios();
      },
      error: (error) => {
        this.mostrarError('Error al cambiar rol');
      }
    });
    this.subscriptions.push(sub);
  }

  resetearPasswordUsuario(usuario: Usuario): void {
    const nuevaPassword = prompt('Nueva contraseña (mínimo 6 caracteres):');
    if (!nuevaPassword || nuevaPassword.length < 6) {
      alert('Contraseña inválida');
      return;
    }
    const sub = this.adminService.resetearPassword(usuario.id, nuevaPassword).subscribe({
      next: () => {
        alert('Contraseña reseteada');
      },
      error: (error) => {
        this.mostrarError('Error al resetear contraseña');
      }
    });
    this.subscriptions.push(sub);
  }

  abrirOpcionesReset(usuario: Usuario): void {
    this.usuarioSeleccionadoReset = usuario;
    this.mostrarOpcionesReset = true;
  }

  // ===== RESET DE PROGRESO DE USUARIOS =====

resetearProgresoModulos(usuarioId: number): void {
  if (!confirm('¿Estás seguro de resetear el progreso de MÓDULOS? Esta acción no se puede deshacer.')) return;
  
  const sub = this.adminService.resetearProgresoModulos(usuarioId).subscribe({
    next: () => {
      alert('Progreso de módulos reseteado exitosamente');
      this.cerrarOpcionesReset();
      this.cargarUsuarios();
    },
    error: (error) => {
      this.mostrarError('Error al resetear progreso de módulos');
    }
  });
  this.subscriptions.push(sub);
}

resetearProgresoActividades(usuarioId: number): void {
  if (!confirm('¿Estás seguro de resetear el progreso de ACTIVIDADES? Esta acción no se puede deshacer.')) return;
  
  const sub = this.adminService.resetearProgresoActividades(usuarioId).subscribe({
    next: () => {
      alert('Progreso de actividades reseteado exitosamente');
      this.cerrarOpcionesReset();
      this.cargarUsuarios();
    },
    error: (error) => {
      this.mostrarError('Error al resetear progreso de actividades');
    }
  });
  this.subscriptions.push(sub);
}

resetearPuntos(usuarioId: number): void {
  if (!confirm('¿Estás seguro de resetear todos los PUNTOS? Esta acción no se puede deshacer.')) return;
  
  const sub = this.adminService.resetearPuntos(usuarioId).subscribe({
    next: () => {
      alert('Puntos reseteados exitosamente');
      this.cerrarOpcionesReset();
      this.cargarUsuarios();
    },
    error: (error) => {
      this.mostrarError('Error al resetear puntos');
    }
  });
  this.subscriptions.push(sub);
}

  cerrarModalUsuario(): void {
    this.mostrarModalUsuario = false;
    this.usuarioEnEdicion = null;
    this.formUsuario.reset({ rol: 'usuario' });
  }

  cerrarOpcionesReset(): void {
    this.mostrarOpcionesReset = false;
    this.usuarioSeleccionadoReset = null;
  }

  // ===== MÓDULOS (MEJORADO) =====
  cargarModulos(): void {
    this.cargando = true;
    const sub = this.adminService.obtenerModulos().subscribe({
      next: (response) => {
        this.modulos = response.data;
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarError('Error al cargar módulos');
        this.cargando = false;
      }
    });
    this.subscriptions.push(sub);
  }

  abrirModalModulo(modulo?: Modulo): void {
  if (modulo) {
    // EDICIÓN: Cargar módulo completo desde el servidor
    this.cargando = true;
    
    const sub = this.adminService.obtenerModuloCompleto(modulo.id).subscribe({
      next: (response) => {
        const moduloCompleto = response.data;
        
        this.moduloEnEdicion = moduloCompleto;
        this.formModulo.patchValue({
          titulo: moduloCompleto.titulo,
          descripcion: moduloCompleto.descripcion,
          nivel: moduloCompleto.nivel,
          orden: moduloCompleto.orden,
          icono: moduloCompleto.icono,
          color: moduloCompleto.color,
          puntos: moduloCompleto.puntos
        });
        
        // Cargar lecturas
        this.lecturasTemporal = moduloCompleto.lecturas && moduloCompleto.lecturas.length > 0
          ? moduloCompleto.lecturas.map((l: any) => ({
              titulo: l.titulo,
              descripcion: l.descripcion || '',
              contenido: l.contenido,
              duracion: l.duracion || '10 min'
            }))
          : [{ titulo: '', descripcion: '', contenido: '', duracion: '10 min' }];
        
        // Cargar materiales
        this.materialesSeleccionados = moduloCompleto.materialesAdicionales && moduloCompleto.materialesAdicionales.length > 0
          ? moduloCompleto.materialesAdicionales.map((m: any) => ({
              titulo: m.titulo,
              descripcion: m.descripcion,
              tipo: m.tipo,
              url: m.url,
              filename: m.filename,
              archivo: null // No hay archivo porque ya está subido
            }))
          : [];
        
        this.cargando = false;
        this.mostrarModalModulo = true;
      },
      error: (error) => {
        console.error('❌ Error cargando módulo completo:', error);
        this.mostrarError('Error al cargar el módulo');
        this.cargando = false;
      }
    });
    
    this.subscriptions.push(sub);
    
  } else {
    // NUEVO MÓDULO
    this.moduloEnEdicion = null;
    this.formModulo.reset({
      nivel: 'basico',
      icono: 'fas fa-book',
      color: '#1abc9c',
      puntos: 100,
      orden: 1
    });
    this.lecturasTemporal = [{ titulo: '', descripcion: '', contenido: '', duracion: '10 min' }];
    this.materialesSeleccionados = [];
    this.mostrarModalModulo = true;
  }
}

  private subirMaterial(archivo: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('archivo', archivo);

      const sub = this.adminService.subirArchivo(formData).subscribe({
        next: (response: any) => {
          resolve(response.data.url);
        },
        error: (error) => {
          reject(error);
        }
      });
      this.subscriptions.push(sub);
    });
  }

  toggleActivoModulo(modulo: Modulo): void {
    const sub = this.adminService.toggleActivoModulo(modulo.id).subscribe({
      next: () => {
        alert(`Módulo ${modulo.activo ? 'desactivado' : 'activado'}`);
        this.cargarModulos();
      },
      error: (err) => {
        this.mostrarError('Error actualizando módulo');
      }
    });
    this.subscriptions.push(sub);
  }

  eliminarModulo(modulo: Modulo): void {
  if (!confirm(`¿Estás seguro de que quieres ELIMINAR COMPLETAMENTE el módulo "${modulo.titulo}"?\n\nEsta acción:\n- Eliminará todas las lecturas\n- Eliminará todos los materiales\n- Eliminará el progreso de los usuarios\n- NO se puede deshacer`)) {
    return;
  }
  
  const sub = this.adminService.eliminarModulo(modulo.id).subscribe({
    next: () => {
      alert('Módulo eliminado completamente');
      this.cargarModulos();
    },
    error: (err) => {
      console.error('❌ Error eliminando módulo:', err);
      this.mostrarError('Error al eliminar módulo');
    }
  });
  this.subscriptions.push(sub);
}

// En admin.component.ts - Método para toggle activo/inactivo de actividad

toggleActivoActividad(actividad: Actividad): void {
  const accion = actividad.activo ? 'desactivar' : 'activar';
  
  if (!confirm(`¿Estás seguro de ${accion} la actividad "${actividad.titulo}"?\n\n${
    actividad.activo 
      ? 'Los usuarios ya NO podrán verla ni acceder a ella.' 
      : 'Los usuarios PODRÁN verla y acceder a ella nuevamente.'
  }`)) {
    return;
  }

  this.cargando = true;
  
  const sub = this.adminService.toggleActivoActividad(actividad.id).subscribe({
    next: () => {
      alert(`Actividad ${actividad.activo ? 'desactivada' : 'activada'} exitosamente`);
      this.cargarActividades(); // Recargar la lista
      this.cargando = false;
    },
    error: (error) => {
      console.error('Error al cambiar estado de actividad:', error);
      this.mostrarError('Error al cambiar el estado de la actividad');
      this.cargando = false;
    }
  });
  
  this.subscriptions.push(sub);
}

  cerrarModalModulo(): void {
    this.mostrarModalModulo = false;
    this.moduloEnEdicion = null;
    this.formModulo.reset();
    this.lecturasTemporal = [{ titulo: '', descripcion: '', contenido: '', duracion: '10 min' }];
    this.materialesSeleccionados = [];
  }

  // ===== ACTIVIDADES =====
  cargarActividades(): void {
    this.cargando = true;
    const sub = this.adminService.obtenerActividades().subscribe({
      next: (response) => {
        this.actividades = response.data;
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarError('Error al cargar actividades');
        this.cargando = false;
      }
    });
    this.subscriptions.push(sub);
  }

  abrirModalActividad(actividad?: Actividad): void {
    if (actividad) {
      this.actividadEnEdicion = actividad;
      this.formActividad.patchValue(actividad);
    } else {
      this.actividadEnEdicion = null;
      this.formActividad.reset({
        tipo: 'quiz',
        nivel: 'basico',
        puntos: 10,
        icono: 'fas fa-gamepad',
        color: '#3498db',
        orden: 1
      });
    }
    this.mostrarModalActividad = true;
  }

  private mostrarExito(mensaje: string): void {
    alert('✅ ' + mensaje);
  }

  guardarActividad(): void {
    if (this.formActividad.invalid) return;
    this.cargando = true;
    const datos = this.formActividad.value;
    const operacion = this.actividadEnEdicion
      ? this.adminService.actualizarActividad(this.actividadEnEdicion.id, datos)
      : this.adminService.crearActividad(datos);

    const sub = operacion.subscribe({
      next: () => {
        alert(this.actividadEnEdicion ? 'Actividad actualizada' : 'Actividad creada');
        this.cerrarModalActividad();
        this.cargarActividades();
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarError(error.error?.mensaje || 'Error al guardar actividad');
        this.cargando = false;
      }
    });
    this.subscriptions.push(sub);
  }

  eliminarActividad(actividad: Actividad): void {
    if (!confirm(`¿Eliminar la actividad "${actividad.titulo}"?`)) return;
    const sub = this.adminService.eliminarActividad(actividad.id).subscribe({
      next: () => {
        alert('Actividad eliminada');
        this.cargarActividades();
      },
      error: (err) => {
        this.mostrarError('Error al eliminar actividad');
      }
    });
    this.subscriptions.push(sub);
  }

  cerrarModalActividad(): void {
    this.mostrarModalActividad = false;
    this.actividadEnEdicion = null;
    this.formActividad.reset();
  }

  // ===== BIBLIOTECA =====
  cargarRecursos(): void {
    this.cargando = true;
    const sub = this.adminService.obtenerRecursosBiblioteca().subscribe({
      next: (response) => {
        this.recursos = response.data;
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarError('Error al cargar recursos');
        this.cargando = false;
      }
    });
    this.subscriptions.push(sub);
  }

  abrirModalRecurso(recurso?: Recurso): void {
  if (recurso) {
    this.recursoEnEdicion = recurso;
    this.formRecurso.patchValue(recurso);
  } else {
    this.recursoEnEdicion = null;
    this.formRecurso.reset({ 
      tipo: 'video', 
      nivel: 'basico', 
      puntos: 0 
    });
  }
  
  // Limpiar archivos seleccionados
  this.archivoSeleccionado = null;
  this.thumbnailSeleccionado = null;
  this.previsualizacionArchivo = null;
  this.previsualizacionThumbnail = null;
  
  this.mostrarModalRecurso = true;
}

  async guardarRecurso(): Promise<void> {
  if (this.formRecurso.invalid) {
    this.mostrarError('Por favor completa todos los campos requeridos');
    return;
  }

  this.cargando = true;

  try {
    // Subir archivo si fue seleccionado
    let archivoUrl = this.formRecurso.value.url;
    if (this.archivoSeleccionado) {
      archivoUrl = await this.subirArchivoMaterial();
      if (!archivoUrl) {
        this.cargando = false;
        return;
      }
    }

    // Subir thumbnail si fue seleccionado
    let thumbnailUrl = this.formRecurso.value.thumbnail;
    if (this.thumbnailSeleccionado) {
      thumbnailUrl = await this.subirThumbnailMaterial();
      if (!thumbnailUrl) {
        this.cargando = false;
        return;
      }
    }

    // Preparar datos
    const datos = {
      ...this.formRecurso.value,
      ...(archivoUrl && { archivoUrl }),
      ...(thumbnailUrl && { thumbnailUrl })
    };

    

    // Crear o actualizar
    const operacion = this.recursoEnEdicion
      ? this.adminService.actualizarRecursoBiblioteca(this.recursoEnEdicion.id, datos)
      : this.adminService.crearRecursoBiblioteca(datos);

    const sub = operacion.subscribe({
      next: () => {
        this.mostrarExito(
          this.recursoEnEdicion 
            ? 'Recurso actualizado exitosamente' 
            : 'Recurso creado exitosamente'
        );
        this.cerrarModalRecurso();
        this.cargarRecursos();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error guardando recurso:', error);
        this.mostrarError(error.error?.mensaje || 'Error al guardar recurso');
        this.cargando = false;
      }
    });

    this.subscriptions.push(sub);
  } catch (error) {
    console.error('Error en guardarRecursoActualizado:', error);
    this.mostrarError('Error al procesar el recurso');
    this.cargando = false;
  }
}

  eliminarRecurso(recurso: Recurso): void {
    if (!confirm(`¿Eliminar el recurso "${recurso.titulo}"?`)) return;
    const sub = this.adminService.eliminarRecursoBiblioteca(recurso.id).subscribe({
      next: () => {
        alert('Recurso eliminado');
        this.cargarRecursos();
      },
      error: (error) => {
        this.mostrarError('Error al eliminar recurso');
      }
    });
    this.subscriptions.push(sub);
  }

  cerrarModalRecurso(): void {
    this.mostrarModalRecurso = false;
  this.recursoEnEdicion = null;
  this.archivoSeleccionado = null;
  this.thumbnailSeleccionado = null;
  this.previsualizacionArchivo = null;
  this.previsualizacionThumbnail = null;
  this.formRecurso.reset();
}

  // ===== UTILIDADES =====
  aplicarFiltros(): void {
    this.paginaActual = 1;
    this.cargarUsuarios();
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
    this.cargarUsuarios();
  }

  abrirInputArchivo(inputId: string): void {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) input.click();
  }

  private mostrarError(mensaje: string): void {
    this.error = mensaje;
    setTimeout(() => this.error = null, 5000);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  obtenerColorNivel(nivel: string): string {
    const colores: { [key: string]: string } = {
      'basico': '#2ecc71',
      'intermedio': '#f39c12',
      'avanzado': '#e74c3c'
    };
    return colores[nivel] || '#6c757d';
  }

  obtenerColorRol(rol: string): string {
    return rol === 'admin' ? '#e74c3c' : '#3498db';
  }
}