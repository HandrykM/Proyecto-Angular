const db = require('../config/db');
const { validationResult } = require('express-validator');

class NotasController {
  /**
   * Guardar o actualizar notas de una lectura
   */
  async guardarNotasLectura(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: errors.array()
        });
      }

      const { id_lectura, contenido } = req.body;
      const id_usuario = req.user.id;

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

      // Verificar si ya existen notas para esta lectura
      const [existingNotes] = await db.execute(`
        SELECT id FROM notas_lectura 
        WHERE id_usuario = ? AND id_lectura = ?
      `, [id_usuario, id_lectura]);

      if (existingNotes.length > 0) {
        // Actualizar notas existentes
        await db.execute(`
          UPDATE notas_lectura 
          SET contenido = ?, fecha_modificacion = NOW()
          WHERE id_usuario = ? AND id_lectura = ?
        `, [contenido, id_usuario, id_lectura]);
      } else {
        // Crear nuevas notas
        await db.execute(`
          INSERT INTO notas_lectura (id_usuario, id_lectura, contenido, fecha_creacion, fecha_modificacion)
          VALUES (?, ?, ?, NOW(), NOW())
        `, [id_usuario, id_lectura, contenido]);
      }

      res.json({
        success: true,
        message: 'Notas guardadas exitosamente'
      });

    } catch (error) {
      console.error('Error al guardar notas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener notas de una lectura específica
   */
  async obtenerNotasLectura(req, res) {
    try {
      const { idUsuario, idLectura } = req.params;
      
      // Verificar que el usuario puede acceder a estas notas
      if (parseInt(idUsuario) !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a estas notas'
        });
      }

      const [notas] = await db.execute(`
        SELECT contenido, fecha_creacion, fecha_modificacion
        FROM notas_lectura 
        WHERE id_usuario = ? AND id_lectura = ?
      `, [idUsuario, idLectura]);

      if (notas.length === 0) {
        return res.json({
          success: true,
          contenido: '',
          fecha_creacion: null,
          fecha_modificacion: null
        });
      }

      res.json({
        success: true,
        contenido: notas[0].contenido,
        fecha_creacion: notas[0].fecha_creacion,
        fecha_modificacion: notas[0].fecha_modificacion
      });

    } catch (error) {
      console.error('Error al obtener notas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener todas las notas del usuario
   */
  async obtenerTodasLasNotas(req, res) {
    try {
      const id_usuario = req.user.id;
      const limite = parseInt(req.query.limite) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const query = `
        SELECT 
          nl.id,
          nl.contenido,
          nl.fecha_creacion,
          nl.fecha_modificacion,
          c.titulo as lectura_titulo,
          m.titulo as modulo_titulo,
          m.color as modulo_color
        FROM notas_lectura nl
        JOIN contenido c ON nl.id_lectura = c.id
        JOIN modulos m ON c.modulo_id = m.id
        WHERE nl.id_usuario = ? 
        AND nl.contenido IS NOT NULL 
        AND nl.contenido != ''
        ORDER BY nl.fecha_modificacion DESC
        LIMIT ? OFFSET ?
      `;

      const [notas] = await db.execute(query, [id_usuario, limite, offset]);

      // Contar total de notas
      const [countResult] = await db.execute(`
        SELECT COUNT(*) as total
        FROM notas_lectura nl
        JOIN contenido c ON nl.id_lectura = c.id
        WHERE nl.id_usuario = ? 
        AND nl.contenido IS NOT NULL 
        AND nl.contenido != ''
      `, [id_usuario]);

      res.json({
        success: true,
        data: notas,
        pagination: {
          total: countResult[0].total,
          limite: limite,
          offset: offset,
          hasMore: (offset + limite) < countResult[0].total
        }
      });

    } catch (error) {
      console.error('Error al obtener todas las notas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Buscar en las notas del usuario
   */
  async buscarEnNotas(req, res) {
    try {
      const id_usuario = req.user.id;
      const { q } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'La búsqueda debe tener al menos 2 caracteres'
        });
      }

      const termino = `%${q.trim()}%`;

      const query = `
        SELECT 
          nl.id,
          nl.contenido,
          nl.fecha_creacion,
          nl.fecha_modificacion,
          c.titulo as lectura_titulo,
          m.titulo as modulo_titulo,
          m.color as modulo_color,
          c.id as lectura_id,
          m.id as modulo_id
        FROM notas_lectura nl
        JOIN contenido c ON nl.id_lectura = c.id
        JOIN modulos m ON c.modulo_id = m.id
        WHERE nl.id_usuario = ? 
        AND (
          nl.contenido LIKE ? OR 
          c.titulo LIKE ? OR 
          m.titulo LIKE ?
        )
        ORDER BY nl.fecha_modificacion DESC
        LIMIT 20
      `;

      const [resultados] = await db.execute(query, [
        id_usuario, termino, termino, termino
      ]);

      res.json({
        success: true,
        data: resultados,
        termino_busqueda: q
      });

    } catch (error) {
      console.error('Error al buscar notas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Eliminar notas de una lectura
   */
  async eliminarNotasLectura(req, res) {
    try {
      const { idLectura } = req.params;
      const id_usuario = req.user.id;

      // Verificar que las notas existen
      const [existing] = await db.execute(`
        SELECT id FROM notas_lectura 
        WHERE id_usuario = ? AND id_lectura = ?
      `, [id_usuario, idLectura]);

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notas no encontradas'
        });
      }

      await db.execute(`
        DELETE FROM notas_lectura 
        WHERE id_usuario = ? AND id_lectura = ?
      `, [id_usuario, idLectura]);

      res.json({
        success: true,
        message: 'Notas eliminadas exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar notas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Exportar todas las notas del usuario
   */
  async exportarNotas(req, res) {
    try {
      const id_usuario = req.user.id;

      const query = `
        SELECT 
          nl.contenido,
          nl.fecha_creacion,
          nl.fecha_modificacion,
          c.titulo as lectura_titulo,
          m.titulo as modulo_titulo,
          m.nivel as modulo_nivel
        FROM notas_lectura nl
        JOIN contenido c ON nl.id_lectura = c.id
        JOIN modulos m ON c.modulo_id = m.id
        WHERE nl.id_usuario = ? 
        AND nl.contenido IS NOT NULL 
        AND nl.contenido != ''
        ORDER BY m.orden, c.id
      `;

      const [notas] = await db.execute(query, [id_usuario]);

      if (notas.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No hay notas para exportar'
        });
      }

      // Generar contenido del archivo
      let contenidoExportacion = '# Mis Notas de Estudio - HydroSave\n\n';
      contenidoExportacion += `Exportado el: ${new Date().toLocaleDateString('es-CO')}\n\n`;

      let moduloActual = '';
      notas.forEach(nota => {
        if (nota.modulo_titulo !== moduloActual) {
          moduloActual = nota.modulo_titulo;
          contenidoExportacion += `## ${moduloActual}\n\n`;
        }
        
        contenidoExportacion += `### ${nota.lectura_titulo}\n`;
        contenidoExportacion += `**Fecha de creación:** ${new Date(nota.fecha_creacion).toLocaleDateString('es-CO')}\n`;
        contenidoExportacion += `**Última modificación:** ${new Date(nota.fecha_modificacion).toLocaleDateString('es-CO')}\n\n`;
        contenidoExportacion += `${nota.contenido}\n\n`;
        contenidoExportacion += '---\n\n';
      });

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', 'attachment; filename="mis-notas-hydrosave.md"');
      
      res.send(contenidoExportacion);

    } catch (error) {
      console.error('Error al exportar notas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener estadísticas de notas del usuario
   */
  async obtenerEstadisticasNotas(req, res) {
    try {
      const id_usuario = req.user.id;

      // Total de notas
      const [totalNotas] = await db.execute(`
        SELECT COUNT(*) as total
        FROM notas_lectura 
        WHERE id_usuario = ? 
        AND contenido IS NOT NULL 
        AND contenido != ''
      `, [id_usuario]);

      // Notas por módulo
      const [notasPorModulo] = await db.execute(`
        SELECT 
          m.titulo as modulo,
          m.color,
          COUNT(*) as cantidad
        FROM notas_lectura nl
        JOIN contenido c ON nl.id_lectura = c.id
        JOIN modulos m ON c.modulo_id = m.id
        WHERE nl.id_usuario = ? 
        AND nl.contenido IS NOT NULL 
        AND nl.contenido != ''
        GROUP BY m.id, m.titulo, m.color
        ORDER BY cantidad DESC
      `, [id_usuario]);

      // Actividad reciente (últimos 7 días)
      const [actividadReciente] = await db.execute(`
        SELECT 
          DATE(fecha_modificacion) as fecha,
          COUNT(*) as notas_modificadas
        FROM notas_lectura 
        WHERE id_usuario = ? 
        AND fecha_modificacion >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND contenido IS NOT NULL 
        AND contenido != ''
        GROUP BY DATE(fecha_modificacion)
        ORDER BY fecha DESC
      `, [id_usuario]);

      // Promedio de caracteres por nota
      const [promedioCaracteres] = await db.execute(`
        SELECT 
          AVG(LENGTH(contenido)) as promedio,
          MIN(LENGTH(contenido)) as minimo,
          MAX(LENGTH(contenido)) as maximo
        FROM notas_lectura 
        WHERE id_usuario = ? 
        AND contenido IS NOT NULL 
        AND contenido != ''
      `, [id_usuario]);

      res.json({
        success: true,
        data: {
          total_notas: totalNotas[0].total,
          notas_por_modulo: notasPorModulo,
          actividad_reciente: actividadReciente,
          estadisticas_contenido: {
            promedio_caracteres: Math.round(promedioCaracteres[0].promedio || 0),
            nota_mas_corta: promedioCaracteres[0].minimo || 0,
            nota_mas_larga: promedioCaracteres[0].maximo || 0
          }
        }
      });

    } catch (error) {
      console.error('Error al obtener estadísticas de notas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = new NotasController();