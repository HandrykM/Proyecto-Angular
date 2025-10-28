// app.config.ts
import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';  // 👈 aquí
//import { I18nService } from './services/i18n.service';
import { LanguageSyncService } from './services/language-sync.service';
import { routes } from './app.routes';

// Factory para inicializar el idioma antes de que la app cargue
export function initializeLanguage(
  //i18nService: I18nService,
  languageSync: LanguageSyncService
): () => Promise<void> {
  return () => {
    return new Promise((resolve) => {
      // Cargar idioma desde localStorage o navegador
      const storedLang = localStorage.getItem('app_language');
      
      if (storedLang && ['es', 'en', 'pt'].includes(storedLang)) {
        //i18nService.setLanguage(storedLang as any);
        console.log('🚀 App Initializer - Idioma cargado:', storedLang);
      } else {
        // Detectar idioma del navegador
        const browserLang = navigator.language.split('-')[0];
        const lang = ['es', 'en', 'pt'].includes(browserLang) ? browserLang : 'es';
       // i18nService.setLanguage(lang as any);
        console.log('🚀 App Initializer - Idioma del navegador:', lang);
      }
      
      // Inicializar el servicio de sincronización
      // (esto se hace automáticamente al inyectarlo)
      
      resolve();
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(FormsModule),  // 👈 activamos ngModel
  {
      provide: APP_INITIALIZER,
      useFactory: initializeLanguage,
     // deps: [I18nService, LanguageSyncService],
      multi: true
    }
  ]
};
