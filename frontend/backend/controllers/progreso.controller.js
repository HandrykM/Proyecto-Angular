const db = require('../config/db');
const { validationResult } = require('express-validator');

class ProgresoController {
  /**
   * Marcar lectura como completada
   */
  async marcarLecturaCompletada(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: errors.array()
        });
      }

      const { id_lectura, id_modulo } = req.body;
      const id_usuario = req.user.id;

      // Verificar que la lectura existe
      const [lecturaExists] = await db.execute(`
        SELECT id FROM contenido WHERE id = ? AND modulo_id = ?
      `, [id_lectura, id_modulo]);

      if (lecturaExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Lectura no encontrada'
        });
      }

      // Verificar si ya está marcada como completada
      const [existing] = await db.execute(`
        SELECT id, leido FROM progreso_contenido 
        WHERE id_usuario = ? AND id_contenido = ?
      `, [id_usuario, id_lectura]);

      if (existing.length > 0) {
        if (existing[0].leido) {
          return res.json({
            success: true,
            message: 'Lectura ya estaba completada',
            nuevo_progreso: await this.calcularProgresoModulo(id_usuario, id_modulo)
          });
        }
        
        // Actualizar existente
        await db.execute(`
          UPDATE progreso_contenido 
          SET leido = 1, fecha_lectura = NOW()
          WHERE id_usuario = ? AND id_contenido = ?
        `, [id_usuario, id_lectura]);
      } else {
        // Insertar nuevo registro
        await db.execute(`
          INSERT INTO progreso_contenido (id_usuario, id_contenido, leido, fecha_lectura)
          VALUES (?, ?, 1, NOW())
        `, [id_usuario, id_lectura]);
      }

      // Calcular nuevo progreso del módulo
      const nuevoProgreso = await this.calcularProgresoModulo(id_usuario, id_modulo);
      
      // Actualizar dashboard del usuario
      await this.actualizarDashboard(id_usuario);
      
      res.json({
        success: true,
        message: 'Lectura marcada como completada',
        nuevo_progreso: nuevoProgreso,
        desbloqueado: nuevoProgreso >= 80 // Se desbloquea el siguiente módulo si está al 80%
      });

    } catch (error) {
      console.error('Error al marcar lectura completada:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener progreso detallado de todos los módulos
   */
  async obtenerProgresoDetallado(req, res) {
    try {
      const id_usuario = req.user.id;

      const query = `
        SELECT 
          m.id as modulo_id,
          m.titulo,
          m.nivel,
          COUNT(c.id) as total_lecturas,
          COUNT(CASE WHEN pc.leido = 1 THEN 1 END) as lecturas_completadas,
          COALESCE(
            ROUND(
              COUNT(CASE WHEN pc.leido = 1 THEN 1 END) * 100.0 / 
              GREATEST(COUNT(c.id), 1)
            ), 0
          ) as progreso_porcentaje,
          m.orden
        FROM modulos m
        LEFT JOIN contenido c ON m.id = c.modulo_id
        LEFT JOIN progreso_contenido pc ON c.id = pc.id_contenido AND pc.id_usuario = ?
        WHERE m.activo = 1
        GROUP BY m.id, m.titulo, m.nivel, m.orden
        ORDER BY m.orden ASC
      `;

      const [progreso] = await db.execute(query, [id_usuario]);
      
      // Determinar qué módulos están desbloqueados
      const progresoConBloqueo = progreso.map((modulo, index) => {
        let desbloqueado = true;
        if (index > 0) {
          const moduloAnterior = progreso[index - 1];
          desbloqueado = moduloAnterior.progreso_porcentaje >= 80;
        }
        
        return {
          ...modulo,
          desbloqueado
        };
      });

      res.json({
        success: true,
        data: progresoConBloqueo
      });

    } catch (error) {
      console.error('Error al obtener progreso detallado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener estadísticas generales de progreso
   */
  async obtenerEstadisticasProgreso(req, res) {
    try {
      const id_usuario = req.user.id;

      // Progreso total
      const [progresoTotal] = await db.execute(`
        SELECT 
          COALESCE(AVG(
            CASE 
              WHEN total_lecturas > 0 THEN (lecturas_completadas * 100.0 / total_lecturas)
              ELSE 0 
            END
          ), 0) as progreso_promedio
        FROM (
          SELECT 
            m.id,
            COUNT(c.id) as total_lecturas,
            COUNT(CASE WHEN pc.leido = 1 THEN 1 END) as lecturas_completadas
          FROM modulos m
          LEFT JOIN contenido c ON m.id = c.modulo_id
          LEFT JOIN progreso_contenido pc ON c.id = pc.id_contenido AND pc.id_usuario = ?
          WHERE m.activo = 1
          GROUP BY m.id
        ) as modulo_stats
      `, [id_usuario]);

      // Módulos completados
      const [modulosCompletados] = await db.execute(`
        SELECT COUNT(*) as total
        FROM (
          SELECT 
            m.id,
            COUNT(c.id) as total_lecturas,
            COUNT(CASE WHEN pc.leido = 1 THEN 1 END) as lecturas_completadas
          FROM modulos m
          LEFT JOIN contenido c ON m.id = c.modulo_id
          LEFT JOIN progreso_contenido pc ON c.id = pc.id_contenido AND pc.id_usuario = ?
          WHERE m.activo = 1
          GROUP BY m.id
          HAVING total_lecturas > 0 AND lecturas_completadas = total_lecturas
        ) as completados
      `, [id_usuario]);

      // Lecturas completadas
      const [lecturasCompletadas] = await db.execute(`
        SELECT COUNT(*) as total
        FROM progreso_contenido pc
        JOIN contenido c ON pc.id_contenido = c.id
        JOIN modulos m ON c.modulo_id = m.id
        WHERE pc.id_usuario = ? AND pc.leido = 1 AND m.activo = 1
      `, [id_usuario]);

      // Última actividad
      const [ultimaActividad] = await db.execute(`
        SELECT MAX(fecha_lectura) as ultima_fecha
        FROM progreso_contenido
        WHERE id_usuario = ?
      `, [id_usuario]);

      // Total de tiempo estudiado (si existe la tabla)
      const [tiempoEstudiado] = await db.execute(`
        SELECT COALESCE(SUM(tiempo_minutos), 0) as total_minutos
        FROM tiempo_estudio
        WHERE id_usuario = ?
      `, [id_usuario]).catch(() => [[{total_minutos: 0}]]);

      res.json({
        success: true,
        data: {
          progreso_total: Math.round(progresoTotal[0].progreso_promedio),
          modulos_completados: modulosCompletados[0].total,
          lecturas_completadas: lecturasCompletadas[0].total,
          ultima_actividad: ultimaActividad[0].ultima_fecha,
          tiempo_estudiado_minutos: tiempoEstudiado[0].total_minutos,
          tiempo_estudiado_horas: Math.round(tiempoEstudiado[0].total_minutos / 60 * 100) / 100
        }
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Resetear progreso de un módulo específico
   */
  async resetearProgresoModulo(req, res) {
    try {
      const { id } = req.params; // ID del módulo
      const id_usuario = req.user.id;

      // Verificar que el módulo existe
      const [moduloExists] = await db.execute(`
        SELECT id FROM modulos WHERE id = ?
      `, [id]);

      if (moduloExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Módulo no encontrado'
        });
      }

      // Eliminar progreso del módulo
      await db.execute(`
        DELETE pc FROM progreso_contenido pc
        JOIN contenido c ON pc.id_contenido = c.id
        WHERE c.modulo_id = ? AND pc.id_usuario = ?
      `, [id, id_usuario]);

      // Actualizar dashboard
      await this.actualizarDashboard(id_usuario);

      res.json({
        success: true,
        message: 'Progreso del módulo reseteado exitosamente'
      });

    } catch (error) {
      console.error('Error al resetear progreso:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Resetear todo el progreso del usuario
   */
  async resetearProgresoCompleto(req, res) {
    try {
      const id_usuario = req.user.id;

      // Eliminar todo el progreso
      await db.execute(`
        DELETE FROM progreso_contenido WHERE id_usuario = ?
      `, [id_usuario]);

      // Eliminar tiempo de estudio
      await db.execute(`
        DELETE FROM tiempo_estudio WHERE id_usuario = ?
      `, [id_usuario]);

      // Eliminar notas
      await db.execute(`
        DELETE FROM notas_lectura WHERE id_usuario = ?
      `, [id_usuario]);

      // Resetear dashboard
      await db.execute(`
        UPDATE dashboard SET 
          progreso_total = 0,
          total_contenido_leido = 0,
          ultima_actividad = NULL
        WHERE id_usuario = ?
      `, [id_usuario]);

      res.json({
        success: true,
        message: 'Progreso completo reseteado exitosamente'
      });

    } catch (error) {
      console.error('Error al resetear progreso completo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener historial de actividad
   */
  async obtenerHistorialActividad(req, res) {
    try {
      const id_usuario = req.user.id;
      const limite = parseInt(req.query.limite) || 20;

      const query = `
        SELECT 
          c.titulo as lectura_titulo,
          m.titulo as modulo_titulo,
          pc.fecha_lectura as fecha,
          'lectura_completada' as tipo
        FROM progreso_contenido pc
        JOIN contenido c ON pc.id_contenido = c.id
        JOIN modulos m ON c.modulo_id = m.id
        WHERE pc.id_usuario = ? AND pc.leido = 1
        ORDER BY pc.fecha_lectura DESC
        LIMIT ?
      `;

      const [actividades] = await db.execute(query, [id_usuario, limite]);

      res.json({
        success: true,
        data: actividades
      });

    } catch (error) {
      console.error('Error al obtener historial:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // === MÉTODOS AUXILIARES === //

  /**
   * Calcular progreso de un módulo específico
   */
  async calcularProgresoModulo(id_usuario, id_modulo) {
    try {
      const [resultado] = await db.execute(`
        SELECT 
          COUNT(c.id) as total_lecturas,
          COUNT(CASE WHEN pc.leido = 1 THEN 1 END) as lecturas_completadas
        FROM contenido c
        LEFT JOIN progreso_contenido pc ON c.id = pc.id_contenido AND pc.id_usuario = ?
        WHERE c.modulo_id = ?
      `, [id_usuario, id_modulo]);

      const { total_lecturas, lecturas_completadas } = resultado[0];
      
      if (total_lecturas === 0) return 0;
      
      return Math.round((lecturas_completadas / total_lecturas) * 100);
    } catch (error) {
      console.error('Error calculando progreso:', error);
      return 0;
    }
  }

  /**
   * Actualizar dashboard del usuario
   */
  async actualizarDashboard(id_usuario) {
    try {
      // Calcular estadísticas actuales
      const [stats] = await db.execute(`
        SELECT 
          COUNT(CASE WHEN pc.leido = 1 THEN 1 END) as contenido_leido,
          COALESCE(AVG(
            CASE 
              WHEN total_lecturas > 0 THEN (lecturas_completadas * 100.0 / total_lecturas)
              ELSE 0 
            END
          ), 0) as progreso_promedio
        FROM (
          SELECT 
            m.id,
            COUNT(c.id) as total_lecturas,
            COUNT(CASE WHEN pc.leido = 1 THEN 1 END) as lecturas_completadas
          FROM modulos m
          LEFT JOIN contenido c ON m.id = c.modulo_id
          LEFT JOIN progreso_contenido pc ON c.id = pc.id_contenido AND pc.id_usuario = ?
          WHERE m.activo = 1
          GROUP BY m.id
        ) as modulo_stats
      `, [id_usuario]);

      const { contenido_leido, progreso_promedio } = stats[0];

      // Actualizar o insertar dashboard
      await db.execute(`
        INSERT INTO dashboard (id_usuario, progreso_total, total_contenido_leido, ultima_actividad)
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
        progreso_total = VALUES(progreso_total),
        total_contenido_leido = VALUES(total_contenido_leido),
        ultima_actividad = VALUES(ultima_actividad)
      `, [id_usuario, Math.round(progreso_promedio), contenido_leido]);

    } catch (error) {
      console.error('Error actualizando dashboard:', error);
    }
  }
}

module.exports = new ProgresoController();