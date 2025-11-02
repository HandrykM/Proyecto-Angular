import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class AuthGuard {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.auth.isAuthenticated()) {
      return true; // ✅ Usuario autenticado → puede entrar
    } else {
      this.router.navigate(['/login']); // 🚫 No autenticado → redirige al login
      return false;
    }
  }
}
