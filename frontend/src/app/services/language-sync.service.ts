// src/app/services/language-sync.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { I18nService } from './i18n.service';
import { PreferenciasService } from './preferencias.service';

@Injectable({
  providedIn: 'root'
})
export class LanguageSyncService implements OnDestroy {
  private subscriptions: Subscription[] = [];

  constructor(
    private i18nService: I18nService,
    private preferenciasService: PreferenciasService
  ) {
    this.initializeLanguageSync();
  }

  private initializeLanguageSync(): void {
    // 1. Cargar idioma inicial desde preferencias
    this.loadInitialLanguage();

    // 2. Escuchar cambios de idioma desde I18nService
    const i18nSub = this.i18nService.currentLanguage$.subscribe(lang => {
      console.log('🌍 LanguageSync - Idioma cambiado en I18nService:', lang);
      this.syncLanguageToPreferences(lang);
    });
    this.subscriptions.push(i18nSub);

    // 3. Escuchar cambios de preferencias desde PreferenciasService
    const prefSub = this.preferenciasService.preferencias$.subscribe(prefs => {
      if (prefs && prefs.idioma) {
        const currentLang = this.i18nService.getCurrentLanguage();
        if (prefs.idioma !== currentLang) {
          console.log('🌍 LanguageSync - Sincronizando idioma desde preferencias:', prefs.idioma);
          this.i18nService.setLanguage(prefs.idioma as any);
        }
      }
    });
    this.subscriptions.push(prefSub);
  }

  private loadInitialLanguage(): void {
    // Prioridad: 1. localStorage, 2. Preferencias guardadas, 3. Navegador
    const storedLang = localStorage.getItem('app_language');
    
    if (storedLang) {
      this.i18nService.setLanguage(storedLang as any);
      console.log('🌍 LanguageSync - Idioma cargado desde localStorage:', storedLang);
    } else {
      // Intentar obtener de preferencias del servidor
      this.preferenciasService.obtenerPreferencias().subscribe({
        next: (prefs) => {
          if (prefs.idioma) {
            this.i18nService.setLanguage(prefs.idioma as any);
            console.log('🌍 LanguageSync - Idioma cargado desde servidor:', prefs.idioma);
          }
        },
        error: (err) => {
          console.warn('🌍 LanguageSync - No se pudieron cargar preferencias, usando idioma por defecto');
          // Usar idioma del navegador como fallback
          this.detectBrowserLanguage();
        }
      });
    }
  }

  private syncLanguageToPreferences(lang: string): void {
    const preferenciasActuales = this.preferenciasService.obtenerPreferenciasActuales();
    
    if (preferenciasActuales && preferenciasActuales.idioma !== lang) {
      const nuevasPrefs = { ...preferenciasActuales, idioma: lang };
      
      // Guardar en servidor (sin bloquear la UI)
      this.preferenciasService.guardarPreferencias(nuevasPrefs).subscribe({
        next: () => console.log('✅ LanguageSync - Preferencias de idioma guardadas en servidor'),
        error: (err) => console.error('❌ LanguageSync - Error al guardar preferencias:', err)
      });
    }
  }

  private detectBrowserLanguage(): void {
    const browserLang = navigator.language.split('-')[0];
    const supportedLangs = ['es', 'en', 'pt'];
    
    if (supportedLangs.includes(browserLang)) {
      this.i18nService.setLanguage(browserLang as any);
      console.log('🌍 LanguageSync - Idioma del navegador detectado:', browserLang);
    } else {
      this.i18nService.setLanguage('es'); // Default
      console.log('🌍 LanguageSync - Usando idioma por defecto: es');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}