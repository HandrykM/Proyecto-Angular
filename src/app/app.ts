import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DomTranslatorService } from './services/dom-translator.service';
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

  constructor(private domTranslator: DomTranslatorService) {}

  ngOnInit(): void {
    try {
      this.domTranslator.init();
    } catch (e) {
      console.warn('No se pudo inicializar DomTranslatorService desde App:', e);
    }
  }
}
