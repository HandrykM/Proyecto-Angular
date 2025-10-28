import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DomTranslatorService } from './services/dom-translator.service';
//import { I18nService } from './services/i18n.service';
import { LanguageSyncService } from './services/language-sync.service';
import { LogrosNotificationComponent } from './components/logros-notification/logros-notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    LogrosNotificationComponent // ✅ Importamos el componente de notificaciones
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
title = 'hydrosave';
  constructor(
  //  private i18nService: I18nService,
    private languageSyncService: LanguageSyncService,
    private domTranslator: DomTranslatorService
  ) {
    console.log('🚀 AppComponent - Inicializando...');
  }

  ngOnInit(): void {
    // Inicializar traductor del DOM (para elementos sin Angular)
    this.domTranslator.init();
    
    // Log del idioma actual
  //  const currentLang = this.i18nService.getCurrentLanguage();
   // console.log('🌍 AppComponent - Idioma actual:', currentLang);
    
    // Escuchar cambios de idioma globalmente
  //  this.i18nService.currentLanguage$.subscribe(lang => {
    //  console.log('🌍 AppComponent - Idioma cambiado a:', lang);
    //  document.documentElement.setAttribute('lang', lang);
      
      // Actualizar el título de la página según el idioma
   //   this.updatePageTitle(lang);
 //   });
  }

  private updatePageTitle(lang: string): void {
    const titles: {[key: string]: string} = {
      es: 'HydroSave - Plataforma de Aprendizaje',
      en: 'HydroSave - Learning Platform',
      pt: 'HydroSave - Plataforma de Aprendizagem'
    };
    
    document.title = titles[lang] || titles['es'];
  }
}
