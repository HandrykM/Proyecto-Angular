// src/app/services/preferencias.service.ts - VERSIÓN MEJORADA
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { I18nService, Language } from './i18n.service';

export interface Preferencias {
  idioma: string;
  modoOscuro: boolean;
  tamanoFuente: 'pequeño' | 'mediano' | 'grande';
  notificaciones: {
    email: boolean;
    sms: boolean;
    push: boolean;
    recordatorios: boolean;
    logros: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PreferenciasService {
  private apiUrl = 'http://localhost:3000/api';
  private preferenciasSubject = new BehaviorSubject<Preferencias | null>(null);
  public preferencias$ = this.preferenciasSubject.asObservable();

  private readonly STORAGE_KEY = 'user_preferences';
  private syncInProgress = false;

  constructor(
    private http: HttpClient,
    private i18nService: I18nService
  ) {
    this.cargarPreferenciasLocales();
    this.detectarPreferenciasNavegador();
    this.sincronizarIdiomaConI18n();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Sincronizar idioma entre PreferenciasService e I18nService
   */
  private sincronizarIdiomaConI18n(): void {
    // Escuchar cambios de idioma desde I18nService
    this.i18nService.currentLanguage$.subscribe(lang => {
      if (this.syncInProgress) return; // Evitar loops infinitos
      
      const preferenciasActuales = this.preferenciasSubject.value;
      if (preferenciasActuales && preferenciasActuales.idioma !== lang) {
        console.log('🔄 PreferenciasService - Sincronizando con I18nService:', lang);
        this.actualizarIdioma(lang);
      }
    });
  }

  /**
   * Cargar preferencias desde localStorage
   */
  private cargarPreferenciasLocales(): void {
    const preferenciasGuardadas = localStorage.getItem(this.STORAGE_KEY);
    if (preferenciasGuardadas) {
      try {
        const preferencias = JSON.parse(preferenciasGuardadas);
        this.preferenciasSubject.next(preferencias);
        this.aplicarPreferencias(preferencias);
        
        // Sincronizar idioma con I18nService
        if (preferencias.idioma) {
          this.syncInProgress = true;
          this.i18nService.setLanguage(preferencias.idioma as Language);
          setTimeout(() => this.syncInProgress = false, 100);
        }
      } catch (error) {
        console.error('Error al parsear preferencias:', error);
      }
    }
  }

  /**
   * Detectar preferencias del navegador
   */
  private detectarPreferenciasNavegador(): void {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      const preferenciasActuales = this.preferenciasSubject.value;
      if (preferenciasActuales && preferenciasActuales.modoOscuro === undefined) {
        this.aplicarModoOscuro(true);
      }
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const preferenciasActuales = this.preferenciasSubject.value;
      if (preferenciasActuales) {
        this.aplicarModoOscuro(e.matches);
      }
    });
  }

  /**
   * Obtener preferencias del servidor
   */
  obtenerPreferencias(): Observable<Preferencias> {
    return this.http.get<Preferencias>(`${this.apiUrl}/preferencias`, {
      headers: this.getHeaders()
    }).pipe(
      tap(preferencias => {
        this.preferenciasSubject.next(preferencias);
        this.guardarPreferenciasLocales(preferencias);
        this.aplicarPreferencias(preferencias);
        
        // Sincronizar idioma
        if (preferencias.idioma) {
          this.syncInProgress = true;
          this.i18nService.setLanguage(preferencias.idioma as Language);
          setTimeout(() => this.syncInProgress = false, 100);
        }
      })
    );
  }

  /**
   * Guardar preferencias en el servidor
   */
  guardarPreferencias(preferencias: Preferencias): Observable<any> {
    return this.http.put(`${this.apiUrl}/preferencias`, preferencias, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        this.preferenciasSubject.next(preferencias);
        this.guardarPreferenciasLocales(preferencias);
        this.aplicarPreferencias(preferencias);
        
        // Sincronizar idioma
        if (preferencias.idioma) {
          this.syncInProgress = true;
          this.i18nService.setLanguage(preferencias.idioma as Language);
          setTimeout(() => this.syncInProgress = false, 100);
        }
      })
    );
  }

  /**
   * Guardar preferencias en localStorage
   */
  private guardarPreferenciasLocales(preferencias: Preferencias): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferencias));
  }

  /**
   * Aplicar preferencias visuales
   */
  private aplicarPreferencias(preferencias: Preferencias): void {
    this.aplicarModoOscuro(preferencias.modoOscuro);
    this.aplicarTamanoFuente(preferencias.tamanoFuente);
    this.aplicarIdioma(preferencias.idioma);
  }

  /**
   * Aplicar modo oscuro
   */
  private aplicarModoOscuro(activo: boolean): void {
    if (activo) {
      document.body.classList.add('dark-theme');
      document.documentElement.style.setProperty('--primary-color', '#4cc9f0');
      document.documentElement.style.setProperty('--card-bg', 'rgba(26, 26, 46, 0.9)');
      document.documentElement.style.setProperty('--light-color', '#2a2a3e');
      document.documentElement.style.setProperty('--dark-color', '#f8f9fa');
    } else {
      document.body.classList.remove('dark-theme');
      document.documentElement.style.setProperty('--primary-color', '#00a8e8');
      document.documentElement.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.9)');
      document.documentElement.style.setProperty('--light-color', '#f8f9fa');
      document.documentElement.style.setProperty('--dark-color', '#1a1a2e');
    }
  }

  /**
   * Aplicar tamaño de fuente
   */
  private aplicarTamanoFuente(tamano: string): void {
    document.documentElement.classList.remove('font-pequeño', 'font-mediano', 'font-grande');
    document.documentElement.classList.add(`font-${tamano}`);

    const tamanos = {
      'pequeño': '14px',
      'mediano': '16px',
      'grande': '18px'
    };

    document.documentElement.style.fontSize = tamanos[tamano as keyof typeof tamanos] || '16px';
  }

  /**
   * Aplicar idioma
   */
  private aplicarIdioma(idioma: string): void {
    document.documentElement.lang = idioma;
    localStorage.setItem('app_language', idioma);
    
    // Sincronizar con I18nService (sin crear loop)
    if (!this.syncInProgress) {
      this.syncInProgress = true;
      this.i18nService.setLanguage(idioma as Language);
      setTimeout(() => this.syncInProgress = false, 100);
    }
  }

  /**
   * Cambiar idioma - MEJORADO con mejor sincronización
   */
  cambiarIdioma(idioma: Language): void {
    console.log('🌍 PreferenciasService - Cambiando idioma a:', idioma);
    
    const preferenciasActuales = this.preferenciasSubject.value;
    if (preferenciasActuales) {
      const nuevasPreferencias = { ...preferenciasActuales, idioma };
      
      // Aplicar inmediatamente en la UI
      this.syncInProgress = true;
      this.i18nService.setLanguage(idioma);
      this.aplicarIdioma(idioma);
      setTimeout(() => this.syncInProgress = false, 100);
      
      // Guardar en el servidor (en segundo plano)
      this.guardarPreferencias(nuevasPreferencias).subscribe({
        next: () => console.log('✅ Idioma guardado en servidor:', idioma),
        error: (error) => {
          console.error('❌ Error al guardar idioma:', error);
          // Revertir si falla
          if (preferenciasActuales.idioma) {
            this.i18nService.setLanguage(preferenciasActuales.idioma as Language);
          }
        }
      });
    } else {
      // Si no hay preferencias, crear nuevas
      const nuevasPreferencias: Preferencias = {
        idioma,
        modoOscuro: false,
        tamanoFuente: 'mediano',
        notificaciones: {
          email: true,
          sms: false,
          push: true,
          recordatorios: true,
          logros: true
        }
      };
      
      this.syncInProgress = true;
      this.i18nService.setLanguage(idioma);
      this.aplicarIdioma(idioma);
      setTimeout(() => this.syncInProgress = false, 100);
      
      this.guardarPreferencias(nuevasPreferencias).subscribe();
    }
  }

  /**
   * Actualizar solo el idioma (interno)
   */
  private actualizarIdioma(idioma: string): void {
    const preferenciasActuales = this.preferenciasSubject.value;
    if (preferenciasActuales) {
      const actualizadas = { ...preferenciasActuales, idioma };
      this.preferenciasSubject.next(actualizadas);
      this.guardarPreferenciasLocales(actualizadas);
    }
  }

  /**
   * Toggle modo oscuro
   */
  toggleModoOscuro(): void {
    const preferenciasActuales = this.preferenciasSubject.value;
    if (preferenciasActuales) {
      const nuevasPreferencias = {
        ...preferenciasActuales,
        modoOscuro: !preferenciasActuales.modoOscuro
      };
      this.guardarPreferencias(nuevasPreferencias).subscribe({
        error: (error) => console.error('Error al cambiar modo oscuro:', error)
      });
    }
  }

  /**
   * Cambiar tamaño de fuente
   */
  cambiarTamanoFuente(tamano: 'pequeño' | 'mediano' | 'grande'): void {
    const preferenciasActuales = this.preferenciasSubject.value;
    if (preferenciasActuales) {
      const nuevasPreferencias = { ...preferenciasActuales, tamanoFuente: tamano };
      this.guardarPreferencias(nuevasPreferencias).subscribe({
        error: (error) => console.error('Error al cambiar tamaño de fuente:', error)
      });
    }
  }

  /**
   * Actualizar preferencias de notificaciones
   */
  actualizarNotificaciones(notificaciones: Partial<Preferencias['notificaciones']>): void {
    const preferenciasActuales = this.preferenciasSubject.value;
    if (preferenciasActuales) {
      const nuevasPreferencias = {
        ...preferenciasActuales,
        notificaciones: { ...preferenciasActuales.notificaciones, ...notificaciones }
      };
      this.guardarPreferencias(nuevasPreferencias).subscribe({
        error: (error) => console.error('Error al actualizar notificaciones:', error)
      });
    }
  }

  /**
   * Obtener preferencias actuales
   */
  obtenerPreferenciasActuales(): Preferencias | null {
    return this.preferenciasSubject.value;
  }

  /**
   * Resetear preferencias a valores por defecto
   */
  resetearPreferencias(): Observable<any> {
    const preferenciasDefecto: Preferencias = {
      idioma: 'es',
      modoOscuro: false,
      tamanoFuente: 'mediano',
      notificaciones: {
        email: true,
        sms: false,
        push: true,
        recordatorios: true,
        logros: true
      }
    };

    return this.guardarPreferencias(preferenciasDefecto);
  }
}