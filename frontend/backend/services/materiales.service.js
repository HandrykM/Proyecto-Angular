// backend/services/materiales.service.js
const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;

class MaterialesService {
  
  async obtenerMaterialesModulo(moduloId) {
    try {
      const [materiales] = await db.query(`
        SELECT * FROM materiales_modulo 
        WHERE modulo_id = ? 
        ORDER BY orden ASC
      `, [moduloId]);
      
      return materiales;
    } catch (error) {
      console.error('Error obteniendo materiales:', error);
      throw error;
    }
  }
  
  async obtenerMaterialPorId(materialId) {
    try {
      const [material] = await db.query(
        'SELECT * FROM materiales_modulo WHERE id = ?',
        [materialId]
      );
      
      return material[0] || null;
    } catch (error) {
      console.error('Error obteniendo material:', error);
      throw error;
    }
  }
  
  async descargarMaterial(materialId) {
    const material = await this.obtenerMaterialPorId(materialId);
    
    if (!material) {
      throw new Error('Material no encontrado');
    }
    
    // Extraer solo el nombre del archivo de la URL
    const filename = material.filename || material.url.split('/').pop();
    const filePath = path.join(__dirname, '../uploads/materiales', filename);
    
    //console.log('🔍 Buscando archivo:', filePath);
    
    try {
      await fsPromises.access(filePath);
    } catch (err) {
      console.error('❌ Archivo no encontrado:', filePath);
      throw new Error('Archivo no encontrado en el servidor');
    }
    
    return {
      filePath,
      filename,
      tipo: material.tipo
    };
  }
  
  async crearMaterial(datos) {
    try {
      const [result] = await db.query(`
        INSERT INTO materiales_modulo (
          modulo_id, titulo, descripcion, tipo, url, filename, icono, orden
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        datos.modulo_id,
        datos.titulo,
        datos.descripcion || datos.titulo,
        datos.tipo,
        datos.url,
        datos.filename,
        datos.icono || this.obtenerIconoPorTipo(datos.tipo),
        datos.orden || 1
      ]);
      
      return result.insertId;
    } catch (error) {
      console.error('Error creando material:', error);
      throw error;
    }
  }
  
  obtenerIconoPorTipo(tipo) {
    const iconos = {
      'infografia': 'fas fa-image',
      'guia': 'fas fa-file-pdf',
      'video': 'fas fa-video',
      'otro': 'fas fa-file'
    };
    return iconos[tipo] || 'fas fa-file';
  }
}

module.exports = new MaterialesService();