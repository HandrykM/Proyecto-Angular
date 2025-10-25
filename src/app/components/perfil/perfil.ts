// src/app/components/perfil/perfil.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth';
import { PerfilService } from '../../services/perfil';
import { PreferenciasService } from '../../services/preferencias.service';
import { I18nService } from '../../services/i18n.service';
import { LogrosService, Logro } from '../../services/logros.service';
import { Upload } from '../../services/upload';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';
import { TranslatePipe } from '../../pipes/translate.pipe'; // ✅ Corregido
import { 
  Usuario, 
  HistorialSesion, 
  CambioContrasena, 
  CertificadoUsuario,
  ConfiguracionUsuario 
} from '../../interfaces/usuario';
import { Preferencias } from '../../interfaces/preferencias';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css'],
  standalone: true,
  imports: [
  CommonModule,
  NgIf,
  NgForOf,
    RouterModule, 
    FormsModule, 
    ReactiveFormsModule,
    
    TranslatePipe // ✅ Corregido LanguageSelectorComponent,
  ]
})
export class Perfil implements OnInit, OnDestroy {
  @ViewChild('inputFoto') inputFoto!: ElementRef<HTMLInputElement>;

  // Estados principales
  usuario: Usuario | null = null;
  cargando = true;
  error: string | null = null;

  // Sección activa
  seccionActiva: string = 'informacion';

  // Forms
  formInformacion!: FormGroup;
  formContrasena!: FormGroup;
  formConfiguracion!: FormGroup;

  // Estados de UI
  guardando = false;
  subiendoFoto = false;
  mostrandoConfirmacion = false;
  verificandoCertificado = false;
  elegibilidadCertificado: any = null;

  // Datos adicionales
  historialSesiones: HistorialSesion[] = [];
  logros: Logro[] = [];
  certificados: CertificadoUsuario[] = [];
  estadisticas: any = null;
  historialActividad: any[] = [];
  filtroHistorial: string = 'todo';

  // Preview de foto
  previewFoto: string | null = null;
  archivoFoto: File | null = null;

  // Configuración
  idiomas = [
    { codigo: 'es', nombre: 'Español', bandera: '🇪🇸' },
    { codigo: 'en', nombre: 'English', bandera: '🇺🇸' },
    { codigo: 'pt', nombre: 'Português', bandera: '🇵🇹' }
  ];

  tamanosFuente = [
    { valor: 'pequeño', etiqueta: 'Pequeño' },
    { valor: 'mediano', etiqueta: 'Mediano' },
    { valor: 'grande', etiqueta: 'Grande' }
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    private perfilService: PerfilService,
    private uploadService: Upload,
    private authService: AuthService,
    private preferenciasService: PreferenciasService,
    private i18nService: I18nService,
    private logrosService: LogrosService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.inicializarFormularios();
  }

  ngOnInit(): void {
    this.cargarPerfilCompleto();
    this.cargarPreferencias();

    const logrosSub = this.logrosService.logrosObtenidos$.subscribe(logros => {
      if (logros.length > 0) {
        this.cargarLogros();
      }
    });
    this.subscriptions.push(logrosSub);
    
    this.authService.usuario$.subscribe(usuario => {
      this.usuario = usuario as any;
    });

    // Sincronizar cambios de idioma
    const langSub = this.i18nService.currentLanguage$.subscribe(lang => {
      this.actualizarIdiomaFormulario(lang);
    });
    this.subscriptions.push(langSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  esAdmin(): boolean {
    const user = this.authService.getUser();
    return !!user && user.rol === 'admin';
  }

  /**
   * Actualizar idioma en el formulario cuando cambia
   */
  private actualizarIdiomaFormulario(lang: string): void {
    if (this.formConfiguracion) {
      this.formConfiguracion.patchValue({ idioma: lang }, { emitEvent: false });
    }
  }

  private inicializarFormularios(): void {
    this.formInformacion = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      nombreUsuario: ['', [Validators.minLength(3)]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern(/^[+]?[\d\s-()]+$/)]]
    });

    this.formContrasena = this.formBuilder.group({
      contrasenaActual: ['', Validators.required],
      nuevaContrasena: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContrasena: ['', Validators.required]
    }, { validators: this.validadorContrasenas });

