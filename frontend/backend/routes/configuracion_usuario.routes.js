// backend/routes/configuracion_usuario.routes.js
const express = require('express');
const router = express.Router();
const configuracionUsuarioController = require('../controllers/configuracion_usuario.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

/**
 * @route   GET /api/configuracion
 * @desc    Obtener configuración del usuario autenticado
 * @access  Private
 */
router.get('/configuracion', configuracionUsuarioController.obtenerConfiguracion.bind(configuracionUsuarioController));

/**
 * @route   PUT /api/configuracion
 * @desc    Actualizar configuración del usuario autenticado
 * @access  Private
 */
router.put('/configuracion', configuracionUsuarioController.guardarConfiguracion.bind(configuracionUsuarioController));

module.exports = router;