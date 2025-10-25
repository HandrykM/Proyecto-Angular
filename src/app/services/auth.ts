// src/app/services/auth.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  foto?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:3000/api/auth';
  
  // BehaviorSubject para mantener el usuario actualizado en toda la app
  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  public usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Cargar usuario al inicializar
    this.cargarUsuarioDesdeStorage();
  }

  /**
   * Cargar usuario desde localStorage al iniciar
   */
  private cargarUsuarioDesdeStorage(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const usuario = JSON.parse(userStr);
        this.usuarioSubject.next(usuario);
      } catch (error) {
        console.error('Error al cargar usuario:', error);
      }
    }
  }

  getUserId(): number {
    const token = this.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
      } catch (e) {
        console.error('Error al decodificar token', e);
        return 0;
      }
    }
    return 0;
  }

  // Registro
  register(data: { nombre: string; correo: string; contrasena: string; repetirContrasena: string}) {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  // Login - MEJORADO
  login(data: { nombre: string; contrasena: string }): Observable<{ token: string; user: any }> {
    return this.http.post<{ token: string; user: any }>(`${this.baseUrl}/login`, data).pipe(
      tap(response => {
        if (response.token && response.user) {
          // Guardar token
          this.saveToken(response.token);
          
          // Guardar usuario con foto
          const usuario: Usuario = {
            id: response.user.id,
            nombre: response.user.nombre,
            correo: response.user.correo,
            rol: response.user.rol,
            foto: response.user.foto || null
          };
          
          this.saveUser(usuario);
          this.usuarioSubject.next(usuario);
        }
      })
    );
  }

  // Forgot password
  forgotPassword(data: { correo: string }) {
    return this.http.post(`${this.baseUrl}/forgot-password`, data);
  }

  resetPassword(data: { token: string; nuevaContrasena: string }) {
    return this.http.post(`${this.baseUrl}/reset-password`, data);
  }

  // Guardar token
  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  // Guardar usuario - MEJORADO
  saveUser(user: Usuario) {
    localStorage.setItem('user', JSON.stringify(user));
    this.usuarioSubject.next(user);
  }

  getToken(): string {
    return localStorage.getItem('token') || '';
  }

  // Obtener usuario - MEJORADO
  getUser(): Usuario | null {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        return JSON.parse(user);
      } catch (error) {
        console.error('Error al parsear usuario:', error);
        return null;
      }
    }
    return null;
  }
  obtenerUsuario() {
  const usuario = localStorage.getItem('usuario');
  return usuario ? JSON.parse(usuario) : null;
}


  /**
   * Actualizar usuario en storage - NUEVO
   */
  actualizarUsuario(datosActualizados: Partial<Usuario>): void {
    const usuarioActual = this.getUser();
    if (usuarioActual) {
      const usuarioActualizado = { ...usuarioActual, ...datosActualizados };
      this.saveUser(usuarioActualizado);
    }
  }

  /**
   * Actualizar foto del usuario - NUEVO
   */
  actualizarFotoUsuario(fotoUrl: string): void {
    this.actualizarUsuario({ foto: fotoUrl });
  }

  clearToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.usuarioSubject.next(null);
  }

  // Verificar si está logueado
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Verificar si es admin - NUEVO
  isAdmin(): boolean {
    const usuario = this.getUser();
    return usuario?.rol === 'admin';
  }

  

  // Logout corregido
  logout(): void {
    this.clearToken();
    this.router.navigate(['/']);
  }

  // Obtener ID de usuario
  getUsuarioId(): number {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id || 0;
      } catch (error) {
        console.error('Error al obtener ID de usuario:', error);
        return 0;
      }
    }
    return 0;
  }

  /**
   * Obtener foto de usuario - MEJORADO
   */
  getFotoUsuario(): string | null {
    const usuario = this.getUser();
    return usuario?.foto || null;
  }
}