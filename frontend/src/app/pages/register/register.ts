import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  imports: [CommonModule, FormsModule]
})
export class Register {
  nombre: string = '';
  correo: string = '';
  contrasena: string = '';
  confirmar: string = '';
  showPassword = false;
  showConfirm = false;
  loading = false;
  error = '';
  success = '';

  passwordStrength = {
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  };

  constructor(private auth: AuthService, private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirm() {
    this.showConfirm = !this.showConfirm;
  }

  onPasswordChange() {
    this.passwordStrength.length = this.contrasena.length >= 6;
    this.passwordStrength.uppercase = /[A-Z]/.test(this.contrasena);
    this.passwordStrength.lowercase = /[a-z]/.test(this.contrasena);
    this.passwordStrength.number = /[0-9]/.test(this.contrasena);
  }

  validateUsername(): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(this.nombre)) {
      this.error = 'El usuario debe tener entre 3-20 caracteres y solo letras, números y guiones bajos';
      return false;
    }
    return true;
  }

  validateEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.correo)) {
      this.error = 'El correo electrónico no es válido';
      return false;
    }
    return true;
  }

  // ✅ MÉTODO NECESARIO PARA EL TEMPLATE
  getPasswordStrengthPercentage(): number {
    const values = Object.values(this.passwordStrength);
    const validCount = values.filter(v => v).length;
    return (validCount / 4) * 100;
  }

  getPasswordStrengthLevel(): string {
    const score = Object.values(this.passwordStrength).filter(v => v).length;
    if (score === 0) return '';
    if (score <= 1) return 'weak';
    if (score <= 2) return 'medium';
    if (score <= 3) return 'good';
    return 'strong';
  }

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

  onSubmit() {
    this.error = '';
    this.success = '';

    if (!this.nombre || !this.correo || !this.contrasena || !this.confirmar) {
      this.error = 'Todos los campos son obligatorios';
      return;
    }

    if (!this.validateUsername()) return;
    if (!this.validateEmail()) return;

    if (this.contrasena.length < 6) {
      this.error = 'La contraseña debe tener mínimo 6 caracteres';
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

    if (this.contrasena !== this.confirmar) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    this.loading = true;
    this.auth.register({
      nombre: this.nombre,
      correo: this.correo,
      contrasena: this.contrasena,
      repetirContrasena: this.confirmar
    }).subscribe({
      next: (res: any) => {
        this.success = res.message || 'Registro exitoso';
        this.loading = false;
        setTimeout(() => this.goToLogin(), 2000);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Error al registrarse';
        this.loading = false;
      }
    });
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}