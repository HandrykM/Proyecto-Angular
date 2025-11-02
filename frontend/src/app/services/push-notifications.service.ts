// src/app/services/push-notifications.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface PushNotification {
  titulo: string;
  mensaje: string;
  tipo: 'logro' | 'modulo' | 'certificado' | 'recordatorio';
  icono?: string;
  duracion?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {
  private notificationSubject = new Subject<PushNotification>();
  public notifications$ = this.notificationSubject.asObservable();

  constructor() {}

  /**
   * Mostrar notificación push
   */
  mostrarNotificacion(notificacion: PushNotification): void {
    // Verificar si las notificaciones push están activadas
    const preferencias = this.obtenerPreferencias();
    if (!preferencias?.notificaciones?.push) {
      console.log('❌ Notificaciones push desactivadas');
      return;
    }

    console.log('🔔 Mostrando notificación push:', notificacion.titulo);
    this.notificationSubject.next(notificacion);

    // Reproducir sonido si está disponible
    this.reproducirSonido();

    // Notificación del navegador si tiene permisos
    this.mostrarNotificacionNavegador(notificacion);
  }

  /**
   * Notificar módulo completado
   */
  notificarModuloCompletado(modulo: any): void {
    this.mostrarNotificacion({
      titulo: '🎉 ¡Módulo Completado!',
      mensaje: `Has completado el módulo: ${modulo.titulo}`,
      tipo: 'modulo',
      icono: 'fas fa-graduation-cap',
      duracion: 6000
    });
  }

  /**
   * Notificar logro obtenido
   */
  notificarLogro(logro: any): void {
    const preferencias = this.obtenerPreferencias();
    if (!preferencias?.notificaciones?.logros) {
      return;
    }

    this.mostrarNotificacion({
      titulo: '🏆 ¡Nuevo Logro!',
      mensaje: `Has desbloqueado: ${logro.titulo}`,
      tipo: 'logro',
      icono: logro.icono || 'fas fa-trophy',
      duracion: 8000
    });
  }

  /**
   * Notificar certificado disponible
   */
  notificarCertificado(): void {
    this.mostrarNotificacion({
      titulo: '🎓 ¡Certificado Disponible!',
      mensaje: 'Has completado todos los módulos. Tu certificado está listo.',
      tipo: 'certificado',
      icono: 'fas fa-certificate',
      duracion: 10000
    });
  }

  /**
   * Mostrar recordatorio
   */
  mostrarRecordatorio(mensaje: string): void {
    const preferencias = this.obtenerPreferencias();
    if (!preferencias?.notificaciones?.recordatorios) {
      return;
    }

    this.mostrarNotificacion({
      titulo: '📚 Recordatorio de Estudio',
      mensaje: mensaje,
      tipo: 'recordatorio',
      icono: 'fas fa-book',
      duracion: 8000
    });
  }

  /**
   * Obtener preferencias desde localStorage
   */
  private obtenerPreferencias(): any {
    try {
      const prefs = localStorage.getItem('user_preferences');
      return prefs ? JSON.parse(prefs) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Reproducir sonido de notificación
   */
  private reproducirSonido(): void {
    try {
      const audio = new Audio('assets/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        console.log('No se pudo reproducir el sonido');
      });
    } catch (error) {
      console.warn('Error reproduciendo sonido:', error);
    }
  }

  /**
   * Mostrar notificación del navegador (Web Notifications API)
   */
  private async mostrarNotificacionNavegador(notificacion: PushNotification): Promise<void> {
    if (!('Notification' in window)) {
      return;
    }

    try {
      let permission = Notification.permission;

      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        const notification = new Notification(notificacion.titulo, {
          body: notificacion.mensaje,
          icon: '/assets/images/logo.png',
          badge: '/assets/images/badge.png',
          tag: notificacion.tipo,
          requireInteraction: false
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Auto-cerrar después de la duración
        setTimeout(() => {
          notification.close();
        }, notificacion.duracion || 5000);
      }
    } catch (error) {
      console.warn('Error mostrando notificación del navegador:', error);
    }
  }

  /**
   * Solicitar permisos de notificación
   */
  async solicitarPermisos(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      return false;
    }
  }

  /**
   * Verificar si tiene permisos
   */
  tienePermisos(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }
}