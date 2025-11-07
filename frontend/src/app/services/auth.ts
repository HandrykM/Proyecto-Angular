// src/app/services/auth.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../environments/environment';

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  foto?: string;
}

export interface AuthResponse {
  success: boolean;
  mensaje?: string;
  token?: string;
  usuario?: Usuario;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`; // ✅ Usa environment
  private tokenKey = 'token';
  private usuarioKey = 'usuario';
  
  // BehaviorSubject para mantener el usuario actualizado
  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  public usuario$ = this.usuarioSubject.asObservable();

  public isAuthenticated$ = this.usuario$.pipe(
    map(usuario => usuario !== null)
  );

  constructor(private http: HttpClient, private router: Router) {
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

  /**
   * Obtener ID del usuario desde el token
   */
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

  /**
   * Registro
   */
  register(data: { 
    nombre: string; 
    correo: string; 
    contrasena: string; 
    repetirContrasena: string 
  }) {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  /**
   * Login
   */
  login(data: { nombre: string; contrasena: string }): Observable<{ token: string; user: any }> {
    return this.http.post<{ token: string; user: any }>(`${this.apiUrl}/login`, data).pipe(
      tap(response => {
        if (response.token && response.user) {
          this.saveToken(response.token);
          
          const usuario: Usuario = {
            id: response.user.id,
            nombre: response.user.nombre,
            correo: response.user.correo,
            rol: response.user.rol,
            foto: response.user.foto || null
          };
          
          this.saveUser(usuario);
        }
      })
    );
  }

  /**
   * Forgot password
   */
  forgotPassword(data: { correo: string }) {
    return this.http.post(`${this.apiUrl}/forgot-password`, data);
  }

  /**
   * Reset password
   */
  resetPassword(data: { token: string; nuevaContrasena: string }) {
    return this.http.post(`${this.apiUrl}/reset-password`, data);
  }

  /**
   * Guardar token
   */
  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  /**
   * Guardar usuario
   */
  saveUser(user: Usuario) {
    localStorage.setItem('user', JSON.stringify(user));
    this.usuarioSubject.next(user);
  }

  /**
   * Obtener token
   */
  getToken(): string {
    return localStorage.getItem('token') || '';
  }

  /**
   * Obtener usuario
   */
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

  /**
   * Obtener usuario (alias)
   */
  obtenerUsuario(): Usuario | null {
    return this.getUser();
  }

  /**
   * Actualizar usuario en storage
   */
  actualizarUsuario(datosActualizados: Partial<Usuario>): void {
    const usuarioActual = this.getUser();
    if (usuarioActual) {
      const usuarioActualizado = { ...usuarioActual, ...datosActualizados };
      this.saveUser(usuarioActualizado);
    }
  }

  /**
   * Actualizar foto del usuario
   */
  actualizarFotoUsuario(fotoUrl: string): void {
    this.actualizarUsuario({ foto: fotoUrl });
  }

  /**
   * Limpiar token y usuario
   */
  clearToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.usuarioSubject.next(null);
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Verificar si es admin
   */
  isAdmin(): boolean {
    const usuario = this.getUser();
    return usuario?.rol === 'admin';
  }

  /**
   * Logout
   */
  logout(): void {
    this.clearToken();
    this.router.navigate(['/']);
  }

  /**
   * Obtener ID de usuario
   */
  getUsuarioId(): number {
    return this.getUserId();
  }

  /**
   * Obtener foto de usuario
   */
  getFotoUsuario(): string | null {
    const usuario = this.getUser();
    return usuario?.foto || null;
  }
}