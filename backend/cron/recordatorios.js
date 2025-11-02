// backend/cron/recordatorios.js
const cron = require('node-cron');
const db = require('../config/db');
const preferenciasController = require('../controllers/preferencias.controller');

/**
 * CRON Job para enviar recordatorios de estudio
 * Se ejecuta diariamente a las 9:00 AM
 */
class RecordatoriosCron {
  
  /**
   * Iniciar CRON Job
   */
  iniciar() {
    // Ejecutar todos los días a las 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('📅 Ejecutando CRON: Verificar usuarios inactivos');
      await this.verificarUsuariosInactivos();
    });

    console.log('✅ CRON de recordatorios iniciado (9:00 AM diario)');
  }

  /**
   * Verificar usuarios inactivos y enviar recordatorios
   */
  async verificarUsuariosInactivos() {
    try {
      // Obtener usuarios que no han tenido actividad en los últimos 3 días
      const [usuariosInactivos] = await db.execute(`
        SELECT DISTINCT u.id, u.nombre, u.correo, u.telefono
        FROM usuarios u
        LEFT JOIN progreso_lecturas pl ON u.id = pl.usuario_id
        LEFT JOIN actividad_usuario au ON u.id = au.id_usuario
        WHERE u.rol = 'usuario'
        AND (
          pl.ultima_actualizacion < DATE_SUB(NOW(), INTERVAL 3 DAY)
          OR au.fecha_actividad < DATE_SUB(NOW(), INTERVAL 3 DAY)
          OR (pl.ultima_actualizacion IS NULL AND au.fecha_actividad IS NULL)
        )
        GROUP BY u.id
      `);

      console.log(`📊 Usuarios inactivos encontrados: ${usuariosInactivos.length}`);

      for (const usuario of usuariosInactivos) {
        await this.enviarRecordatorio(usuario.id);
        
        // Esperar 1 segundo entre cada envío para no saturar el servidor
        await this.esperar(1000);
      }

      console.log('✅ Recordatorios enviados exitosamente');

    } catch (error) {
      console.error('❌ Error en CRON de recordatorios:', error);
    }
  }

  /**
   * Enviar recordatorio a un usuario específico
   */
  async enviarRecordatorio(userId) {
    try {
      await preferenciasController.enviarRecordatorioEstudio(userId);
      console.log(`✅ Recordatorio enviado a usuario ${userId}`);
    } catch (error) {
      console.error(`❌ Error enviando recordatorio a usuario ${userId}:`, error);
    }
  }

  /**
   * Función auxiliar para esperar
   */
  esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verificación manual (para testing)
   */
  async ejecutarManual() {
    console.log('🔧 Ejecutando verificación manual de recordatorios');
    await this.verificarUsuariosInactivos();
  }
}

module.exports = new RecordatoriosCron();