    this.formConfiguracion = this.formBuilder.group({
      idioma: ['es'],
      modoOscuro: [false],
      tamanoFuente: ['mediano'],
      notificaciones: this.formBuilder.group({
        email: [true],
        sms: [false],
        push: [true],
        recordatorios: [true],
        logros: [true]
      })
    });

    // Detectar cambios en el idioma del formulario
    this.formConfiguracion.get('idioma')?.valueChanges.subscribe(lang => {
      if (lang && lang !== this.i18nService.getCurrentLanguage()) {
        this.preferenciasService.cambiarIdioma(lang);
      }
    });
  }

  private validadorContrasenas(group: FormGroup) {
    const nueva = group.get('nuevaContrasena')?.value;
    const confirmar = group.get('confirmarContrasena')?.value;
    return nueva === confirmar ? null : { contrasenasNoCoinciden: true };
  }

  private cargarPerfilCompleto(): void {
    this.cargando = true;
    
    const sub = this.perfilService.obtenerPerfilCompleto().subscribe({
      next: (usuario) => {
        this.usuario = usuario;
        this.llenarFormularios(usuario);
        this.cargarDatosAdicionales();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);
        this.error = this.i18nService.translate('messages.errorOccurred');
        this.cargando = false;
      }
    });

    this.subscriptions.push(sub);
  }

  private cargarPreferencias(): void {
    const sub = this.preferenciasService.obtenerPreferencias().subscribe({
      next: (preferencias) => {
        this.formConfiguracion.patchValue(preferencias, { emitEvent: false });
      },
      error: (error) => console.error('Error al cargar preferencias:', error)
    });
    this.subscriptions.push(sub);
  }

  private llenarFormularios(usuario: Usuario): void {
    this.formInformacion.patchValue({
      nombre: usuario.nombre,
      nombreUsuario: usuario.nombreUsuario || '',
      correo: usuario.correo,
      telefono: usuario.telefono || ''
    });

    if (usuario.estadisticas?.puntosTotal) {
      const puntos = parseInt(usuario.estadisticas.puntosTotal.toString());
      if (isNaN(puntos) || puntos < 0) {
        console.warn('Puntos inválidos detectados, reseteando a 0');
        usuario.estadisticas.puntosTotal = 0;
      }
    }
  }

  private cargarDatosAdicionales(): void {
    if (this.seccionActiva === 'seguridad') {
      this.cargarHistorialSesiones();
    } else if (this.seccionActiva === 'logros') {
      this.cargarLogros();
      this.cargarCertificados();
    } else if (this.seccionActiva === 'estadisticas') {
      this.cargarEstadisticas();
    }
  }

  private cargarHistorialSesiones(): void {
    const sub = this.perfilService.obtenerHistorialSesiones().subscribe({
      next: (historial) => this.historialSesiones = historial,
      error: (error) => console.error('Error al cargar historial:', error)
    });
    this.subscriptions.push(sub);
  }

  private cargarLogros(): void {
    const sub = this.logrosService.obtenerLogrosUsuario().subscribe({
      next: (response) => {
        this.logros = response.data.filter(l => l.obtenido);
      },
      error: (error) => console.error('Error al cargar logros:', error)
    });
    this.subscriptions.push(sub);
  }

  private cargarCertificados(): void {
    const sub = this.perfilService.obtenerCertificados().subscribe({
      next: (certificados) => this.certificados = certificados,
      error: (error) => console.error('Error al cargar certificados:', error)
    });
    this.subscriptions.push(sub);
  }

  private cargarEstadisticas(): void {
    const sub = this.perfilService.obtenerEstadisticasDetalladas().subscribe({
      next: (stats) => this.estadisticas = stats,
      error: (error) => console.error('Error al cargar estadísticas:', error)
    });
    this.subscriptions.push(sub);
    
    this.cargarHistorialActividad();
  }

  private cargarHistorialActividad(tipo?: string): void {
    const sub = this.perfilService.obtenerHistorialActividad(50, 0, tipo).subscribe({
      next: (historial) => {
        this.historialActividad = historial;
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        this.historialActividad = [];
      }
    });
    this.subscriptions.push(sub);
  }

  cambiarSeccion(seccion: string): void {
    this.seccionActiva = seccion;
    this.error = null;
    this.cargarDatosAdicionales();
  }

  seleccionarFoto(): void {
    this.inputFoto.nativeElement.click();
  }

  onArchivoSeleccionado(event: any): void {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const validacion = this.uploadService.validarImagen(archivo);
    if (!validacion.valido) {
      this.mostrarError(validacion.error!);
      return;
    }

    this.archivoFoto = archivo;
    this.previewFoto = this.uploadService.crearUrlTemporal(archivo);
  }

  subirFoto(): void {
    if (!this.archivoFoto) return;

    this.subiendoFoto = true;
    
    const sub = this.perfilService.subirFotoPerfil(this.archivoFoto).subscribe({
      next: (response) => {
        if (this.usuario) {
          this.usuario.foto = response.url;
          this.perfilService.actualizarUsuarioLocal(this.usuario);
        }
        this.limpiarPreviewFoto();
        this.mostrarExito(this.i18nService.translate('messages.updateSuccess'));
        this.subiendoFoto = false;
      },
      error: (error) => {
        console.error('Error al subir foto:', error);
        this.mostrarError(this.i18nService.translate('messages.errorOccurred'));
        this.subiendoFoto = false;
      }
    });

    this.subscriptions.push(sub);
  }

  limpiarPreviewFoto(): void {
    if (this.previewFoto) {
      this.uploadService.revocarUrlTemporal(this.previewFoto);
    }
    this.previewFoto = null;
    this.archivoFoto = null;
    this.inputFoto.nativeElement.value = '';
  }

  guardarInformacion(): void {
    if (this.formInformacion.invalid) return;

    this.guardando = true;
    const datos = this.formInformacion.value;

    const sub = this.perfilService.actualizarInformacionPersonal(datos).subscribe({
      next: (usuario) => {
        this.usuario = usuario;
        this.perfilService.actualizarUsuarioLocal(usuario);
        this.mostrarExito(this.i18nService.translate('messages.saveSuccess'));
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error al actualizar información:', error);
        this.mostrarError(this.i18nService.translate('messages.errorOccurred'));
        this.guardando = false;
      }
    });

    this.subscriptions.push(sub);
  }

  cambiarContrasena(): void {
    if (this.formContrasena.invalid) return;

    this.guardando = true;
    const datos: CambioContrasena = this.formContrasena.value;

    const sub = this.perfilService.cambiarContrasena(datos).subscribe({
      next: (response) => {
        this.mostrarExito(response.mensaje);
        this.formContrasena.reset();
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error al cambiar contraseña:', error);
        this.mostrarError(this.i18nService.translate('messages.errorOccurred'));
        this.guardando = false;
      }
    });

    this.subscriptions.push(sub);
  }

  guardarConfiguracion(): void {
    if (this.formConfiguracion.invalid) return;

    this.guardando = true;
    const config: Preferencias = this.formConfiguracion.value;

    const sub = this.preferenciasService.guardarPreferencias(config).subscribe({
      next: () => {
        this.mostrarExito(this.i18nService.translate('messages.saveSuccess'));
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error al guardar configuración:', error);
        this.mostrarError(this.i18nService.translate('messages.errorOccurred'));
        this.guardando = false;
      }
    });

    this.subscriptions.push(sub);
  }

  cerrarSesionRemota(sesionId: number): void {
    const sub = this.perfilService.cerrarSesionRemota(sesionId).subscribe({
      next: (response) => {
        this.mostrarExito(response.mensaje);
        this.cargarHistorialSesiones();
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
        this.mostrarError(this.i18nService.translate('messages.errorOccurred'));
      }
    });

    this.subscriptions.push(sub);
  }

  cerrarSesion(): void {
    const mensaje = this.i18nService.translate('messages.confirmDelete');
    if (confirm(mensaje)) {
      const sub = this.perfilService.cerrarSesion().subscribe({
        next: () => {
          this.perfilService.limpiarDatos();
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Error al cerrar sesión:', error);
          this.perfilService.limpiarDatos();
          this.router.navigate(['/']);
        }
      });

      this.subscriptions.push(sub);
    }
  }

  eliminarCuenta(): void {
    const confirmacion = prompt('Para eliminar tu cuenta, escribe "ELIMINAR" en mayúsculas:');
    
    if (confirmacion === 'ELIMINAR') {
      const sub = this.perfilService.eliminarCuenta(confirmacion).subscribe({
        next: (response) => {
          alert(response.mensaje);
          this.perfilService.limpiarDatos();
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Error al eliminar cuenta:', error);
          this.mostrarError(this.i18nService.translate('messages.errorOccurred'));
        }
      });

      this.subscriptions.push(sub);
    }
  }

  filtrarHistorial(filtro: string): void {
    this.filtroHistorial = filtro;
    const tipoFiltro = filtro !== 'todo' ? filtro : undefined;
    this.cargarHistorialActividad(tipoFiltro);
  }

  obtenerColorTipo(tipo: string): string {
    const colores: {[key: string]: string} = {
      'modulo': '#00a8e8',
      'actividad': '#2ecc71',
      'biblioteca': '#9b59b6',
      'quiz': '#f39c12'
    };
    return colores[tipo] || '#6c757d';
  }

  obtenerIconoTipo(tipo: string): string {
    const iconos: {[key: string]: string} = {
      'modulo': 'fas fa-book',
      'actividad': 'fas fa-gamepad',
      'biblioteca': 'fas fa-bookmark',
      'quiz': 'fas fa-question-circle'
    };
    return iconos[tipo] || 'fas fa-check';
  }

  formatearTipo(tipo: string): string {
    const tipos: {[key: string]: string} = {
      'modulo': 'Módulo',
      'actividad': 'Actividad',
      'biblioteca': 'Biblioteca',
      'quiz': 'Quiz'
    };
    return tipos[tipo] || tipo;
  }

  obtenerErrorCampo(campo: string, formulario: FormGroup): string {
    const control = formulario.get(campo);
    if (!control?.errors || !control.touched) return '';

    const errores = control.errors;
    if (errores['required']) return this.i18nService.translate('messages.errorOccurred');
    if (errores['email']) return 'Email inválido';
    if (errores['minlength']) return `Mínimo ${errores['minlength'].requiredLength} caracteres`;
    if (errores['pattern']) return 'Formato inválido';
    if (errores['contrasenasNoCoinciden']) return 'Las contraseñas no coinciden';

    return 'Campo inválido';
  }

  descargarCertificadoDirecto(url: string): void {
    if (!url) {
      this.mostrarError('URL del certificado no disponible');
      return;
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = `certificado_${Date.now()}.pdf`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  }

  verificarElegibilidadCertificado(): void {
    this.verificandoCertificado = true;
    this.elegibilidadCertificado = null;
    
    const sub = this.perfilService.verificarElegibilidadCertificado().subscribe({
      next: (response) => {
        this.elegibilidadCertificado = response;
        
        if (response.elegible) {
          this.descargarCertificado();
        } else {
          this.mostrarError(`Debes completar todos los módulos. Progreso: ${response.modulosCompletados}/${response.modulosTotal}`);
          this.verificandoCertificado = false;
        }
      },
      error: (error) => {
        console.error('Error al verificar elegibilidad:', error);
        this.mostrarError('Error al verificar elegibilidad para certificado');
        this.verificandoCertificado = false;
      }
    });

    this.subscriptions.push(sub);
  }

  descargarCertificado(): void {
    const sub = this.perfilService.generarCertificado().subscribe({
      next: (response) => {
        if (response.certificado?.url) {
          this.descargarCertificadoDirecto(response.certificado.url);
          this.mostrarExito('Certificado generado y descargado correctamente');
          this.cargarCertificados();
        } else {
          this.mostrarError('URL del certificado no disponible');
        }
        this.verificandoCertificado = false;
      },
      error: (error) => {
        console.error('Error al generar certificado:', error);
        this.mostrarError(error.error?.mensaje || 'Error al generar certificado');
        this.verificandoCertificado = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private mostrarExito(mensaje: string): void {
    alert('✅ ' + mensaje);
  }

  private mostrarError(mensaje: string): void {
    this.error = mensaje;
    setTimeout(() => this.error = null, 5000);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearTiempo(minutos: number): string {
    if (!minutos || minutos < 60) return `${minutos || 0} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  }

  obtenerUrlFotoPerfil(): string {
    if (this.previewFoto) return this.previewFoto;
    if (this.usuario?.foto) return this.usuario.foto;
    return 'assets/images/avatar-default.png';
  }

  formatearNumero(numero: number): string {
    if (!numero || isNaN(numero) || numero < 0) return '0';
    
    if (numero >= 1000000) {
      return (numero / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (numero >= 1000) {
      return (numero / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    
    return numero.toString();
  }
}