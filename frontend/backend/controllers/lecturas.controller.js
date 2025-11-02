// backend/controllers/lecturas.controller.js
const db = require('../config/db');

class LecturasController {
  /**
   * Obtener todas las lecturas de un módulo con progreso del usuario
   */
  async obtenerLecturasModulo(req, res) {
    try {
      const { id_modulo } = req.params;
      const userId = req.user.id;

      const query = `
        SELECT 
          l.*, 
          COALESCE(pl.porcentaje_leido, 0) as porcentaje_leido,
          COALESCE(pl.posicion_scroll, 0) as posicion_scroll,
          COALESCE(pl.tiempo_lectura, 0) as tiempo_lectura,
          COALESCE(pl.completado, 0) as completado,
          pl.fecha_ultima_lectura
        FROM lecturas l
        LEFT JOIN progreso_lectura pl ON l.id = pl.id_lectura AND pl.id_usuario = ?
        WHERE l.id_modulo = ? AND l.activo = 1
        ORDER BY l.orden ASC
      `;
      
      const [lecturas] = await db.execute(query, [userId, id_modulo]);

      res.json({
        success: true,
        data: lecturas
      });

    } catch (error) {
      console.error('Error obteniendo lecturas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }


  /**
   * Obtener una lectura específica con su progreso
   */
  async obtenerLectura(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    //console.log('🔍 Obteniendo lectura ID:', id, 'para usuario:', userId);

    const query = `
      SELECT 
        l.*,
        m.titulo as modulo_titulo,
        m.color as modulo_color,
        COALESCE(pl.completada, 0) as completado
      FROM lecturas l
      JOIN modulos m ON l.modulo_id = m.id
      LEFT JOIN progreso_lecturas pl ON l.id = pl.lectura_id AND pl.usuario_id = ?
      WHERE l.id = ? AND l.activa = 1
    `;

    const [lectura] = await db.execute(query, [userId, id]);

    if (lectura.length === 0) {
      console.error('❌ Lectura no encontrada:', id);
      return res.status(404).json({ error: 'Lectura no encontrada' });
    }

   /* console.log('✅ Lectura encontrada:', {
      id: lectura[0].id,
      titulo: lectura[0].titulo,
      tieneContenido: !!lectura[0].contenido,
      longitudContenido: lectura[0].contenido?.length || 0
    });*/

    res.json({
      success: true,
      data: lectura[0]
    });

  } catch (error) {
    console.error('❌ Error obteniendo lectura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

  /**
   * Guardar progreso de lectura (scroll y tiempo)
   */
  async guardarProgresoLectura(req, res) {
    try {
      const { id_lectura, porcentaje_leido, posicion_scroll, tiempo_lectura, completado } = req.body;
      const userId = req.user.id;

      if (!id_lectura) {
        return res.status(400).json({ error: 'ID de lectura requerido' });
      }

      // Verificar que la lectura existe
      const [lecturaExists] = await db.execute(
        'SELECT id FROM lecturas WHERE id = ?',
        [id_lectura]
      );

      if (lecturaExists.length === 0) {
        return res.status(404).json({ error: 'Lectura no encontrada' });
      }

      // Insertar o actualizar progreso
      await db.execute(`
        INSERT INTO progreso_lectura (
          id_usuario, id_lectura, porcentaje_leido, posicion_scroll, 
          tiempo_lectura, completado, fecha_inicio, fecha_ultima_lectura
        )
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          porcentaje_leido = VALUES(porcentaje_leido),
          posicion_scroll = VALUES(posicion_scroll),
          tiempo_lectura = VALUES(tiempo_lectura),
          completado = VALUES(completado),
          fecha_ultima_lectura = NOW()
      `, [userId, id_lectura, porcentaje_leido || 0, posicion_scroll || 0, tiempo_lectura || 0, completado || 0]);

      res.json({
        success: true,
        mensaje: 'Progreso guardado exitosamente'
      });

    } catch (error) {
      console.error('Error guardando progreso de lectura:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener progreso de una lectura específica
   */
  async obtenerProgresoLectura(req, res) {
    try {
      const { id_lectura } = req.params;
      const userId = req.user.id;

      const [progreso] = await db.execute(`
        SELECT 
          porcentaje_leido,
          posicion_scroll,
          tiempo_lectura,
          completado,
          fecha_ultima_lectura
        FROM progreso_lectura
        WHERE id_usuario = ? AND id_lectura = ?
      `, [userId, id_lectura]);

      if (progreso.length === 0) {
        return res.json({
          success: true,
          data: null
        });
      }

      res.json({
        success: true,
        data: progreso[0]
      });

    } catch (error) {
      console.error('Error obteniendo progreso:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Crear nueva lectura (solo admin)
   */
  async crearLectura(req, res) {
    try {
      if (req.user.rol !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos para crear lecturas' });
      }

      const { id_modulo, titulo, descripcion, contenido, orden, duracion_estimada, puntos } = req.body;

      if (!id_modulo || !titulo || !contenido) {
        return res.status(400).json({ 
          error: 'Campos requeridos: id_modulo, titulo, contenido' 
        });
      }

      // Verificar que el módulo existe
      const [moduloExists] = await db.execute(
        'SELECT id FROM modulos WHERE id = ?',
        [id_modulo]
      );

      if (moduloExists.length === 0) {
        return res.status(404).json({ error: 'Módulo no encontrado' });
      }

      const [result] = await db.execute(`
        INSERT INTO lecturas (
          id_modulo, titulo, descripcion, contenido, 
          orden, duracion_estimada, puntos, activo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        id_modulo,
        titulo,
        descripcion || '',
        contenido,
        orden || 1,
        duracion_estimada || 10,
        puntos || 50
      ]);

      res.status(201).json({
        success: true,
        mensaje: 'Lectura creada exitosamente',
        data: { id: result.insertId }
      });

    } catch (error) {
      console.error('Error creando lectura:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Actualizar lectura (solo admin)
   */
  async actualizarLectura(req, res) {
    try {
      if (req.user.rol !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos para actualizar lecturas' });
      }

      const { id } = req.params;
      const updateFields = req.body;

      const allowedFields = [
        'titulo', 'descripcion', 'contenido', 'orden', 
        'duracion_estimada', 'puntos', 'activo'
      ];

      const updates = [];
      const values = [];

      Object.keys(updateFields).forEach(field => {
        if (allowedFields.includes(field)) {
          updates.push(`${field} = ?`);
          values.push(updateFields[field]);
        }
      });

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
      }

      values.push(id);

      await db.execute(`
        UPDATE lecturas 
        SET ${updates.join(', ')}, fecha_actualizacion = NOW()
        WHERE id = ?
      `, values);

      res.json({
        success: true,
        mensaje: 'Lectura actualizada exitosamente'
      });

    } catch (error) {
      console.error('Error actualizando lectura:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Eliminar lectura (soft delete - solo admin)
   */
  async eliminarLectura(req, res) {
    try {
      if (req.user.rol !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos para eliminar lecturas' });
      }

      const { id } = req.params;

      await db.execute(`
        UPDATE lecturas 
        SET activo = 0, fecha_actualizacion = NOW()
        WHERE id = ?
      `, [id]);

      res.json({
        success: true,
        mensaje: 'Lectura eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando lectura:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Reordenar lecturas de un módulo
   */
  async reordenarLecturas(req, res) {
    try {
      if (req.user.rol !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos para reordenar lecturas' });
      }

      const { id_modulo, orden } = req.body;

      if (!id_modulo || !Array.isArray(orden)) {
        return res.status(400).json({ error: 'Datos inválidos' });
      }

      // Actualizar orden de cada lectura
      for (let i = 0; i < orden.length; i++) {
        await db.execute(`
          UPDATE lecturas 
          SET orden = ?
          WHERE id = ? AND id_modulo = ?
        `, [i + 1, orden[i], id_modulo]);
      }

      res.json({
        success: true,
        mensaje: 'Lecturas reordenadas exitosamente'
      });

    } catch (error) {
      console.error('Error reordenando lecturas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener estadísticas de una lectura
   */
  async obtenerEstadisticasLectura(req, res) {
    try {
      const { id } = req.params;

      // Total de usuarios que han leído
      const [totalLectores] = await db.execute(`
        SELECT COUNT(DISTINCT id_usuario) as total
        FROM progreso_lectura
        WHERE id_lectura = ?
      `, [id]);

      // Usuarios que completaron
      const [completados] = await db.execute(`
        SELECT COUNT(*) as total
        FROM progreso_lectura
        WHERE id_lectura = ? AND completado = 1
      `, [id]);

      // Tiempo promedio de lectura
      const [tiempoPromedio] = await db.execute(`
        SELECT AVG(tiempo_lectura) as promedio
        FROM progreso_lectura
        WHERE id_lectura = ? AND tiempo_lectura > 0
      `, [id]);

      // Porcentaje promedio leído
      const [porcentajePromedio] = await db.execute(`
        SELECT AVG(porcentaje_leido) as promedio
        FROM progreso_lectura
        WHERE id_lectura = ?
      `, [id]);

      res.json({
        success: true,
        data: {
          total_lectores: totalLectores[0].total,
          total_completados: completados[0].total,
          tasa_completacion: totalLectores[0].total > 0 
            ? Math.round((completados[0].total / totalLectores[0].total) * 100) 
            : 0,
          tiempo_promedio_minutos: Math.round(tiempoPromedio[0].promedio || 0),
          porcentaje_promedio_leido: Math.round(porcentajePromedio[0].promedio || 0)
        }
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = new LecturasController();