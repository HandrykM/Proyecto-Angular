// src/app/services/theme.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkTheme = new BehaviorSubject<boolean>(false);
  public isDarkTheme$ = this.isDarkTheme.asObservable();
  
  private readonly STORAGE_KEY = 'user_theme_preference';

  constructor() {
    this.initializeTheme();
    this.listenToSystemThemeChanges();
  }

  /**
   * Inicializa el tema basado en:
   * 1. Preferencia guardada del usuario (prioridad)
   * 2. Preferencia del sistema operativo
   * 3. Modo claro por defecto
   */
  private initializeTheme(): void {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    
    if (savedTheme === 'dark') {
      // Usuario eligió modo oscuro
      this.enableDarkTheme(false);
    } else if (savedTheme === 'light') {
      // Usuario eligió modo claro
      this.enableLightTheme(false);
    } else {
      // Sin preferencia guardada, usar la del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        this.enableDarkTheme(false);
      } else {
        this.enableLightTheme(false);
      }
    }
  }

  /**
   * Escucha cambios en las preferencias de color del sistema
   * Solo aplica si el usuario no ha guardado una preferencia manual
   */
  private listenToSystemThemeChanges(): void {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const savedTheme = localStorage.getItem(this.STORAGE_KEY);
      
      // Solo aplicar cambios del sistema si no hay preferencia manual guardada
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
    // Aplicar clase a body y html
    document.body.classList.add('dark-theme');
    document.documentElement.classList.add('dark-theme');
    
    // Actualizar el observable
    this.isDarkTheme.next(true);
    
    // Guardar preferencia si se solicita
    if (saveToStorage) {
      localStorage.setItem(this.STORAGE_KEY, 'dark');
    }
    
    // Emitir evento personalizado para otros componentes
    window.dispatchEvent(new CustomEvent('theme-changed', { 
      detail: { theme: 'dark' } 
    }));
  }

  /**
   * Activa el modo claro
   * @param saveToStorage - Si se debe guardar la preferencia (default: true)
   */
  public enableLightTheme(saveToStorage: boolean = true): void {
    // Remover clase de body y html
    document.body.classList.remove('dark-theme');
    document.documentElement.classList.remove('dark-theme');
    
    // Actualizar el observable
    this.isDarkTheme.next(false);
    
    // Guardar preferencia si se solicita
    if (saveToStorage) {
      localStorage.setItem(this.STORAGE_KEY, 'light');
    }
    
    // Emitir evento personalizado para otros componentes
    window.dispatchEvent(new CustomEvent('theme-changed', { 
      detail: { theme: 'light' } 
    }));
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

  /**
   * Obtiene el tema actual como string
   */
  public getCurrentTheme(): 'light' | 'dark' {
    return this.isDarkTheme.value ? 'dark' : 'light';
  }

  /**
   * Resetea la preferencia de tema (volverá a usar la preferencia del sistema)
   */
  public resetThemePreference(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.initializeTheme();
  }

  /**
   * Verifica si el sistema prefiere modo oscuro
   */
  public systemPrefersDark(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Sincroniza el tema con el servicio de preferencias
   */
  public syncWithPreferences(modoOscuro: boolean): void {
    this.setTheme(modoOscuro);
  }
}