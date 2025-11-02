import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  imports: [CommonModule, FormsModule]
})
export class Login {
  nombre: string = '';
  contrasena: string = '';
  showPassword = false;
  loading = false;
  error = '';
  success = '';

  constructor(private auth: AuthService, private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.error = ''; 
    this.success = ''; 

    if (!this.nombre || !this.contrasena) {
      this.error = 'Usuario y contraseña son obligatorios';
      return;
    }

    this.loading = true;

    this.auth.login({ nombre: this.nombre, contrasena: this.contrasena })
      .subscribe({
        next: (res: any) => {
          if (res?.token) {
            this.auth.saveToken(res.token);
            this.auth.saveUser(res.user);

            this.success = 'Inicio de sesión exitoso ';
            setTimeout(() => {
              this.router.navigateByUrl('/inicio');
            }, 500);
          } else {
            this.error = 'Respuesta inesperada del servidor';
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'Usuario o contraseña incorrectos';
          if (err?.error?.hint) {
            this.error += '. ' + err.error.hint;
          }
          this.loading = false;
        }
      });
  }

  goToRegister() { this.router.navigateByUrl('/register'); }
  goToForgot() { this.router.navigateByUrl('/forgot-password'); }
}