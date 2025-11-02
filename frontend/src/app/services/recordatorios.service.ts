// src/app/services/recordatorios.service.ts
import { Injectable } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { PushNotificationsService } from './push-notifications.service';

@Injectable({
  providedIn: 'root'
})
export class RecordatoriosService {
  private DIAS_INACTIVIDAD = 3; // Días sin actividad para enviar recordatorio
  private INTERVALO_CHECK = 24 * 60 * 60 * 1000; // Revisar cada 24 horas
  private checkSubscription?: Subscription;

  constructor(private pushService: PushNotificationsService) {}

  /**
   * Iniciar sistema de recordatorios
   */
  iniciar(): void {
    console.log('📅 Sistema de recordatorios iniciado');
    
    // Verificar inmediatamente
    this.verificarInactividad();

    // Verificar cada 24 horas
    this.checkSubscription = interval(this.INTERVALO_CHECK).subscribe(() => {
      this.verificarInactividad();
    });
  }

  /**
   * Detener sistema de recordatorios
   */
  detener(): void {
    this.checkSubscription?.unsubscribe();
    console.log('📅 Sistema de recordatorios detenido');
  }

  /**
   * Verificar si el usuario ha estado inactivo
   */
  private verificarInactividad(): void {
    const ultimaActividad = this.obtenerUltimaActividad();
    if (!ultimaActividad) {
      return;
    }

    const diasInactivo = this.calcularDiasInactividad(ultimaActividad);
    console.log(`📊 Días de inactividad: ${diasInactivo}`);

    if (diasInactivo >= this.DIAS_INACTIVIDAD) {
      this.enviarRecordatorio(diasInactivo);
    }
  }

  /**
   * Enviar recordatorio de estudio
   */
  private enviarRecordatorio(diasInactivo: number): void {
    const mensajes = [
      '¡Te extrañamos! Continúa tu aprendizaje sobre la reutilización del agua.',
      '¡No te rindas! Cada día aprendes algo nuevo sobre el cuidado del agua.',
      '¡Sigue adelante! Tu progreso en HydroSave te está esperando.',
      '¡Es hora de aprender! Completa tu siguiente módulo de agua.',
      `Han pasado ${diasInactivo} días. ¿Listo para continuar tu educación ambiental?`
    ];

    const mensajeAleatorio = mensajes[Math.floor(Math.random() * mensajes.length)];
    
    this.pushService.mostrarRecordatorio(mensajeAleatorio);
  }

  /**
   * Registrar actividad del usuario
   */
  registrarActividad(): void {
    const ahora = new Date().toISOString();
    localStorage.setItem('ultima_actividad', ahora);
  }

  /**
   * Obtener última actividad
   */
  private obtenerUltimaActividad(): Date | null {
    const actividad = localStorage.getItem('ultima_actividad');
    return actividad ? new Date(actividad) : null;
  }

  /**
   * Calcular días de inactividad
   */
  private calcularDiasInactividad(ultimaActividad: Date): number {
    const ahora = new Date();
    const diferencia = ahora.getTime() - ultimaActividad.getTime();
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
  }

  /**
   * Verificar si debe enviar recordatorio (manual)
   */
  verificarYEnviarRecordatorio(): void {
    this.verificarInactividad();
  }
}