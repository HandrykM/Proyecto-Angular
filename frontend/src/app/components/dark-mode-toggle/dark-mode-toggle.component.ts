// src/app/components/dark-mode-toggle/dark-mode-toggle.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-dark-mode-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      class="theme-toggle"
      (click)="toggleTheme()"
      [attr.aria-label]="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
      [title]="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
      <i [class]="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
    </button>
  `,
  styles: [`
    .theme-toggle {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--bg-tertiary);
      border: 2px solid var(--border-color);
      color: var(--text-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      font-size: 1.1rem;
    }

    .theme-toggle:hover {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
      transform: scale(1.1) rotate(15deg);
    }

    .theme-toggle:active {
      transform: scale(0.95);
    }

    .theme-toggle i {
      transition: transform 0.3s ease;
    }

    .theme-toggle:hover i {
      transform: rotate(360deg);
    }

    /* Animación de resplandor en modo oscuro */
    .dark-theme .theme-toggle {
      box-shadow: 0 0 10px rgba(76, 201, 240, 0.3);
    }

    /* Responsivo */
    @media (max-width: 768px) {
      .theme-toggle {
        width: 36px;
        height: 36px;
        font-size: 1rem;
      }
    }
  `]
})
export class DarkModeToggleComponent implements OnInit, OnDestroy {
  isDark: boolean = false;
  private subscription?: Subscription;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Suscribirse al estado del tema
    this.subscription = this.themeService.isDarkTheme$.subscribe(
      isDark => this.isDark = isDark
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}