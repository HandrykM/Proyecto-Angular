// backend/routes/perfil.routes.js
const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfil.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const sessionsController = require('../controllers/sessions.controller');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware.verifyToken);

// === INFORMACIÓN PERSONAL === //
router.get('/', perfilController.obtenerPerfilCompleto);
router.put('/informacion', perfilController.actualizarInformacionPersonal);
router.post('/foto', perfilController.subirFotoPerfil);

// === SEGURIDAD === //
router.put('/contrasena', perfilController.cambiarContrasena);
router.get('/historial-sesiones', perfilController.obtenerHistorialSesiones);
router.delete('/sesiones/:id', (req, res) => {
  res.json({ mensaje: 'Sesión cerrada remotamente' });
});

// === CONFIGURACIÓN === //
router.put('/configuracion', perfilController.actualizarConfiguracion);

// === LOGROS Y CERTIFICADOS === //
router.get('/logros', perfilController.obtenerLogros);
router.get('/certificados', perfilController.obtenerCertificados);

// === ESTADÍSTICAS === //
router.get('/estadisticas', perfilController.obtenerEstadisticasDetalladas);
router.get('/historial', perfilController.obtenerHistorialActividad); // ESTA LÍNEA


// === Historia de sesion === //
router.get('/historial-sesiones', sessionsController.obtenerHistorialSesiones.bind(sessionsController));
router.delete('/sesiones/:id', sessionsController.cerrarSesionRemota.bind(sessionsController));


// === GESTIÓN DE CUENTA === //
router.post('/logout', perfilController.cerrarSesion);
router.delete('/eliminar', perfilController.eliminarCuenta);

module.exports = router;