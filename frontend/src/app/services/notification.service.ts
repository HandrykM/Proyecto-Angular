// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { PreferenciasService } from './preferencias.service';
import { environment } from '../environments/environment';

export interface Notification {
  id: string;
  type: 'logro' | 'modulo' | 'certificado' | 'recordatorio' | 'actividad';
  title: string;
  message: string;
  icon?: string;
  date: Date;
  read: boolean;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.apiUrl; // ✅ Usa environment
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private preferencias: PreferenciasService
  ) {
    this.loadNotifications();
  }

  /**
   * Mostrar notificación (verifica preferencias)
   */
  async showNotification(notification: Omit<Notification, 'id' | 'date' | 'read'>): Promise<void> {
    const prefs = this.preferencias.obtenerPreferenciasActuales();
    
    if (!prefs?.notificaciones) return;

    const fullNotification: Notification = {
      ...notification,
      id: this.generateId(),
      date: new Date(),
      read: false,
      duration: notification.duration || 5000
    };

    // Agregar a la lista local
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([fullNotification, ...current]);
    this.updateUnreadCount();

    // Notificación in-app (Push)
    if (prefs.notificaciones.push) {
      this.showInAppNotification(fullNotification);
    }

    // Notificación del navegador
    if (prefs.notificaciones.push && 'Notification' in window) {
      await this.showBrowserNotification(fullNotification);
    }

    // Notificación por email (backend)
    if (prefs.notificaciones.email && this.shouldSendEmail(notification.type)) {
      this.sendEmailNotification(fullNotification);
    }

    // Notificación por SMS (backend)
    if (prefs.notificaciones.sms && this.shouldSendSMS(notification.type)) {
      this.sendSMSNotification(fullNotification);
    }

    // Guardar en localStorage
    this.saveNotifications();
  }

  /**
   * Mostrar notificación in-app
   */
  private showInAppNotification(notification: Notification): void {
    // El componente PushNotificationComponent se suscribe automáticamente
    console.log('📱 Mostrando notificación in-app:', notification.title);
  }

  /**
   * Mostrar notificación del navegador
   */
  private async showBrowserNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window)) return;

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      const browserNotif = new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/images/logo.png',
        badge: '/assets/images/badge.png',
        tag: notification.type,
        requireInteraction: false
      });

      browserNotif.onclick = () => {
        window.focus();
        this.markAsRead(notification.id);
        browserNotif.close();
      };

      setTimeout(() => browserNotif.close(), notification.duration || 5000);
    }
  }

  /**
   * Enviar notificación por email
   */
  private sendEmailNotification(notification: Notification): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.http.post(`${this.apiUrl}/notificaciones/email`, {
      type: notification.type,
      title: notification.title,
      message: notification.message
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: () => console.log('✅ Email enviado correctamente'),
      error: (err) => console.error('❌ Error al enviar email:', err)
    });
  }

  /**
   * Enviar notificación por SMS
   */
  private sendSMSNotification(notification: Notification): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.http.post(`${this.apiUrl}/notificaciones/sms`, {
      type: notification.type,
      message: `${notification.title}: ${notification.message}`
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: () => console.log('✅ SMS enviado correctamente'),
      error: (err) => console.error('❌ Error al enviar SMS:', err)
    });
  }

  /**
   * Verificar si debe enviar email según tipo
   */
  private shouldSendEmail(type: string): boolean {
    const prefs = this.preferencias.obtenerPreferenciasActuales();
    if (!prefs?.notificaciones) return false;

    switch (type) {
      case 'logro':
        return prefs.notificaciones.logros;
      case 'recordatorio':
        return prefs.notificaciones.recordatorios;
      default:
        return true;
    }
  }

  /**
   * Verificar si debe enviar SMS según tipo
   */
  private shouldSendSMS(type: string): boolean {
    // SMS solo para notificaciones importantes
    return ['certificado', 'logro'].includes(type);
  }

  /**
   * Notificaciones específicas
   */
  notifyAchievement(logro: any): void {
    this.showNotification({
      type: 'logro',
      title: '🏆 ¡Nuevo Logro!',
      message: `Has desbloqueado: ${logro.titulo}`,
      icon: logro.icono || 'fas fa-trophy',
      duration: 8000
    });
  }

  notifyModuleCompleted(modulo: any): void {
    this.showNotification({
      type: 'modulo',
      title: '🎉 ¡Módulo Completado!',
      message: `Has completado: ${modulo.titulo}`,
      icon: 'fas fa-graduation-cap',
      duration: 6000
    });
  }

  notifyCertificateAvailable(): void {
    this.showNotification({
      type: 'certificado',
      title: '🎓 ¡Certificado Disponible!',
      message: 'Tu certificado está listo para descargar',
      icon: 'fas fa-certificate',
      duration: 10000
    });
  }

  notifyReminder(message: string): void {
    this.showNotification({
      type: 'recordatorio',
      title: '📚 Recordatorio de Estudio',
      message,
      icon: 'fas fa-book',
      duration: 8000
    });
  }

  /**
   * Marcar como leída
   */
  markAsRead(id: string): void {
    const notifications = this.notificationsSubject.value;
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(updated);
    this.updateUnreadCount();
    this.saveNotifications();
  }

  /**
   * Marcar todas como leídas
   */
  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value;
    const updated = notifications.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(updated);
    this.updateUnreadCount();
    this.saveNotifications();
  }

  /**
   * Eliminar notificación
   */
  deleteNotification(id: string): void {
    const notifications = this.notificationsSubject.value;
    const filtered = notifications.filter(n => n.id !== id);
    this.notificationsSubject.next(filtered);
    this.updateUnreadCount();
    this.saveNotifications();
  }

  /**
   * Limpiar todas las notificaciones
   */
  clearAll(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
    localStorage.removeItem('app_notifications');
  }

  /**
   * Cargar notificaciones desde localStorage
   */
  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem('app_notifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount();
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  }

  /**
   * Guardar notificaciones en localStorage
   */
  private saveNotifications(): void {
    try {
      const notifications = this.notificationsSubject.value;
      localStorage.setItem('app_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error al guardar notificaciones:', error);
    }
  }

  /**
   * Actualizar contador de no leídas
   */
  private updateUnreadCount(): void {
    const count = this.notificationsSubject.value.filter(n => !n.read).length;
    this.unreadCountSubject.next(count);
  }

  /**
   * Generar ID único
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}