const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Importar el controlador corregido
const modulosController = require('../controllers/modulos.controller');

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
const validarModulo = (req, res, next) => {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'ID de módulo inválido' });
  }
  next();
};

const validarLectura = (req, res, next) => {
  const { id_lectura, id_modulo } = req.body;
  if (!id_lectura || !id_modulo || isNaN(parseInt(id_lectura)) || isNaN(parseInt(id_modulo))) {
    return res.status(400).json({ error: 'IDs de lectura y módulo requeridos' });
  }
  next();
};

// === RUTAS PRINCIPALES === //

/**
 * GET /api/modulos/con-progreso
 * Obtiene todos los módulos con progreso del usuario actual
 */
router.get('/con-progreso', authenticateToken, modulosController.getModulosConProgreso);

/**
 * GET /api/modulos/:id
 * Obtiene un módulo específico con sus lecturas
 */
router.get('/:id', authenticateToken, validarModulo, modulosController.getModulo);

/**
 * POST /api/modulos/progreso/marcar-lectura
 * Marca una lectura como completada
 */
router.post('/progreso/marcar-lectura', authenticateToken, validarLectura, modulosController.marcarLecturaCompletada);

/**
 * GET /api/modulos/progreso/estadisticas
 * Obtiene estadísticas generales de progreso del usuario
 */
router.get('/progreso/estadisticas', authenticateToken, modulosController.getEstadisticasProgreso);

/**
 * DELETE /api/modulos/progreso/modulo/:id
 * Resetea el progreso de un módulo específico (testing/admin)
 */
router.delete('/progreso/modulo/:id', authenticateToken, validarModulo, modulosController.resetearProgresoModulo);

// === RUTAS DE NOTAS === //

/**
 * POST /api/modulos/notas-lectura
 * Guarda o actualiza notas de una lectura
 */
router.post('/notas-lectura', authenticateToken, (req, res, next) => {
  const { id_lectura } = req.body;
  if (!id_lectura || isNaN(parseInt(id_lectura))) {
    return res.status(400).json({ error: 'ID de lectura requerido' });
  }
  next();
}, modulosController.guardarNotasLectura);

/**
 * GET /api/modulos/notas-lectura/:userId/:lecturaId
 * Obtiene las notas de una lectura específica
 */
router.get('/notas-lectura/:userId/:lecturaId', authenticateToken, (req, res, next) => {
  const { userId, lecturaId } = req.params;
  if (!userId || !lecturaId || isNaN(parseInt(userId)) || isNaN(parseInt(lecturaId))) {
    return res.status(400).json({ error: 'IDs de usuario y lectura requeridos' });
  }
  next();
}, modulosController.obtenerNotasLectura);

// === RUTAS DE TIEMPO === //

/**
 * POST /api/modulos/tiempo-estudio
 * Registra tiempo de estudio de una lectura
 */
router.post('/tiempo-estudio', authenticateToken, (req, res, next) => {
  const { id_lectura, tiempo_minutos } = req.body;
  if (!id_lectura || !tiempo_minutos || isNaN(parseInt(id_lectura)) || isNaN(parseInt(tiempo_minutos))) {
    return res.status(400).json({ error: 'ID de lectura y tiempo en minutos requeridos' });
  }
  if (parseInt(tiempo_minutos) < 1 || parseInt(tiempo_minutos) > 360) {
    return res.status(400).json({ error: 'Tiempo debe estar entre 1 y 360 minutos' });
  }
  next();
}, modulosController.registrarTiempoEstudio);

// === RUTAS ADMINISTRATIVAS (OPCIONAL) === //

/**
 * GET /api/modulos
 * Obtiene todos los módulos (sin progreso) - para admin
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = require('../config/db');
    const [modulos] = await db.query("SELECT * FROM modulos WHERE activo = 1 ORDER BY orden ASC");
    res.json({ data: modulos });
  } catch (error) {
    console.error('Error obteniendo módulos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/modulos
 * Crear un nuevo módulo (solo admin)
 */
router.post('/', authenticateToken, (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
  }
  next();
}, async (req, res) => {
  try {
    const db = require('../config/db');
    const { 
      titulo, 
      descripcion, 
      nivel, 
      orden, 
      lectura_titulo, 
      lectura_contenido,
      material_adicional,
      icono,
      color
    } = req.body;
    
    if (!titulo || !descripcion || !nivel || !orden) {
      return res.status(400).json({ error: 'Campos requeridos: titulo, descripcion, nivel, orden' });
    }
    
    const [result] = await db.query(`
      INSERT INTO modulos (
        titulo, descripcion, nivel, orden, lectura_titulo, lectura_contenido,
        material_adicional, icono, color, activo, fecha_creacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
    `, [
      titulo, descripcion, nivel, orden, lectura_titulo || null, lectura_contenido || null,
      material_adicional || null, icono || 'fas fa-book', color || '#00a8e8'
    ]);
    
    res.status(201).json({
      success: true,
      mensaje: 'Módulo creado exitosamente',
      id: result.insertId
    });
    
  } catch (error) {
    console.error('Error creando módulo:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Ya existe un módulo con ese orden' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

/**
 * PUT /api/modulos/:id
 * Actualizar un módulo (solo admin)
 */
router.put('/:id', authenticateToken, validarModulo, (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
  }
  next();
}, async (req, res) => {
  try {
    const db = require('../config/db');
    const moduloId = req.params.id;
    const updateFields = req.body;
    
    // Construir query dinámico
    const allowedFields = [
      'titulo', 'descripcion', 'nivel', 'orden', 'lectura_titulo', 
      'lectura_contenido', 'material_adicional', 'icono', 'color', 'activo'
    ];
    
    const updates = [];
    const values = [];
    
    Object.keys(updateFields).forEach(field => {
      if (allowedFields.includes(field)) {
        updates.push(`${field} = ?`);
        values.push(updateFields[field]);
      }
    });
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
    }
    
    values.push(moduloId);
    
    await db.query(`
      UPDATE modulos 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = ?
    `, values);
    
    res.json({
      success: true,
      mensaje: 'Módulo actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('Error actualizando módulo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * DELETE /api/modulos/:id
 * Eliminar un módulo (soft delete - solo admin)
 */
router.delete('/:id', authenticateToken, validarModulo, (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
  }
  next();
}, async (req, res) => {
  try {
    const db = require('../config/db');
    const moduloId = req.params.id;
    
    // Soft delete
    await db.query(`
      UPDATE modulos 
      SET activo = 0, updated_at = NOW()
      WHERE id = ?
    `, [moduloId]);
    
    res.json({
      success: true,
      mensaje: 'Módulo eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error eliminando módulo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// === MIDDLEWARE DE MANEJO DE ERRORES === //

router.use((error, req, res, next) => {
  console.error('Error en rutas de módulos:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }
  
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({ error: 'Servicio temporalmente no disponible' });
  }
  
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = router;