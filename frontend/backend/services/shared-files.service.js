// backend/services/shared-files.service.js
const db = require('../config/db');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SharedFilesService {
  
  async calcularHashArchivo(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(buffer).digest('hex');
    } catch (error) {
      console.error('Error calculando hash:', error);
      throw error;
    }
  }

  async buscarArchivoPorHash(hash) {
    try {
      const [materiales] = await db.query(
        'SELECT * FROM materiales_modulo WHERE hash_archivo = ? LIMIT 1',
        [hash]
      );

      if (materiales.length > 0) {
        return {
          existe: true,
          url: materiales[0].url,
          filename: materiales[0].filename,
          tipo: materiales[0].tipo,
          fuente: 'materiales_modulo'
        };
      }

      const [biblioteca] = await db.query(
        'SELECT * FROM biblioteca WHERE hash_archivo = ? LIMIT 1',
        [hash]
      );

      if (biblioteca.length > 0) {
        return {
          existe: true,
          url: biblioteca[0].url,
          filename: path.basename(biblioteca[0].url),
          tipo: this.detectarTipoPorUrl(biblioteca[0].url),
          fuente: 'biblioteca'
        };
      }

      return { existe: false };
    } catch (error) {
      console.error('Error buscando archivo:', error);
      throw error;
    }
  }

  async procesarArchivo(file, uploadDir = 'uploads/materiales') {
    try {
      const tempPath = file.path;
      const hash = await this.calcularHashArchivo(tempPath);
      
      const archivoExistente = await this.buscarArchivoPorHash(hash);
      
      if (archivoExistente.existe) {
        await fs.unlink(tempPath);
        
        console.log(`✅ Archivo ya existe (hash: ${hash.substring(0, 8)}...), reutilizando: ${archivoExistente.filename}`);
        
        return {
          reutilizado: true,
          url: archivoExistente.url,
          filename: archivoExistente.filename,
          hash: hash,
          size: file.size,
          originalname: file.originalname
        };
      }

      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext)
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()
        .substring(0, 50);
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const newFilename = `${nameWithoutExt}-${uniqueSuffix}${ext}`;
      const finalPath = path.join(uploadDir, newFilename);

      await fs.rename(tempPath, finalPath);

      console.log(`📁 Nuevo archivo guardado: ${newFilename} (hash: ${hash.substring(0, 8)}...)`);

      return {
        reutilizado: false,
        url: `/${uploadDir}/${newFilename}`,
        filename: newFilename,
        hash: hash,
        size: file.size,
        originalname: file.originalname
      };

    } catch (error) {
      console.error('Error procesando archivo:', error);
      throw error;
    }
  }

  async obtenerReferenciasArchivo(hash) {
    try {
      const referencias = [];

      const [materiales] = await db.query(`
        SELECT m.id, m.titulo, mod.titulo as modulo_titulo 
        FROM materiales_modulo m
        INNER JOIN modulos mod ON m.modulo_id = mod.id
        WHERE m.hash_archivo = ?
      `, [hash]);

      referencias.push(...materiales.map(m => ({
        tipo: 'modulo',
        id: m.id,
        titulo: m.titulo,
        modulo: m.modulo_titulo
      })));

      const [biblioteca] = await db.query(`
        SELECT id, titulo, autor 
        FROM biblioteca 
        WHERE hash_archivo = ?
      `, [hash]);

      referencias.push(...biblioteca.map(b => ({
        tipo: 'biblioteca',
        id: b.id,
        titulo: b.titulo,
        autor: b.autor
      })));

      return referencias;
    } catch (error) {
      console.error('Error obteniendo referencias:', error);
      throw error;
    }
  }

  async eliminarArchivoSeguro(filename) {
    try {
      const filePath = path.join(__dirname, '../uploads/materiales', filename);

      const hash = await this.calcularHashArchivo(filePath);
      const referencias = await this.obtenerReferenciasArchivo(hash);

      if (referencias.length > 0) {
        console.log(`⚠️ Archivo ${filename} tiene ${referencias.length} referencias, no se eliminará`);
        return {
          eliminado: false,
          motivo: 'tiene_referencias',
          referencias: referencias.length
        };
      }

      await fs.unlink(filePath);
      console.log(`🗑️ Archivo ${filename} eliminado (sin referencias)`);

      return {
        eliminado: true,
        referencias: 0
      };

    } catch (error) {
      console.error('Error eliminando archivo:', error);
      throw error;
    }
  }

  detectarTipoPorUrl(url) {
    const ext = path.extname(url).toLowerCase();
    const tiposPorExtension = {
      '.pdf': 'guia',
      '.jpg': 'infografia',
      '.jpeg': 'infografia',
      '.png': 'infografia',
      '.gif': 'infografia',
      '.mp4': 'video',
      '.webm': 'video',
      '.mov': 'video'
    };
    return tiposPorExtension[ext] || 'otro';
  }
}

module.exports = new SharedFilesService();