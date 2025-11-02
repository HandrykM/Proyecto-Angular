// src/app/pipes/translate.pipe.ts
import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { I18nService } from '../services/i18n.service';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'translate',
  pure: false,
  standalone: true
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private value: string = '';
  private lastKey: string = '';
  private subscription: Subscription;

  constructor(
    private i18nService: I18nService,
    private changeDetector: ChangeDetectorRef
  ) {
    this.subscription = this.i18nService.currentLanguage$.subscribe(() => {
      this.updateValue(this.lastKey);
      this.changeDetector.markForCheck();
    });
  }

  transform(key: string): string {
    if (key !== this.lastKey) {
      this.lastKey = key;
      this.updateValue(key);
    }
    return this.value;
  }

  private updateValue(key: string): void {
    this.value = this.i18nService.translate(key);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}