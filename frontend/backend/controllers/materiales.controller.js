// backend/controllers/materiales.controller.js
const db = require('../config/db');
const path = require('path');
const fs = require('fs').promises;

class MaterialesController {
  /**
   * Subir material adicional al servidor
   */
  async subirMaterial(req, res) {
  try {
    const { id_modulo, titulo, descripcion, tipo } = req.body;
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    const archivoUrl = `/uploads/materiales/${req.file.filename}`;
    
    // ✅ CORRECCIÓN: No usar filename como titulo automáticamente
    const tituloFinal = titulo && titulo.trim() !== '' 
      ? titulo 
      : req.file.originalname; // Solo usar filename si no hay titulo
    
    const descripcionFinal = descripcion && descripcion.trim() !== '' 
      ? descripcion 
      : ''; // Dejar vacío si no hay descripción
    
    // Guardar referencia en la base de datos
    const [result] = await db.execute(`
      INSERT INTO materiales_adicionales 
      (id_modulo, titulo, descripcion, tipo, url_archivo, nombre_archivo, tamaño, fecha_subida)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      id_modulo,
      tituloFinal,
      descripcionFinal,
      tipo,
      archivoUrl,
      req.file.originalname,
      req.file.size
    ]);

    res.json({
      success: true,
      mensaje: 'Material subido exitosamente',
      data: {
        id: result.insertId,
        url: archivoUrl,
        nombre: req.file.originalname
      }
    });

  } catch (error) {
    console.error('Error subiendo material:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

  /**
   * Obtener materiales de un módulo
   */
  async obtenerMaterialesModulo(req, res) {
    try {
      const { id_modulo } = req.params;

      const [materiales] = await db.execute(`
        SELECT 
          id, titulo, descripcion, tipo, url_archivo, 
          nombre_archivo, tamaño, fecha_subida
        FROM materiales_adicionales
        WHERE id_modulo = ? AND activo = 1
        ORDER BY fecha_subida DESC
      `, [id_modulo]);

      // Agregar iconos según el tipo
      const materialesConIcono = materiales.map(material => ({
        ...material,
        icono: this.obtenerIconoPorTipo(material.tipo),
        tamañoFormateado: this.formatearTamaño(material.tamaño)
      }));

      res.json({
        success: true,
        data: materialesConIcono
      });

    } catch (error) {
      console.error('Error obteniendo materiales:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Descargar material
   */
  async descargarMaterial(req, res) {
    try {
      const { id } = req.params;

      // Obtener información del material
      const [material] = await db.execute(`
        SELECT url_archivo, nombre_archivo, tipo 
        FROM materiales_adicionales 
        WHERE id = ? AND activo = 1
      `, [id]);

      if (material.length === 0) {
        return res.status(404).json({ error: 'Material no encontrado' });
      }

      const archivoPath = path.join(__dirname, '..', material[0].url_archivo);

      // Verificar que el archivo existe
      try {
        await fs.access(archivoPath);
      } catch (error) {
        return res.status(404).json({ error: 'Archivo no encontrado en el servidor' });
      }

      // Configurar headers para descarga
      res.setHeader('Content-Disposition', `attachment; filename="${material[0].nombre_archivo}"`);
      res.setHeader('Content-Type', this.obtenerMimeType(material[0].tipo));

      // Enviar archivo
      res.sendFile(archivoPath);

    } catch (error) {
      console.error('Error descargando material:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Eliminar material (soft delete)
   */
  async eliminarMaterial(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verificar permisos (solo admin puede eliminar)
      if (req.user.rol !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos para eliminar materiales' });
      }

      await db.execute(`
        UPDATE materiales_adicionales 
        SET activo = 0 
        WHERE id = ?
      `, [id]);

      res.json({
        success: true,
        mensaje: 'Material eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando material:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Funciones auxiliares
  obtenerIconoPorTipo(tipo) {
    const iconos = {
      'pdf': 'fas fa-file-pdf',
      'video': 'fas fa-video',
      'imagen': 'fas fa-image',
      'documento': 'fas fa-file-alt',
      'presentacion': 'fas fa-file-powerpoint',
      'hoja_calculo': 'fas fa-file-excel',
      'otro': 'fas fa-file'
    };
    return iconos[tipo] || iconos['otro'];
  }

  obtenerMimeType(tipo) {
    const mimeTypes = {
      'pdf': 'application/pdf',
      'video': 'video/mp4',
      'imagen': 'image/jpeg',
      'documento': 'application/msword',
      'presentacion': 'application/vnd.ms-powerpoint',
      'hoja_calculo': 'application/vnd.ms-excel',
      'otro': 'application/octet-stream'
    };
    return mimeTypes[tipo] || mimeTypes['otro'];
  }

  formatearTamaño(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

module.exports = new MaterialesController();