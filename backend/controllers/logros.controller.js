// backend/controllers/logros.controller.js
const db = require('../config/db');
const preferenciasController = require('./preferencias.controller');

class LogrosController {
  /**
   * Obtener todos los logros disponibles y los del usuario
   */
  async obtenerLogrosUsuario(req, res) {
    try {
      const userId = req.user.id;

      const [logrosDisponibles] = await db.execute(`
        SELECT 
          l.id,
          l.titulo,
          l.descripcion,
          l.icono,
          l.condicion_tipo,
          l.condicion_valor,
          l.puntos_recompensa,
          ul.fecha_obtenido,
          ul.id as obtenido_id
        FROM logros l
        LEFT JOIN usuario_logros ul ON l.id = ul.id_logro AND ul.id_usuario = ?
        WHERE l.activo = 1
        ORDER BY l.id ASC
      `, [userId]);

      const logros = logrosDisponibles.map(logro => ({
        id: logro.id,
        titulo: logro.titulo,
        descripcion: logro.descripcion,
        icono: logro.icono,
        condicionTipo: logro.condicion_tipo,
        condicionValor: logro.condicion_valor,
        puntosRecompensa: logro.puntos_recompensa,
        obtenido: !!logro.obtenido_id,
        fechaObtenido: logro.fecha_obtenido
      }));

      res.json({
        success: true,
        data: logros
      });

    } catch (error) {
      console.error('Error al obtener logros:', error);
      res.status(500).json({
        success: false,
        mensaje: 'Error al obtener logros'
      });
    }
  }

  /**
   * Verificar y otorgar logros automáticamente
   */
  async verificarYOtorgarLogros(userId) {
    try {
      const estadisticas = await this.obtenerEstadisticasUsuario(userId);

      const [logrosNoObtenidos] = await db.execute(`
        SELECT l.* 
        FROM logros l
        WHERE l.activo = 1
        AND l.id NOT IN (
          SELECT id_logro FROM usuario_logros WHERE id_usuario = ?
        )
      `, [userId]);

      const logrosNuevos = [];

      for (const logro of logrosNoObtenidos) {
        let cumple = false;

        switch (logro.condicion_tipo) {
          case 'modulos_completados':
            cumple = estadisticas.modulosCompletados >= logro.condicion_valor;
            break;
          case 'puntos_obtenidos':
            cumple = estadisticas.puntosTotal >= logro.condicion_valor;
            break;
          case 'tiempo_estudio':
            cumple = estadisticas.tiempoTotalMinutos >= logro.condicion_valor;
            break;
          case 'actividades_completadas':
            cumple = estadisticas.actividadesCompletadas >= logro.condicion_valor;
            break;
          case 'dias_consecutivos':
            cumple = estadisticas.rachaConsecutiva >= logro.condicion_valor;
            break;
        }

        if (cumple) {
          await db.execute(`
            INSERT INTO usuario_logros (id_usuario, id_logro, fecha_obtenido)
            VALUES (?, ?, NOW())
          `, [userId, logro.id]);

          logrosNuevos.push({
            id: logro.id,
            titulo: logro.titulo,
            descripcion: logro.descripcion,
            icono: logro.icono,
            puntosRecompensa: logro.puntos_recompensa
          });
        }
      }

      return logrosNuevos;

    } catch (error) {
      console.error('Error al verificar logros:', error);
      return [];
    }
  }

