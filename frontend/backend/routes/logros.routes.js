// backend/routes/logros.routes.js
const express = require('express');
const router = express.Router();
const logrosController = require('../controllers/logros.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Aplicar middleware de autenticación
router.use(verifyToken);

// Rutas de logros
router.get('/logros', logrosController.obtenerLogrosUsuario.bind(logrosController));
router.post('/logros/verificar', logrosController.verificarLogrosManual.bind(logrosController));

module.exports = router;