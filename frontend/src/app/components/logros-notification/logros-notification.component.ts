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
    gap: 12px;
  }

  .logro-toast {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: #ffffff;
    padding: 1rem 1.5rem;
    border-radius: 16px;
    box-shadow: 0 8px 25px rgba(0, 150, 200, 0.3);
    animation: slideInRight 0.6s ease;
    min-width: 320px;
    max-width: 400px;
    overflow: hidden;
    position: relative;
  }

  /* efecto de onda en la parte inferior */
  .logro-toast::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, rgba(255,255,255,0.3) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.3) 75%, transparent 75%, transparent);
    background-size: 40px 100%;
    animation: waveMove 2s linear infinite;
    opacity: 0.4;
  }

  .logro-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .logro-icon {
    width: 54px;
    height: 54px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    backdrop-filter: blur(4px);
    box-shadow: inset 0 0 8px rgba(255, 255, 255, 0.2);
  }

  .logro-info {
    flex: 1;
  }

  .logro-info h4 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    opacity: 0.9;
    color: #e8f9ff;
  }

  .logro-info p {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
  }

  .logro-info span {
    font-size: 0.85rem;
    opacity: 0.85;
    color: #d7f6f5;
  }

  .btn-close {
    background: transparent;
    border: none;
    color: #ffffff;
    cursor: pointer;
    padding: 0.5rem;
    opacity: 0.8;
    transition: transform 0.3s, opacity 0.3s;
  }

  .btn-close:hover {
    opacity: 1;
    transform: rotate(90deg);
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

  @keyframes waveMove {
    from { background-position-x: 0; }
    to { background-position-x: 40px; }
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
        // Intentamos reproducir el sonido cada vez que mostramos un logro.
        // La reproducción puede fallar por políticas del navegador (autoplay) o
        // porque el archivo no exista; reproducirSonido maneja y registra errores.
        this.reproducirSonido().catch(err => {
          console.log('reproducirSonido fallo:', err);
        });
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

  async reproducirSonido(): Promise<void> {
    const audioPath = 'assets/sounds/achievement.mp3';
    try {
      // Comprobamos si el recurso existe (HEAD) — si no existe, salimos y lo registramos
      try {
        const head = await fetch(audioPath, { method: 'HEAD' });
        if (!head.ok) {
          console.warn(`Audio de logro no encontrado (HEAD): ${audioPath} -> ${head.status}`);
          return;
        }
      } catch (errHead) {
        // Si fetch HEAD falla por CORS o por servidor, seguimos intentando crear el audio
        console.debug('No se pudo realizar HEAD para el audio, se intentará reproducir de todos modos:', errHead);
      }

      const audio = new Audio(audioPath);
      audio.volume = 0.5;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (error) {
      // Mostrar el error detallado para depuración en consola
      console.warn('No se pudo reproducir el sonido de logro:', error);
      // No rethrow para no romper la UI
    }
  }
}