-- backend/scripts/migrate-hashes.js
const db = require('../config/db');
const sharedFilesService = require('../services/shared-files.service');
const path = require('path');

async function migrarHashesExistentes() {
  try {
    console.log('🔄 Migrando hashes de archivos existentes...');

    // Materiales módulo
    const [materiales] = await db.query(`
      SELECT id, filename 
      FROM materiales_modulo 
      WHERE hash_archivo IS NULL AND filename IS NOT NULL
    `);

    for (const material of materiales) {
      try {
        const filePath = path.join(__dirname, '../uploads/materiales', material.filename);
        const hash = await sharedFilesService.calcularHashArchivo(filePath);
        
        await db.query(
          'UPDATE materiales_modulo SET hash_archivo = ? WHERE id = ?',
          [hash, material.id]
        );
        
        console.log(`✅ Material ${material.id}: ${hash.substring(0, 8)}...`);
      } catch (err) {
        console.warn(`⚠️ No se pudo procesar material ${material.id}`);
      }
    }

    console.log('✅ Migración completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

migrarHashesExistentes();