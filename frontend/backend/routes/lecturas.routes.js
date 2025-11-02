// backend/routes/lecturas.routes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const lecturasController = require('../controllers/lecturas.controller');

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

// Middleware de validación
const validarLectura = (req, res, next) => {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'ID de lectura inválido' });
  }
  next();
};

/**
 * GET /api/modulos/:id_modulo/lecturas
 * Obtener todas las lecturas de un módulo con progreso
 */
// backend/routes/lecturas.routes.js

// Ruta para obtener todas las lecturas de un módulo
// backend/routes/lecturas.routes.js
router.get('/:id_modulo/lecturas', authenticateToken, lecturasController.obtenerLecturasModulo);


// Ruta para obtener una lectura específica
router.get('/lecturas/:id', 
  authenticateToken, 
  validarLectura,
  lecturasController.obtenerLectura
);

// Otras rutas de lecturas...


/**
 * POST /api/modulos/progreso-lectura
 * Guardar progreso de lectura (scroll y tiempo)
 */
router.post('/progreso-lectura', 
  authenticateToken,
  lecturasController.guardarProgresoLectura
);

/**
 * GET /api/modulos/progreso-lectura/:id_lectura
 * Obtener progreso de una lectura
 */
router.get('/progreso-lectura/:id_lectura', 
  authenticateToken,
  lecturasController.obtenerProgresoLectura
);

/**
 * POST /api/modulos/lecturas
 * Crear nueva lectura (solo admin)
 */
router.post('/lecturas', 
  authenticateToken,
  lecturasController.crearLectura
);

/**
 * PUT /api/modulos/lecturas/:id
 * Actualizar lectura (solo admin)
 */
router.put('/lecturas/:id', 
  authenticateToken,
  validarLectura,
  lecturasController.actualizarLectura
);

/**
 * DELETE /api/modulos/lecturas/:id
 * Eliminar lectura (solo admin)
 */
router.delete('/lecturas/:id', 
  authenticateToken,
  validarLectura,
  lecturasController.eliminarLectura
);

/**
 * PUT /api/modulos/:id_modulo/lecturas/reordenar
 * Reordenar lecturas de un módulo (solo admin)
 */
router.put('/:id_modulo/lecturas/reordenar', 
  authenticateToken,
  lecturasController.reordenarLecturas
);

/**
 * GET /api/modulos/estadisticas/lecturas
 * Obtener estadísticas de lecturas del usuario
 */
router.get('/estadisticas/lecturas', 
  authenticateToken,
  lecturasController.obtenerEstadisticasLectura
);


module.exports = router;