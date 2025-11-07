// src/app/directives/auto-translate.directive.ts
import { Directive, ElementRef, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { I18nService } from '../app/services/i18n.service';

/**
 * Directiva que traduce automáticamente el contenido de elementos HTML
 * Uso: <div appAutoTranslate="clave.traduccion">Texto por defecto</div>
 */
@Directive({
  selector: '[appAutoTranslate]',
  standalone: true
})
export class AutoTranslateDirective implements OnInit, OnDestroy {
  @Input() appAutoTranslate: string = '';
  @Input() translateParams: any = {};
  private subscription?: Subscription;

  constructor(
    private el: ElementRef,
    private i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.subscription = this.i18n.currentLanguage$.subscribe(() => {
      this.translate();
    });
    this.translate();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private translate(): void {
    if (this.appAutoTranslate) {
      const translated = this.i18n.translate(this.appAutoTranslate, this.translateParams);
      this.el.nativeElement.textContent = translated;
    }
  }
}

/**
 * Directiva para traducir atributos HTML
 * Uso: <input appTranslateAttr="placeholder:form.email">
 */
@Directive({
  selector: '[appTranslateAttr]',
  standalone: true
})
export class TranslateAttrDirective implements OnInit, OnDestroy {
  @Input() appTranslateAttr: string = '';
  private subscription?: Subscription;

  constructor(
    private el: ElementRef,
    private i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.subscription = this.i18n.currentLanguage$.subscribe(() => {
      this.translateAttributes();
    });
    this.translateAttributes();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private translateAttributes(): void {
    if (!this.appTranslateAttr) return;

    const attributes = this.appTranslateAttr.split(';');
    attributes.forEach(attr => {
      const [name, key] = attr.split(':');
      if (name && key) {
        const translated = this.i18n.translate(key.trim());
        this.el.nativeElement.setAttribute(name.trim(), translated);
      }
    });
  }
}