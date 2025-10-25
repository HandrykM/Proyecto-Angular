const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Obtener tarjetas por nivel
router.get('/tarjetas', async (req, res) => {
  try {
    const { nivel } = req.query;
    
    let query = `
      SELECT * FROM tarjetas_reutilizable 
      WHERE activa = 1
    `;
    
    if (nivel) {
      query += ` AND nivel = ?`;
    }
    
    query += ` ORDER BY nivel ASC, id ASC`;
    
    const params = nivel ? [nivel] : [];
    const [tarjetas] = await db.execute(query, params);
    
    res.json(tarjetas);
  } catch (error) {
    console.error('Error al obtener tarjetas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Guardar resultado del juego
router.post('/resultado', authenticateToken, async (req, res) => {
  try {
    const {
      idUsuario,
      respuestasCorrectas,
      totalTarjetas,
      precision,
      puntuacion,
      tiempoTotal,
      nivel,
      medalleta
    } = req.body;

    const query = `
      INSERT INTO progreso_reutilizable 
      (id_usuario, respuestas_correctas, total_tarjetas, precision, 
       puntuacion, tiempo_total, nivel, completada, datos_progreso, fecha_completado)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, NOW())
    `;

    const datosProgreso = JSON.stringify({
      medalleta,
      fecha: new Date().toISOString()
    });

    await db.execute(query, [
      idUsuario,
      respuestasCorrectas,
      totalTarjetas,
      precision,
      puntuacion,
      tiempoTotal,
      nivel,
      datosProgreso
    ]);

    // Registrar en historial de actividades
    const historialQuery = `
      INSERT INTO actividad_usuario 
      (id_usuario, tipo_actividad, id_referencia, titulo, resultado, puntos_obtenidos, fecha_actividad)
      VALUES (?, 'actividad', 4, 'Reutilizable o No', 'Completada', ?, NOW())
    `;

    await db.execute(historialQuery, [idUsuario, puntuacion]);

    res.json({
      success: true,
      mensaje: 'Resultado guardado exitosamente'
    });
  } catch (error) {
    console.error('Error al guardar resultado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener historial del usuario
router.get('/historial/:idUsuario', async (req, res) => {
  try {
    const { idUsuario } = req.params;
    
    const query = `
      SELECT * FROM progreso_reutilizable 
      WHERE id_usuario = ?
      ORDER BY fecha_registro DESC
      LIMIT 20
    `;
    
    const [resultados] = await db.execute(query, [idUsuario]);
    
    res.json(resultados);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas del usuario
router.get('/estadisticas/:idUsuario', async (req, res) => {
  try {
    const { idUsuario } = req.params;
    
    const query = `
      SELECT 
        COUNT(*) as totalJuegos,
        AVG(precision) as precisonPromedio,
        MAX(puntuacion) as mejorPuntuacion,
        SUM(respuestas_correctas) as totalCorretas,
        AVG(tiempo_total) as tiempoPromedio
      FROM progreso_reutilizable 
      WHERE id_usuario = ? AND completada = 1
    `;
    
    const [stats] = await db.execute(query, [idUsuario]);
    
    res.json(stats[0] || {
      totalJuegos: 0,
      precisonPromedio: 0,
      mejorPuntuacion: 0,
      totalCorretas: 0,
      tiempoPromedio: 0
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;