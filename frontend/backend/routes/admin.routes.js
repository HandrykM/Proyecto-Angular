// backend/routes/admin.routes.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middlewares/admin.middleware');
const adminController = require('../controllers/admin.controller');

// ===== GESTIÓN DE USUARIOS =====
router.get('/usuarios', requireAdmin, adminController.obtenerUsuarios);
router.get('/usuarios/:id', requireAdmin, adminController.obtenerUsuarioDetalle);
router.post('/usuarios', requireAdmin, adminController.crearUsuario);
router.put('/usuarios/:id', requireAdmin, adminController.actualizarUsuario);
router.delete('/usuarios/:id', requireAdmin, adminController.eliminarUsuario);
router.post('/usuarios/:id/reset-password', requireAdmin, adminController.resetearPassword);
router.put('/usuarios/:id/cambiar-rol', requireAdmin, adminController.cambiarRol);

// RUTAS DE RESET
router.post('/usuarios/:id/reset-progreso-modulos', requireAdmin, adminController.resetearProgresoModulos);
router.post('/usuarios/:id/reset-progreso-actividades', requireAdmin, adminController.resetearProgresoActividades);
router.post('/usuarios/:id/reset-puntos', requireAdmin, adminController.resetearPuntos);

// ===== GESTIÓN DE MÓDULOS (CORREGIDO) =====
router.get('/modulos', requireAdmin, adminController.obtenerModulos);
router.get('/modulos/:id/completo', requireAdmin, adminController.obtenerModuloCompleto); // NUEVO
router.post('/modulos', requireAdmin, adminController.crearModulo);
router.put('/modulos/:id', requireAdmin, adminController.actualizarModulo);
router.delete('/modulos/:id', requireAdmin, adminController.eliminarModulo); // Ahora elimina completamente
router.post('/modulos/:id/toggle-activo', requireAdmin, adminController.toggleActivoModulo);

// ===== GESTIÓN DE ACTIVIDADES =====
router.get('/actividades', requireAdmin, adminController.obtenerActividades);
router.post('/actividades', requireAdmin, adminController.crearActividad);
router.put('/actividades/:id', requireAdmin, adminController.actualizarActividad);
router.delete('/actividades/:id', requireAdmin, adminController.eliminarActividad);
router.post('/actividades/:id/toggle-activo', requireAdmin, adminController.toggleActivoActividad);

// ===== GESTIÓN DE BIBLIOTECA =====
router.get('/biblioteca', requireAdmin, adminController.obtenerRecursosBiblioteca);
router.post('/biblioteca', requireAdmin, adminController.crearRecursoBiblioteca);
router.put('/biblioteca/:id', requireAdmin, adminController.actualizarRecursoBiblioteca);
router.delete('/biblioteca/:id', requireAdmin, adminController.eliminarRecursoBiblioteca);

// ===== ESTADÍSTICAS GLOBALES =====
router.get('/estadisticas/general', requireAdmin, adminController.obtenerEstadisticasGenerales);
router.get('/estadisticas/usuarios', requireAdmin, adminController.obtenerEstadisticasUsuarios);
router.get('/estadisticas/actividades', requireAdmin, adminController.obtenerEstadisticasActividades);

module.exports = router;