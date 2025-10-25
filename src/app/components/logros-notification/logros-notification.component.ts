// src/app/components/logros-notification/logros-notification.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogrosService, LogroNuevo } from '../../services/logros.service';

@Component({
  selector: 'app-logros-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="logros-container">
      <div *ngFor="let logro of logrosActivos" 
           class="logro-toast"
           [@slideIn]>
        <div class="logro-content">
          <div class="logro-icon">
            <i [class]="logro.icono"></i>
          </div>
          <div class="logro-info">
            <h4>🏆 ¡Nuevo Logro!</h4>
            <p><strong>{{ logro.titulo }}</strong></p>
            <span>+{{ logro.puntosRecompensa }} puntos</span>
          </div>
          <button class="btn-close" (click)="cerrarLogro(logro)">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .logros-container {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .logro-toast {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      animation: slideInRight 0.5s ease;
      min-width: 320px;
      max-width: 400px;
    }

    .logro-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logro-icon {
      width: 50px;
      height: 50px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .logro-info {
      flex: 1;
    }

    .logro-info h4 {
      margin: 0 0 0.25rem 0;
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .logro-info p {
      margin: 0 0 0.25rem 0;
      font-size: 1.1rem;
    }

    .logro-info span {
      font-size: 0.85rem;
      opacity: 0.8;
    }

    .btn-close {
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0.5rem;
      opacity: 0.7;
      transition: opacity 0.3s;
    }

    .btn-close:hover {
      opacity: 1;
    }

    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class LogrosNotificationComponent {
  logrosActivos: (LogroNuevo & { timeoutId?: number })[] = [];

  constructor(private logrosService: LogrosService) {
    this.logrosService.logrosObtenidos$.subscribe(logros => {
      this.mostrarLogros(logros);
    });
  }

  mostrarLogros(logros: LogroNuevo[]): void {
    logros.forEach((logro, index) => {
      setTimeout(() => {
        this.agregarLogro(logro);
        this.reproducirSonido();
      }, index * 1000);
    });
  }

  agregarLogro(logro: LogroNuevo): void {
    const logroConTimeout = {
      ...logro,
      timeoutId: window.setTimeout(() => {
        this.cerrarLogro(logroConTimeout);
      }, 5000)
    };

    this.logrosActivos.push(logroConTimeout);
  }

  cerrarLogro(logro: LogroNuevo & { timeoutId?: number }): void {
    if (logro.timeoutId) {
      clearTimeout(logro.timeoutId);
    }
    
    this.logrosActivos = this.logrosActivos.filter(l => l.id !== logro.id);
  }

  reproducirSonido(): void {
    try {
      const audio = new Audio('assets/sounds/achievement.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        console.log('No se pudo reproducir el sonido de logro');
      });
    } catch (error) {
      console.log('Audio no disponible');
    }
  }
}