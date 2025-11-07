// backend/routes/notificaciones.routes.js
const express = require('express');
const router = express.Router();
const notificacionesController = require('../controllers/notificaciones.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Aplicar middleware de autenticación
router.use(verifyToken);

/**
 * @route   POST /api/notificaciones/email
 * @desc    Enviar notificación por email
 * @access  Private
 */
router.post('/email', notificacionesController.enviarEmail.bind(notificacionesController));

/**
 * @route   POST /api/notificaciones/sms
 * @desc    Enviar notificación por SMS
 * @access  Private
 */
router.post('/sms', notificacionesController.enviarSMS.bind(notificacionesController));

module.exports = router;