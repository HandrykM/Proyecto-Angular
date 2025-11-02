// src/app/components/language-selector/language-selector.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService, Language } from '../../services/i18n.service';

interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="language-selector">
      <button 
        class="language-btn" 
        (click)="toggleDropdown()" 
        [class.active]="isOpen">
        <span class="flag">{{ currentLanguage.flag }}</span>
        <span class="language-name">{{ currentLanguage.name }}</span>
        <i class="fas" [class.fa-chevron-down]="!isOpen" [class.fa-chevron-up]="isOpen"></i>
      </button>

      <div class="language-dropdown" *ngIf="isOpen">
        <button
          *ngFor="let lang of languages"
          class="language-option"
          [class.selected]="lang.code === currentLanguageCode"
          (click)="selectLanguage(lang)">
          <span class="flag">{{ lang.flag }}</span>
          <span class="language-name">{{ lang.name }}</span>
          <i class="fas fa-check" *ngIf="lang.code === currentLanguageCode"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .language-selector {
      position: relative;
      z-index: 1000;
    }

    .language-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: white;
      border: 2px solid var(--primary-color);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      color: var(--primary-color);
    }

    .language-btn:hover,
    .language-btn.active {
      background: var(--primary-color);
      color: white;
    }

    .language-btn i {
      font-size: 0.8rem;
      transition: transform 0.3s ease;
    }

    .flag {
      font-size: 1.2rem;
    }

    .language-name {
      font-size: 0.9rem;
    }

    .language-dropdown {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      min-width: 200px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .language-option {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0.8rem 1rem;
      width: 100%;
      background: white;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'Poppins', sans-serif;
      color: var(--dark-color);
    }

    .language-option:hover {
      background: rgba(0, 168, 232, 0.1);
    }

    .language-option.selected {
      background: rgba(0, 168, 232, 0.15);
      font-weight: 600;
    }

    .language-option .fa-check {
      margin-left: auto;
      color: var(--primary-color);
    }

    @media (max-width: 768px) {
      .language-dropdown {
        right: -10px;
      }
    }
  `]
})
export class LanguageSelectorComponent implements OnInit {
  isOpen = false;
  currentLanguageCode: Language = 'es';
  
  languages: LanguageOption[] = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' }
  ];

  get currentLanguage(): LanguageOption {
    return this.languages.find(l => l.code === this.currentLanguageCode) || this.languages[0];
  }

  constructor(private i18nService: I18nService) {}

  ngOnInit(): void {
    this.currentLanguageCode = this.i18nService.getCurrentLanguage();
    
    this.i18nService.currentLanguage$.subscribe(lang => {
      this.currentLanguageCode = lang;
    });

    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.language-selector')) {
        this.isOpen = false;
      }
    });
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  selectLanguage(language: LanguageOption): void {
    this.i18nService.setLanguage(language.code);
    this.isOpen = false;
  }
}