import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app/app.routes';
import { importProvidersFrom } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { App } from './app/app';
import { AuthInterceptor } from './app/services/auth.interceptor';
import { AuthService } from './app/services/auth';
import { ModulosService } from './app/services/modulos.service';
import { AuthGuard } from './app/services/auth.guard';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DomTranslatorService } from './app/services/dom-translator.service';


bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(FormsModule),
    importProvidersFrom(ReactiveFormsModule),
    importProvidersFrom(HttpClientModule),
    AuthService,
    ModulosService,
    AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
}).catch(err => console.error(err));

