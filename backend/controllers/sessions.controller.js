const db = require('../config/db');
const geoip = require('geoip-lite'); // npm install geoip-lite
const UAParser = require('ua-parser-js'); // npm install ua-parser-js

class SessionsController {
  /**
   * Registrar nueva sesión
   */
  async registrarSesion(req, userId) {
    try {
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent') || 'Desconocido';
      const parser = new UAParser(userAgent);
      const result = parser.getResult();

      // Obtener ubicación por IP
      const geo = geoip.lookup(ip);
      const ubicacion = geo ? `${geo.city || ''}, ${geo.country || ''}`.trim() : 'Desconocida';

      // Detectar tipo de dispositivo
      const deviceType = result.device.type || 'desktop';
      const browserName = result.browser.name || 'Desconocido';
      const osName = result.os.name || 'Desconocido';

      const dispositivo = `${deviceType === 'mobile' ? '📱' : '💻'} ${osName} - ${browserName}`;

      // Insertar sesión en la base de datos
      const [result_insert] = await db.execute(`
        INSERT INTO sesiones_usuario (
          id_usuario, ip, dispositivo, navegador, 
          sistema_operativo, ubicacion, user_agent, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        userId, 
        ip, 
        dispositivo, 
        browserName, 
        osName, 
        ubicacion, 
        userAgent
      ]);

      console.log('✅ Sesión registrada:', {
        userId,
        ip,
        dispositivo,
        ubicacion
      });

      return result_insert.insertId;

    } catch (error) {
      console.error('Error al registrar sesión:', error);
      return null;
    }
  }

  /**
   * Obtener historial de sesiones del usuario
   */
  async obtenerHistorialSesiones(req, res) {
    try {
      const userId = req.user.id;

      const [sesiones] = await db.execute(`
        SELECT 
          id,
          fecha_acceso as fechaAcceso,
          ip,
          dispositivo,
          navegador,
          sistema_operativo as sistemaOperativo,
          ubicacion,
          activo,
          ultima_actividad as ultimaActividad
        FROM sesiones_usuario
        WHERE id_usuario = ?
        ORDER BY fecha_acceso DESC
        LIMIT 20
      `, [userId]);

      res.json(sesiones);

    } catch (error) {
      console.error('Error al obtener historial de sesiones:', error);
      res.status(500).json({ error: 'Error al obtener historial' });
    }
  }

  /**
   * Cerrar sesión remota
   */
  async cerrarSesionRemota(req, res) {
    try {
      const userId = req.user.id;
      const sesionId = req.params.id;

      // Verificar que la sesión pertenezca al usuario
      const [sesion] = await db.execute(
        'SELECT id FROM sesiones_usuario WHERE id = ? AND id_usuario = ?',
        [sesionId, userId]
      );

      if (sesion.length === 0) {
        return res.status(404).json({ error: 'Sesión no encontrada' });
      }

      // Marcar sesión como inactiva
      await db.execute(
        'UPDATE sesiones_usuario SET activo = 0, fecha_cierre = NOW() WHERE id = ?',
        [sesionId]
      );

      res.json({ mensaje: 'Sesión cerrada correctamente' });

    } catch (error) {
      console.error('Error al cerrar sesión remota:', error);
      res.status(500).json({ error: 'Error al cerrar sesión' });
    }
  }

  /**
   * Actualizar última actividad de la sesión actual
   */
  async actualizarActividad(userId, sesionId) {
    try {
      await db.execute(
        'UPDATE sesiones_usuario SET ultima_actividad = NOW() WHERE id = ? AND id_usuario = ?',
        [sesionId, userId]
      );
    } catch (error) {
      console.error('Error al actualizar actividad de sesión:', error);
    }
  }

  /**
   * Cerrar sesiones inactivas (cleanup)
   */
  async cerrarSesionesInactivas() {
    try {
      // Cerrar sesiones inactivas por más de 30 días
      await db.execute(`
        UPDATE sesiones_usuario 
        SET activo = 0, fecha_cierre = NOW()
        WHERE activo = 1 
        AND ultima_actividad < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      console.log('✅ Sesiones inactivas cerradas');
    } catch (error) {
      console.error('Error al cerrar sesiones inactivas:', error);
    }
  }
}

module.exports = new SessionsController();