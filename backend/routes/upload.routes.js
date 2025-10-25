// backend/routes/upload.routes.js
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');

// Subir archivo de material
router.post('/material', uploadController.uploadMaterial, uploadController.subirArchivoMaterial);

// Subir thumbnail
router.post('/thumbnail', uploadController.uploadThumbnail, uploadController.subirArchivoMaterial);

// Descargar archivo
router.get('/download/:filename', uploadController.descargarArchivo);

// Eliminar archivo
router.delete('/:filename', uploadController.eliminarArchivo);

module.exports = router;