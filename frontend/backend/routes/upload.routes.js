// backend/routes/upload.routes.js
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { requireAuth } = require('../middlewares/admin.middleware');

// Subir archivo de material
router.post('/material', uploadController.uploadMaterial, uploadController.subirArchivoMaterial);

// Subir thumbnail
router.post('/thumbnail', uploadController.uploadThumbnail, uploadController.subirArchivoMaterial);

// Descargar archivo
router.get('/download/:filename', uploadController.descargarArchivo);

// Eliminar archivo
router.delete('/:filename', uploadController.eliminarArchivo);

// ⬇️ COMENTAR ESTAS RUTAS NUEVAS POR AHORA (son opcionales)
// router.get('/archivos-compartidos', uploadController.listarArchivosCompartidos);
// router.get('/referencias/:hash', uploadController.obtenerReferenciasArchivo);

module.exports = router;