// backend/controllers/configuracion_usuario.controller.js
const db = require('../config/db');

class ConfiguracionUsuarioController {
  /**
   * Obtener configuración del usuario
   */
  async obtenerConfiguracion(req, res) {
    try {
      const userId = req.user.id;

      const [config] = await db.execute(`
        SELECT 
          idioma,
          modo_oscuro as modoOscuro,
          tamano_fuente as tamanoFuente,
          notif_email,
          notif_sms,
          notif_push,
          notif_recordatorios,
          notif_logros
        FROM configuracion_usuario
        WHERE id_usuario = ?
      `, [userId]);

      if (config.length === 0) {
        // Crear configuración por defecto
        await this.crearConfiguracionDefecto(userId);
        return this.obtenerConfiguracion(req, res);
      }

      const configuracion = config[0];

      res.json({
        idioma: configuracion.idioma || 'es',
        modoOscuro: configuracion.modoOscuro === 1,
        tamanoFuente: configuracion.tamanoFuente || 'mediano',
        notificaciones: {
          email: configuracion.notif_email === 1,
          sms: configuracion.notif_sms === 1,
          push: configuracion.notif_push === 1,
          recordatorios: configuracion.notif_recordatorios === 1,
          logros: configuracion.notif_logros === 1
        }
      });

    } catch (error) {
      console.error('Error al obtener configuración:', error);
      res.status(500).json({
        success: false,
        mensaje: 'Error al obtener configuración'
      });
    }
  }

  /**
   * Guardar configuración del usuario
   */
  async guardarConfiguracion(req, res) {
    try {
      const userId = req.user.id;
      const { idioma, modoOscuro, tamanoFuente, notificaciones } = req.body;

      // Verificar si existe configuración
      const [existe] = await db.execute(`
        SELECT id FROM configuracion_usuario WHERE id_usuario = ?
      `, [userId]);

      if (existe.length === 0) {
        // Crear nueva configuración
        await db.execute(`
          INSERT INTO configuracion_usuario (
            id_usuario, idioma, modo_oscuro, tamano_fuente,
            notif_email, notif_sms, notif_push, notif_recordatorios, notif_logros
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId,
          idioma || 'es',
          modoOscuro ? 1 : 0,
          tamanoFuente || 'mediano',
          notificaciones?.email ? 1 : 0,
          notificaciones?.sms ? 1 : 0,
          notificaciones?.push ? 1 : 0,
          notificaciones?.recordatorios ? 1 : 0,
          notificaciones?.logros ? 1 : 0
        ]);
      } else {
        // Actualizar configuración existente
        await db.execute(`
          UPDATE configuracion_usuario SET
            idioma = ?,
            modo_oscuro = ?,
            tamano_fuente = ?,
            notif_email = ?,
            notif_sms = ?,
            notif_push = ?,
            notif_recordatorios = ?,
            notif_logros = ?,
            fecha_modificacion = NOW()
          WHERE id_usuario = ?
        `, [
          idioma || 'es',
          modoOscuro ? 1 : 0,
          tamanoFuente || 'mediano',
          notificaciones?.email ? 1 : 0,
          notificaciones?.sms ? 1 : 0,
          notificaciones?.push ? 1 : 0,
          notificaciones?.recordatorios ? 1 : 0,
          notificaciones?.logros ? 1 : 0,
          userId
        ]);
      }

      res.json({
        success: true,
        mensaje: 'Configuración guardada correctamente'
      });

    } catch (error) {
      console.error('Error al guardar configuración:', error);
      res.status(500).json({
        success: false,
        mensaje: 'Error al guardar configuración'
      });
    }
  }

  /**
   * Crear configuración por defecto
   */
  async crearConfiguracionDefecto(userId) {
    await db.execute(`
      INSERT INTO configuracion_usuario (
        id_usuario, idioma, modo_oscuro, tamano_fuente,
        notif_email, notif_sms, notif_push, notif_recordatorios, notif_logros
      ) VALUES (?, 'es', 0, 'mediano', 1, 0, 1, 1, 1)
    `, [userId]);
  }
}

module.exports = new ConfiguracionUsuarioController();