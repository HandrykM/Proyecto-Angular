import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  standalone: true,
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
  imports: [CommonModule, FormsModule]
})
export class ForgotPassword {
  correo: string = '';
  loading = false;
  error = '';
  success = '';

  constructor(private auth: AuthService, private router: Router) {}

  // Validar formato de email
  validateEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.correo);
  }

  onSubmit() {
    this.error = ''; 
    this.success = ''; 

    if (!this.correo) {
      this.error = 'El correo es obligatorio';
      return;
    }

    if (!this.validateEmail()) {
      this.error = 'El correo electrónico no es válido';
      return;
    }

    this.loading = true;

    this.auth.forgotPassword({ correo: this.correo }).subscribe({
      next: (res: any) => {
        this.success = res.message || 'Si el correo está registrado, recibirás un enlace de recuperación ✅';
        this.correo = ''; // Limpiar el campo
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Error al enviar correo de recuperación';
        this.loading = false;
      }
    });
  }

  goToLogin() { 
    this.router.navigateByUrl('/login'); 
  }
}