// src/app/services/dom-translator.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { I18nService } from './i18n.service';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DomTranslatorService implements OnDestroy {
  private sub: Subscription | null = null;
  private observer: MutationObserver | null = null;

  constructor(private i18n: I18nService) {}

  /**
   * Inicia el traductor del DOM: traduce elementos con `data-i18n` y observa cambios.
   */
  init(): void {
    // Primera pasada
    this.translateAll();

    // Re-traducir cuando cambia el idioma
    this.sub = this.i18n.currentLanguage$.subscribe(() => this.translateAll());

    // Observar nodos añadidos dinámicamente
    this.observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          this.translateNodes(Array.from(m.addedNodes));
        }
        if (m.type === 'attributes' && m.target) {
          const el = m.target as HTMLElement;
          if (el.hasAttribute && el.hasAttribute('data-i18n')) {
            this.translateElement(el);
          }
        }
      }
    });

    try {
      this.observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    } catch (e) {
      console.warn('DomTranslatorService: no se pudo iniciar MutationObserver todavía', e);
    }
  }

  private translateNodes(nodes: Node[]): void {
    nodes.forEach(n => {
      if (n.nodeType === Node.ELEMENT_NODE) {
        const el = n as HTMLElement;
        if (el.hasAttribute('data-i18n')) {
          this.translateElement(el);
        }

        const descendants = el.querySelectorAll('[data-i18n]');
        descendants.forEach(d => this.translateElement(d as HTMLElement));
      }
    });
  }

  private translateAll(): void {
    const nodes = document.querySelectorAll('[data-i18n]');
    nodes.forEach(n => this.translateElement(n as HTMLElement));

    // Soportar atributos: data-i18n-title, data-i18n-placeholder, data-i18n-value
    const attrSelectors = ['data-i18n-title', 'data-i18n-placeholder', 'data-i18n-value'];
    attrSelectors.forEach(sel => {
      document.querySelectorAll('[' + sel + ']').forEach(n => {
        const el = n as HTMLElement;
        const key = el.getAttribute(sel) || '';
        const translated = this.i18n.translate(key);
        if (sel === 'data-i18n-title') el.setAttribute('title', translated);
        if (sel === 'data-i18n-placeholder' && (el as HTMLInputElement).placeholder !== undefined) {
          (el as HTMLInputElement).placeholder = translated;
        }
        if (sel === 'data-i18n-value' && (el as HTMLInputElement).value !== undefined) {
          (el as HTMLInputElement).value = translated;
        }
      });
    });
  }

  private translateElement(el: HTMLElement): void {
    const key = el.getAttribute('data-i18n') || '';
    if (!key) return;

    const translated = this.i18n.translate(key);

    if (el.hasAttribute('data-i18n-html')) {
      el.innerHTML = translated;
    } else {
      el.textContent = translated;
    }
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
    if (this.observer) this.observer.disconnect();
  }
}