// src/app/app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DomTranslatorService } from './services/dom-translator.service';
import { LanguageSyncService } from './services/language-sync.service';
import { ThemeService } from './services/theme.service';
import { LogrosNotificationComponent } from './components/logros-notification/logros-notification.component';
import { PushNotificationComponent } from './components/push-notification/push-notification.component';
import { PushNotificationsService } from './services/push-notifications.service';
import { RecordatoriosService } from './services/recordatorios.service';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    LogrosNotificationComponent,
    PushNotificationComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit, OnDestroy {
  title = 'hydrosave';

  constructor(
    private languageSyncService: LanguageSyncService,
    private domTranslator: DomTranslatorService,
    private themeService: ThemeService,
    private pushService: PushNotificationsService,
    private recordatoriosService: RecordatoriosService,
    private authService: AuthService
  ) {
    console.log('🚀 AppComponent - Inicializando...');
    
    // ✅ El tema se inicializa automáticamente en el constructor del ThemeService
  }

  ngOnInit(): void {
    // Inicializar traductor del DOM
    this.domTranslator.init();
    
    // Log del idioma actual
    console.log('🌍 AppComponent - Sistema de traducciones inicializado');
    console.log(`🎨 AppComponent - Tema actual: ${this.themeService.getCurrentTheme()}`);
    
    // Inicializar sistema de notificaciones
    this.inicializarSistemaNotificaciones();
    
    // Actualizar título de la página
    this.updatePageTitle('es');

    // ✅ Suscribirse a cambios de tema para debugging
    this.themeService.isDarkTheme$.subscribe(isDark => {
      console.log(`🎨 Tema cambiado a: ${isDark ? 'oscuro' : 'claro'}`);
    });
  }

  ngOnDestroy(): void {
    this.recordatoriosService.detener();
  }

  /**
   * ✅ INICIALIZAR SISTEMA COMPLETO DE NOTIFICACIONES
   */
  private async inicializarSistemaNotificaciones(): Promise<void> {
    console.log('🔔 Inicializando sistema de notificaciones...');

    this.authService.isAuthenticated$.subscribe(async (isAuth: boolean) => {
      if (isAuth) {
        console.log('✅ Usuario autenticado, activando notificaciones');

        const tienePermisos = await this.solicitarPermisosNotificacion();
        if (tienePermisos) console.log('✅ Permisos de notificación concedidos');

        this.iniciarSistemaRecordatorios();
        this.registrarActividadInicial();
        this.verificarNotificacionesPendientes();
      } else {
        console.log('❌ Usuario no autenticado, notificaciones desactivadas');
        this.recordatoriosService.detener();
      }
    });
  }

  /**
   * Solicitar permisos de notificación del navegador
   */
  private async solicitarPermisosNotificacion(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.log('⚠️ Este navegador no soporta notificaciones');
        return false;
      }

      if (Notification.permission === 'granted') {
        console.log('✅ Ya tiene permisos de notificación');
        return true;
      }

      if (Notification.permission === 'denied') {
        console.log('❌ Permisos de notificación denegados previamente');
        return false;
      }

      const permission = await this.pushService.solicitarPermisos();
      return permission;

    } catch (error) {
      console.error('Error solicitando permisos de notificación:', error);
      return false;
    }
  }

  /**
   * Iniciar sistema de recordatorios
   */
  private iniciarSistemaRecordatorios(): void {
    try {
      this.recordatoriosService.iniciar();
      console.log('✅ Sistema de recordatorios iniciado');
    } catch (error) {
      console.error('❌ Error iniciando sistema de recordatorios:', error);
    }
  }

  /**
   * Registrar actividad inicial del usuario
   */
  private registrarActividadInicial(): void {
    try {
      this.recordatoriosService.registrarActividad();
      console.log('✅ Actividad inicial registrada');
    } catch (error) {
      console.error('Error registrando actividad inicial:', error);
    }
  }

  /**
   * Verificar si hay notificaciones pendientes
   */
  private verificarNotificacionesPendientes(): void {
    const esPrimeraVez = !localStorage.getItem('primera_visita');
    if (esPrimeraVez) {
      setTimeout(() => {
        this.pushService.mostrarNotificacion({
          titulo: '¡Bienvenido a HydroSave! 💧',
          mensaje: 'Comienza tu aprendizaje sobre la reutilización del agua',
          tipo: 'recordatorio',
          icono: 'fas fa-water',
          duracion: 8000
        });
        localStorage.setItem('primera_visita', 'true');
      }, 3000);
    }
  }

  /**
   * Actualizar título de la página según el idioma
   */
  private updatePageTitle(lang: string): void {
    const titles: {[key: string]: string} = {
      es: 'HydroSave - Plataforma de Aprendizaje',
      en: 'HydroSave - Learning Platform',
      pt: 'HydroSave - Plataforma de Aprendizagem'
    };
    
    document.title = titles[lang] || titles['es'];
  }
}