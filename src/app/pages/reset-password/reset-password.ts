import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  standalone: true,
  selector: 'app-reset-password',
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css'],
  imports: [CommonModule, FormsModule]
})
export class ResetPassword implements OnInit {
  token: string = '';
  nuevaContrasena: string = '';
  confirmar: string = '';
  loading = false;
  error = '';
  success = '';
  showPassword = false;
  showConfirm = false;

  // Indicadores de fortaleza de contraseña
  passwordStrength = {
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  };

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token') || '';
      if (!this.token) {
        this.error = 'Token no encontrado. Solicita un nuevo enlace de recuperación.';
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirm() {
    this.showConfirm = !this.showConfirm;
  }

  // Validar fortaleza de contraseña en tiempo real
  onPasswordChange() {
    this.passwordStrength.length = this.nuevaContrasena.length >= 6;
    this.passwordStrength.uppercase = /[A-Z]/.test(this.nuevaContrasena);
    this.passwordStrength.lowercase = /[a-z]/.test(this.nuevaContrasena);
    this.passwordStrength.number = /[0-9]/.test(this.nuevaContrasena);
  }

  onSubmit() {
    this.error = ''; 
    this.success = '';

    if (!this.token) {
      this.error = 'Token no encontrado. Repite el proceso de recuperación.';
      return;
    }

    if (!this.nuevaContrasena || this.nuevaContrasena.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    if (!this.passwordStrength.uppercase) {
      this.error = 'La contraseña debe contener al menos una mayúscula';
      return;
    }

    if (!this.passwordStrength.lowercase) {
      this.error = 'La contraseña debe contener al menos una minúscula';
      return;
    }

    if (!this.passwordStrength.number) {
      this.error = 'La contraseña debe contener al menos un número';
      return;
    }

    if (this.nuevaContrasena !== this.confirmar) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;
    this.auth.resetPassword({ token: this.token, nuevaContrasena: this.nuevaContrasena })
      .subscribe({
        next: (res: any) => {
          this.success = res.message || 'Contraseña actualizada correctamente ';
          this.loading = false;
          setTimeout(() => this.router.navigateByUrl('/login'), 2500);
        },
        error: (err) => {
          this.error = err?.error?.message || 'Error al actualizar contraseña';
          this.loading = false;
        }
      });
  }

  goToLogin() { 
    this.router.navigateByUrl('/login'); 
  }

  // Obtener nivel de fortaleza de contraseña
  getPasswordStrengthLevel(): string {
    const score = Object.values(this.passwordStrength).filter(v => v).length;
    if (score === 0) return '';
    if (score <= 1) return 'weak';
    if (score <= 2) return 'medium';
    if (score <= 3) return 'good';
    return 'strong';
  }

  // Agregar este método en la clase ResetPassword
getPasswordStrengthPercentage(): number {
  const values = Object.values(this.passwordStrength);
  const validCount = values.filter(v => v).length;
  return (validCount / 4) * 100;
}


  // Obtener texto del nivel
  getPasswordStrengthText(): string {
    const level = this.getPasswordStrengthLevel();
    const texts: any = {
      weak: 'Débil',
      medium: 'Media',
      good: 'Buena',
      strong: 'Fuerte'
    };
    return texts[level] || '';
  }
}