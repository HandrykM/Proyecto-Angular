const db = require('../config/db');
const { validationResult } = require('express-validator');

class TiempoController {
  /**
   * Registrar tiempo de estudio
   */
  async registrarTiempoEstudio(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: errors.array()
        });
      }

      const { id_lectura, tiempo_minutos } = req.body;
      const id_usuario = req.user.id;

      // Validar que el tiempo sea razonable (entre 1 minuto y 6 horas)
      if (tiempo_minutos < 1 || tiempo_minutos > 360) {
        return res.status(400).json({
          success: false,
          message: 'Tiempo de estudio debe estar entre 1 y 360 minutos'
        });
      }

      // Verificar que la lectura existe
      const [lecturaExists] = await db.execute(`
        SELECT id FROM contenido WHERE id = ?
      `, [id_lectura]);

      if (lecturaExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Lectura no encontrada'
        });
      }

      // Insertar registro de tiempo
      const [result] = await db.execute(`
        INSERT INTO tiempo_estudio (id_usuario, id_lectura, tiempo_minutos, fecha)
        VALUES (?, ?, ?, NOW())
      `, [id_usuario, id_lectura, tiempo_minutos]);

      res.json({
        success: true,
        message: 'Tiempo de estudio registrado exitosamente',
        data: { id: result.insertId }
      });

    } catch (error) {
      console.error('Error al registrar tiempo de estudio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener estadísticas de tiempo de estudio
   */
  async obtenerEstadisticasTiempo(req, res) {
    try {
      const id_usuario = req.user.id;
      const periodo = req.query.periodo || '30'; // días por defecto

      // Tiempo total estudiado
      const [tiempoTotal] = await db.execute(`
        SELECT 
          SUM(tiempo_minutos) as total_minutos,
          COUNT(*) as total_sesiones,
          AVG(tiempo_minutos) as promedio_sesion
        FROM tiempo_estudio 
        WHERE id_usuario = ?
        AND fecha >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `, [id_usuario, parseInt(periodo)]);

      // Tiempo por día (últimos 7 días)
      const [tiempoPorDia] = await db.execute(`
        SELECT 
          DATE(fecha) as fecha,
          SUM(tiempo_minutos) as minutos_dia,
          COUNT(*) as sesiones_dia
        FROM tiempo_estudio 
        WHERE id_usuario = ?
        AND fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(fecha)
        ORDER BY fecha ASC
      `, [id_usuario]);

      // Tiempo por módulo
      const [tiempoPorModulo] = await db.execute(`
        SELECT 
          m.titulo as modulo,
          m.color,
          SUM(te.tiempo_minutos) as total_minutos,
          COUNT(te.id) as sesiones
        FROM tiempo_estudio te
        JOIN contenido c ON te.id_lectura = c.id
        JOIN modulos m ON c.modulo_id = m.id
        WHERE te.id_usuario = ?
        AND te.fecha >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY m.id, m.titulo, m.color
        ORDER BY total_minutos DESC
      `, [id_usuario, parseInt(periodo)]);

      // Racha actual de días estudiando
      const [rachaActual] = await db.execute(`
        SELECT COUNT(DISTINCT DATE(fecha)) as dias_consecutivos
        FROM tiempo_estudio 
        WHERE id_usuario = ?
        AND fecha >= (
          SELECT DATE_SUB(NOW(), INTERVAL (
            SELECT COUNT(DISTINCT DATE(fecha))
            FROM tiempo_estudio t2
            WHERE t2.id_usuario = ? 
            AND t2.fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ) DAY)
        )
      `, [id_usuario, id_usuario]);

      // Horario más productivo
      const [horarioProductivo] = await db.execute(`
        SELECT 
          HOUR(fecha) as hora,
          SUM(tiempo_minutos) as minutos_hora,
          COUNT(*) as sesiones_hora
        FROM tiempo_estudio 
        WHERE id_usuario = ?
        AND fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY HOUR(fecha)
        ORDER BY minutos_hora DESC
        LIMIT 1
      `, [id_usuario]);

      const estadisticas = {
        resumen: {
          total_minutos: tiempoTotal[0].total_minutos || 0,
          total_horas: Math.round((tiempoTotal[0].total_minutos || 0) / 60 * 100) / 100,
          total_sesiones: tiempoTotal[0].total_sesiones || 0,
          promedio_sesion: Math.round(tiempoTotal[0].promedio_sesion || 0),
          racha_dias: rachaActual[0].dias_consecutivos || 0
        },
        tiempo_por_dia: tiempoPorDia.map(dia => ({
          fecha: dia.fecha,
          minutos: dia.minutos_dia,
          horas: Math.round(dia.minutos_dia / 60 * 100) / 100,
          sesiones: dia.sesiones_dia
        })),
        tiempo_por_modulo: tiempoPorModulo.map(modulo => ({
          modulo: modulo.modulo,
          color: modulo.color,
          minutos: modulo.total_minutos,
          horas: Math.round(modulo.total_minutos / 60 * 100) / 100,
          sesiones: modulo.sesiones
        })),
        horario_optimo: horarioProductivo.length > 0 ? {
          hora: horarioProductivo[0].hora,
          minutos_totales: horarioProductivo[0].minutos_hora
        } : null
      };

      res.json({
        success: true,
        data: estadisticas,
        periodo_dias: parseInt(periodo)
      });

    } catch (error) {
      console.error('Error al obtener estadísticas de tiempo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener historial de sesiones de estudio
   */
  async obtenerHistorialSesiones(req, res) {
    try {
      const id_usuario = req.user.id;
      const limite = parseInt(req.query.limite) || 20;
      const offset = parseInt(req.query.offset) || 0;

      const query = `
        SELECT 
          te.id,
          te.tiempo_minutos,
          te.fecha,
          c.titulo as lectura_titulo,
          m.titulo as modulo_titulo,
          m.color as modulo_color,
          m.nivel as modulo_nivel
        FROM tiempo_estudio te
        JOIN contenido c ON te.id_lectura = c.id
        JOIN modulos m ON c.modulo_id = m.id
        WHERE te.id_usuario = ?
        ORDER BY te.fecha DESC
        LIMIT ? OFFSET ?
      `;

      const [sesiones] = await db.execute(query, [id_usuario, limite, offset]);

      // Contar total de sesiones
      const [countResult] = await db.execute(`
        SELECT COUNT(*) as total
        FROM tiempo_estudio 
        WHERE id_usuario = ?
      `, [id_usuario]);

      const sesionesFormateadas = sesiones.map(sesion => ({
        id: sesion.id,
        tiempo_minutos: sesion.tiempo_minutos,
        tiempo_horas: Math.round(sesion.tiempo_minutos / 60 * 100) / 100,
        fecha: sesion.fecha,
        lectura: {
          titulo: sesion.lectura_titulo
        },
        modulo: {
          titulo: sesion.modulo_titulo,
          color: sesion.modulo_color,
          nivel: sesion.modulo_nivel
        }
      }));

      res.json({
        success: true,
        data: sesionesFormateadas,
        pagination: {
          total: countResult[0].total,
          limite: limite,
          offset: offset,
          hasMore: (offset + limite) < countResult[0].total
        }
      });

    } catch (error) {
      console.error('Error al obtener historial de sesiones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener metas de estudio y progreso
   */
  async obtenerMetasEstudio(req, res) {
    try {
      const id_usuario = req.user.id;

      // Meta diaria predeterminada: 30 minutos
      const metaDiariaMinutos = 30;
      const metaSemanalMinutos = metaDiariaMinutos * 7;

      // Tiempo estudiado hoy
      const [tiempoHoy] = await db.execute(`
        SELECT SUM(tiempo_minutos) as minutos_hoy
        FROM tiempo_estudio 
        WHERE id_usuario = ?
        AND DATE(fecha) = CURDATE()
      `, [id_usuario]);

      // Tiempo estudiado esta semana
      const [tiempoSemana] = await db.execute(`
        SELECT SUM(tiempo_minutos) as minutos_semana
        FROM tiempo_estudio 
        WHERE id_usuario = ?
        AND YEARWEEK(fecha, 1) = YEARWEEK(NOW(), 1)
      `, [id_usuario]);

      // Días consecutivos estudiando
      const [rachaConsecutiva] = await db.execute(`
        SELECT COUNT(*) as dias_consecutivos
        FROM (
          SELECT DISTINCT DATE(fecha) as fecha_estudio
          FROM tiempo_estudio 
          WHERE id_usuario = ?
          AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          ORDER BY fecha_estudio DESC
        ) as dias_unicos
        WHERE fecha_estudio >= DATE_SUB(CURDATE(), INTERVAL (
          SELECT COUNT(*) FROM (
            SELECT DISTINCT DATE(fecha) as fecha_check
            FROM tiempo_estudio t2
            WHERE t2.id_usuario = ?
            AND t2.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(fecha)
            HAVING DATE(fecha) = DATE_SUB(CURDATE(), INTERVAL (@row_number := @row_number + 1) - 1 DAY)
          ) as consecutivas
          CROSS JOIN (SELECT @row_number := 0) as r
        ) DAY)
      `, [id_usuario, id_usuario]);

      const metas = {
        meta_diaria: {
          objetivo_minutos: metaDiariaMinutos,
          actual_minutos: tiempoHoy[0].minutos_hoy || 0,
          porcentaje: Math.min(100, Math.round(((tiempoHoy[0].minutos_hoy || 0) / metaDiariaMinutos) * 100)),
          completada: (tiempoHoy[0].minutos_hoy || 0) >= metaDiariaMinutos
        },
        meta_semanal: {
          objetivo_minutos: metaSemanalMinutos,
          actual_minutos: tiempoSemana[0].minutos_semana || 0,
          porcentaje: Math.min(100, Math.round(((tiempoSemana[0].minutos_semana || 0) / metaSemanalMinutos) * 100)),
          completada: (tiempoSemana[0].minutos_semana || 0) >= metaSemanalMinutos
        },
        racha_estudios: {
          dias_consecutivos: rachaConsecutiva[0].dias_consecutivos || 0,
          record_personal: rachaConsecutiva[0].dias_consecutivos || 0 // Simplificado, idealmente se guardaría el récord
        }
      };

      res.json({
        success: true,
        data: metas
      });

    } catch (error) {
      console.error('Error al obtener metas de estudio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Eliminar sesión de estudio (por si fue un error)
   */
  async eliminarSesionEstudio(req, res) {
    try {
      const { id } = req.params;
      const id_usuario = req.user.id;

      // Verificar que la sesión existe y pertenece al usuario
      const [sesionExists] = await db.execute(`
        SELECT id FROM tiempo_estudio 
        WHERE id = ? AND id_usuario = ?
      `, [id, id_usuario]);

      if (sesionExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sesión de estudio no encontrada'
        });
      }

      await db.execute(`
        DELETE FROM tiempo_estudio 
        WHERE id = ? AND id_usuario = ?
      `, [id, id_usuario]);

      res.json({
        success: true,
        message: 'Sesión de estudio eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar sesión de estudio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener comparativa con otros usuarios (opcional - gamificación)
   */
  async obtenerComparativaTiempo(req, res) {
    try {
      const id_usuario = req.user.id;

      // Ranking del usuario en la semana actual
      const [ranking] = await db.execute(`
        SELECT 
          ranking.posicion,
          ranking.total_usuarios,
          ranking.minutos_semana
        FROM (
          SELECT 
            id_usuario,
            SUM(tiempo_minutos) as minutos_semana,
            ROW_NUMBER() OVER (ORDER BY SUM(tiempo_minutos) DESC) as posicion,
            (SELECT COUNT(DISTINCT id_usuario) FROM tiempo_estudio 
             WHERE YEARWEEK(fecha, 1) = YEARWEEK(NOW(), 1)) as total_usuarios
          FROM tiempo_estudio 
          WHERE YEARWEEK(fecha, 1) = YEARWEEK(NOW(), 1)
          GROUP BY id_usuario
        ) as ranking
        WHERE ranking.id_usuario = ?
      `, [id_usuario]);

      // Promedio general de usuarios activos
      const [promedioGeneral] = await db.execute(`
        SELECT 
          AVG(minutos_semana) as promedio_semanal
        FROM (
          SELECT 
            id_usuario,
            SUM(tiempo_minutos) as minutos_semana
          FROM tiempo_estudio 
          WHERE YEARWEEK(fecha, 1) = YEARWEEK(NOW(), 1)
          GROUP BY id_usuario
        ) as usuarios_activos
      `);

      const comparativa = {
        mi_posicion: ranking.length > 0 ? ranking[0].posicion : null,
        total_usuarios_activos: ranking.length > 0 ? ranking[0].total_usuarios : 0,
        mis_minutos_semana: ranking.length > 0 ? ranking[0].minutos_semana : 0,
        promedio_usuarios: Math.round(promedioGeneral[0].promedio_semanal || 0),
        percentil: ranking.length > 0 && ranking[0].total_usuarios > 0 
          ? Math.round((1 - (ranking[0].posicion - 1) / ranking[0].total_usuarios) * 100)
          : 0
      };

      res.json({
        success: true,
        data: comparativa
      });

    } catch (error) {
      console.error('Error al obtener comparativa de tiempo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = new TiempoController();