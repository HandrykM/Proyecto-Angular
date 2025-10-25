// src/app/services/theme.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkTheme = new BehaviorSubject<boolean>(false);
  public isDarkTheme$ = this.isDarkTheme.asObservable();

  constructor() {
    // Inicializar tema al cargar el servicio
    this.initializeTheme();
  }

  /**
   * Inicializa el tema basado en:
   * 1. Preferencia guardada del usuario
   * 2. Preferencia del sistema operativo
   */
  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
      this.enableDarkTheme();
    } else if (savedTheme === 'light') {
      this.enableLightTheme();
    } else {
      // Si no hay preferencia guardada, usar la del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        this.enableDarkTheme(false); // false = no guardar en localStorage
      }
    }
    
    // Escuchar cambios en las preferencias del sistema
    this.listenToSystemThemeChanges();
  }

  /**
   * Escucha cambios en las preferencias de color del sistema
   */
  private listenToSystemThemeChanges(): void {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Solo aplicar si no hay preferencia manual guardada
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        if (e.matches) {
          this.enableDarkTheme(false);
        } else {
          this.enableLightTheme(false);
        }
      }
    });
  }

  /**
   * Activa el modo oscuro
   * @param saveToStorage - Si se debe guardar la preferencia (default: true)
   */
  public enableDarkTheme(saveToStorage: boolean = true): void {
    document.body.classList.add('dark-theme');
    document.documentElement.classList.add('dark-theme');
    this.isDarkTheme.next(true);
    
    if (saveToStorage) {
      localStorage.setItem('theme', 'dark');
    }
  }

  /**
   * Activa el modo claro
   * @param saveToStorage - Si se debe guardar la preferencia (default: true)
   */
  public enableLightTheme(saveToStorage: boolean = true): void {
    document.body.classList.remove('dark-theme');
    document.documentElement.classList.remove('dark-theme');
    this.isDarkTheme.next(false);
    
    if (saveToStorage) {
      localStorage.setItem('theme', 'light');
    }
  }

  /**
   * Alterna entre modo claro y oscuro
   */
  public toggleTheme(): void {
    if (this.isDarkTheme.value) {
      this.enableLightTheme();
    } else {
      this.enableDarkTheme();
    }
  }

  /**
   * Obtiene el estado actual del tema
   */
  public isDark(): boolean {
    return this.isDarkTheme.value;
  }

  /**
   * Aplica el tema basado en un booleano
   * @param isDark - true para modo oscuro, false para modo claro
   */
  public setTheme(isDark: boolean): void {
    if (isDark) {
      this.enableDarkTheme();
    } else {
      this.enableLightTheme();
    }
  }
}