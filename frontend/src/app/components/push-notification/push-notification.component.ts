// src/app/components/push-notification/push-notification.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PushNotificationsService, PushNotification } from '../../services/push-notifications.service';

@Component({
  selector: 'app-push-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <div 
        *ngFor="let notif of notificaciones; let i = index"
        class="push-notification"
        [class.notification-logro]="notif.tipo === 'logro'"
        [class.notification-modulo]="notif.tipo === 'modulo'"
        [class.notification-certificado]="notif.tipo === 'certificado'"
        [class.notification-recordatorio]="notif.tipo === 'recordatorio'"
        [@slideIn]
      >
        <div class="notification-icon">
          <i [class]="notif.icono || 'fas fa-bell'"></i>
        </div>
        <div class="notification-content">
          <h4 class="notification-title">{{ notif.titulo }}</h4>
          <p class="notification-message">{{ notif.mensaje }}</p>
        </div>
        <button class="notification-close" (click)="cerrarNotificacion(i)">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    }

    .push-notification {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 1rem;
      animation: slideIn 0.3s ease-out;
      border-left: 4px solid #00a8e8;
    }

    .notification-logro {
      border-left-color: #FFD700;
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), white);
    }

    .notification-modulo {
      border-left-color: #2ecc71;
      background: linear-gradient(135deg, rgba(46, 204, 113, 0.1), white);
    }

    .notification-certificado {
      border-left-color: #9b59b6;
      background: linear-gradient(135deg, rgba(155, 89, 182, 0.1), white);
    }

    .notification-recordatorio {
      border-left-color: #3498db;
      background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), white);
    }

    .notification-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .notification-logro .notification-icon {
      background: linear-gradient(135deg, #FFD700, #FFA500);
      color: white;
    }

    .notification-modulo .notification-icon {
      background: linear-gradient(135deg, #2ecc71, #27ae60);
      color: white;
    }

    .notification-certificado .notification-icon {
      background: linear-gradient(135deg, #9b59b6, #8e44ad);
      color: white;
    }

    .notification-recordatorio .notification-icon {
      background: linear-gradient(135deg, #3498db, #2980b9);
      color: white;
    }

    .notification-content {
      flex: 1;
    }

    .notification-title {
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .notification-message {
      margin: 0;
      font-size: 0.9rem;
      color: #7f8c8d;
      line-height: 1.4;
    }

    .notification-close {
      background: transparent;
      border: none;
      color: #95a5a6;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: all 0.2s;
      align-self: flex-start;
    }

    .notification-close:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #7f8c8d;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    @media (max-width: 768px) {
      .notifications-container {
        top: 60px;
        right: 10px;
        left: 10px;
        max-width: none;
      }
    }
  `]
})
export class PushNotificationComponent implements OnInit, OnDestroy {
  notificaciones: PushNotification[] = [];
  private subscription?: Subscription;

  constructor(private pushService: PushNotificationsService) {}

  ngOnInit(): void {
    this.subscription = this.pushService.notifications$.subscribe(notif => {
      this.mostrarNotificacion(notif);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private mostrarNotificacion(notificacion: PushNotification): void {
    this.notificaciones.push(notificacion);

    // Auto-remover después de la duración
    const duracion = notificacion.duracion || 5000;
    setTimeout(() => {
      const index = this.notificaciones.indexOf(notificacion);
      if (index !== -1) {
        this.cerrarNotificacion(index);
      }
    }, duracion);
  }

  cerrarNotificacion(index: number): void {
    this.notificaciones.splice(index, 1);
  }
}