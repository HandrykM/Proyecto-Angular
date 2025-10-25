// backend/routes/preferencias.routes.js
const express = require('express');
const router = express.Router();
const preferenciasController = require('../controllers/preferencias.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Aplicar middleware de autenticación
router.use(verifyToken);

router.get('/preferencias', preferenciasController.obtenerPreferencias.bind(preferenciasController));
router.put('/preferencias', preferenciasController.guardarPreferencias.bind(preferenciasController));

module.exports = router;