  /**
   * Obtener estadísticas del usuario
   */
  async obtenerEstadisticasUsuario(userId) {
    try {
      // Módulos completados (100%)
      const [modulosResult] = await db.execute(`
        SELECT COUNT(DISTINCT modulo_data.modulo_id) as total
        FROM (
          SELECT 
            l.modulo_id,
            ROUND((SUM(CASE WHEN pl.completada = 1 THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(l.id), 0), 0) as progreso
          FROM lecturas l
          INNER JOIN modulos m ON l.modulo_id = m.id
          LEFT JOIN progreso_lecturas pl ON l.id = pl.lectura_id AND pl.usuario_id = ?
          WHERE l.activa = 1 AND m.activo = 1
          GROUP BY l.modulo_id
          HAVING progreso >= 100
        ) as modulo_data
      `, [userId]);

      // Puntos de módulos
      const [puntosModulos] = await db.execute(`
        SELECT COALESCE(SUM(CAST(m.puntos AS UNSIGNED)), 0) as puntos
        FROM modulos m
        LEFT JOIN lecturas l ON m.id = l.modulo_id AND l.activa = 1
        LEFT JOIN progreso_lecturas pl ON l.id = pl.lectura_id AND pl.usuario_id = ?
        WHERE m.activo = 1
        GROUP BY m.id
        HAVING ROUND((SUM(CASE WHEN pl.completada = 1 THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(l.id), 0), 0) >= 100
      `, [userId]);

      // Puntos de actividades
      const [puntosActividades] = await db.execute(`
        SELECT COALESCE(SUM(CAST(puntos_obtenidos AS UNSIGNED)), 0) as puntos
        FROM actividad_usuario
        WHERE id_usuario = ? AND resultado = 'Completada' AND puntos_obtenidos > 0
      `, [userId]);

      // Tiempo total
      const [tiempoResult] = await db.execute(`
        SELECT COALESCE(SUM(tiempo_minutos), 0) as total
        FROM tiempo_estudio
        WHERE id_usuario = ?
      `, [userId]);

      // Actividades completadas
      const [actividadesResult] = await db.execute(`
        SELECT COUNT(*) as total
        FROM actividad_usuario
        WHERE id_usuario = ? AND resultado = 'Completada'
      `, [userId]);

      // Racha consecutiva
      const [rachaResult] = await db.execute(`
        SELECT COUNT(DISTINCT DATE(fecha_lectura)) as dias
        FROM progreso_contenido
        WHERE id_usuario = ? AND fecha_lectura >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `, [userId]);

      const puntosModulosNum = parseInt(puntosModulos[0]?.puntos) || 0;
      const puntosActividadesNum = parseInt(puntosActividades[0]?.puntos) || 0;

      return {
        modulosCompletados: modulosResult[0]?.total || 0,
        puntosTotal: puntosModulosNum + puntosActividadesNum,
        tiempoTotalMinutos: tiempoResult[0]?.total || 0,
        actividadesCompletadas: actividadesResult[0]?.total || 0,
        rachaConsecutiva: rachaResult[0]?.dias || 0
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        modulosCompletados: 0,
        puntosTotal: 0,
        tiempoTotalMinutos: 0,
        actividadesCompletadas: 0,
        rachaConsecutiva: 0
      };
    }
  }

  /**
   * Verificación manual de logros
   */
  async verificarLogrosManual(req, res) {
    try {
      const userId = req.user.id;
      const logrosNuevos = await this.verificarYOtorgarLogros(userId);

      res.json({
        success: true,
        logrosNuevos: logrosNuevos,
        mensaje: logrosNuevos.length > 0 
          ? `¡Felicidades! Has obtenido ${logrosNuevos.length} nuevo(s) logro(s)`
          : 'No hay nuevos logros disponibles'
      });

    } catch (error) {
      console.error('Error al verificar logros:', error);
      res.status(500).json({
        success: false,
        mensaje: 'Error al verificar logros'
      });
    }
  }

  /**
   * Verificar logros después de completar módulo
   */
  async verificarLogrosDespuesDeModulo(req, res) {
    try {
      const userId = req.user.id;
      const logrosNuevos = await this.verificarYOtorgarLogros(userId);

      if (logrosNuevos.length > 0) {
        for (const logro of logrosNuevos) {
          await this.notificarLogro(userId, logro);
        }
      }

      res.json({
        success: true,
        logrosNuevos: logrosNuevos
      });
    } catch (error) {
      console.error('Error verificando logros:', error);
      res.status(500).json({
        success: false,
        mensaje: 'Error al verificar logros'
      });
    }
  }

  /**
   * Notificar logro al usuario
   */
  async notificarLogro(userId, logro) {
    try {
      await preferenciasController.notificarLogro(userId, logro);
    } catch (error) {
      console.error('Error notificando logro:', error);
    }
  }
}

module.exports = new LogrosController();