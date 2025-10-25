// backend/routes/certificados.routes.js
const express = require('express');
const router = express.Router();
const certificadosController = require('../controllers/certificados.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Aplicar middleware de autenticación
router.use(verifyToken);

router.get('/certificados/elegibilidad', certificadosController.verificarElegibilidad.bind(certificadosController));
router.post('/certificados/generar', certificadosController.generarCertificado.bind(certificadosController));
router.get('/certificados', certificadosController.obtenerCertificadosUsuario.bind(certificadosController));

module.exports = router;