// backend/routes/materiales.routes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { uploadMateriales } = require('../config/multer.config');
const materialesService = require('../services/materiales.service');
const { requireAuth } = require('../middlewares/admin.middleware');
const materialesController = require('../controllers/materiales.controller');

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_jwt', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

/**
 * POST /api/materiales/subir
 * Subir un nuevo material adicional
 */
router.post('/subir', 
  authenticateToken, 
  uploadMateriales.single('archivo'),
  materialesController.subirMaterial
);

/**
 * GET /api/materiales/modulo/:id_modulo
 * Obtener todos los materiales de un módulo
 */
router.get('/modulo/:id_modulo', 
  authenticateToken, 
  materialesController.obtenerMaterialesModulo
);

/**
 * GET /api/materiales/descargar/:id
 * Descargar un material específico
 */
// Descargar material por ID
router.get('/descargar/:id', requireAuth, async (req, res) => {
  try {
    const materialId = req.params.id;
    
    //console.log('📥 Solicitud de descarga para material ID:', materialId);
    
    const { filePath, filename } = await materialesService.descargarMaterial(materialId);
    
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Error descargando:', err);
        res.status(500).json({ error: 'Error descargando archivo' });
      } else {
      //  console.log('✅ Archivo descargado:', filename);
      }
    });
    
  } catch (error) {
    console.error('❌ Error en descarga:', error);
    res.status(404).json({ error: error.message });
  }
});

// Obtener materiales de un módulo
router.get('/modulo/:moduloId', requireAuth, async (req, res) => {
  try {
    const moduloId = req.params.moduloId;
    const materiales = await materialesService.obtenerMaterialesModulo(moduloId);
    
    res.json({ success: true, data: materiales });
  } catch (error) {
    console.error('Error obteniendo materiales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * DELETE /api/materiales/:id
 * Eliminar un material (solo admin)
 */
router.delete('/:id', 
  authenticateToken, 
  materialesController.eliminarMaterial
);

module.exports = router;