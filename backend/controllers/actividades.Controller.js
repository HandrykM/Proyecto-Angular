const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Asume que tienes configuración de BD
const logrosController = require('./logros.controller');


// Obtener todas las actividades disponibles
router.get('/actividades', async (req, res) => {
  try {
    const query = `
      SELECT 
        id, titulo, descripcion, tipo, nivel, puntos, 
        DATE_FORMAT(fecha_creacion, '%Y-%m-%d %H:%i:%s') as fecha_creacion,
        COALESCE(icono, 'fas fa-gamepad') as icono, 
        COALESCE(color, '#3498db') as color, 
        COALESCE(duracion, '10-15 min') as duracion,
        COALESCE(orden, 1) as orden,
        COALESCE(activo, 1) as activo
      FROM actividades 
      WHERE COALESCE(activo, 1) = 1
      ORDER BY COALESCE(orden, id) ASC
    `;
    
    const [actividades] = await db.execute(query);
    
    res.json(actividades);
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para admin (todas las actividades, incluyendo inactivas)
router.get('/actividades/admin/todas', authenticateToken, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const query = `
      SELECT 
        id, titulo, descripcion, tipo, nivel, puntos, 
        DATE_FORMAT(fecha_creacion, '%Y-%m-%d %H:%i:%s') as fecha_creacion,
        COALESCE(icono, 'fas fa-gamepad') as icono, 
        COALESCE(color, '#3498db') as color, 
        COALESCE(duracion, '10-15 min') as duracion,
        COALESCE(orden, 1) as orden,
        COALESCE(activo, 1) as activo
      FROM actividades 
      ORDER BY COALESCE(orden, id) ASC
    `;
    
    const [actividades] = await db.execute(query);
    
    res.json(actividades);
  } catch (error) {
    console.error('Error al obtener todas las actividades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener progreso de actividades de un usuario
router.get('/progreso-actividades/:idUsuario', async (req, res) => {
  try {
    const { idUsuario } = req.params;
    
    const query = `
      SELECT 
        pa.id, pa.id_usuario, pa.id_actividad, pa.completada,
        pa.progreso, pa.puntuacion_maxima, pa.intentos, pa.tiempo_total,
        pa.ultima_actividad, pa.datos_progreso,
        a.titulo, a.descripcion, a.tipo, a.nivel, a.puntos, a.icono, a.color
      FROM progreso_actividades pa
      JOIN actividades a ON pa.id_actividad = a.id
      WHERE pa.id_usuario = ?
      ORDER BY pa.ultima_actividad DESC
    `;
    
    const [progreso] = await db.execute(query, [idUsuario]);

// Procesar datos_progreso para asegurar que sea objeto, no string
const progresoFormateado = progreso.map(item => {
  try {
    // Si datos_progreso es string, parsearlo
    if (typeof item.datos_progreso === 'string') {
      item.datos_progreso = JSON.parse(item.datos_progreso);
    }
  } catch (e) {
    // Si falla el parse, usar objeto vacío
    item.datos_progreso = {};
  }
  return item;
});

res.json(progresoFormateado);
  } catch (error) {
    console.error('Error al obtener progreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Guardar o actualizar progreso de actividad
router.post('/progreso-actividades', async (req, res) => {
  try {
    const {
      idUsuario, idActividad, completada, progreso, 
      puntuacionMaxima, intentos, tiempoTotal, datosProgreso
    } = req.body;

    // Verificar si ya existe progreso para esta actividad
    const checkQuery = `
      SELECT id FROM progreso_actividades 
      WHERE id_usuario = ? AND id_actividad = ?
    `;
    
    const [existing] = await db.execute(checkQuery, [idUsuario, idActividad]);
    
    let query, params;
    
    if (existing.length > 0) {
      // Actualizar progreso existente
      query = `
        UPDATE progreso_actividades 
        SET completada = ?, progreso = ?, puntuacion_maxima = GREATEST(puntuacion_maxima, ?),
            intentos = intentos + 1, tiempo_total = tiempo_total + ?,
            ultima_actividad = NOW(), datos_progreso = ?
        WHERE id_usuario = ? AND id_actividad = ?
      `;
      params = [completada, progreso, puntuacionMaxima, tiempoTotal, 
                JSON.stringify(datosProgreso), idUsuario, idActividad];
    } else {
      // Crear nuevo progreso
      query = `
        INSERT INTO progreso_actividades 
        (id_usuario, id_actividad, completada, progreso, puntuacion_maxima, 
         intentos, tiempo_total, ultima_actividad, datos_progreso)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)
      `;
      params = [idUsuario, idActividad, completada, progreso, 
                puntuacionMaxima, intentos, tiempoTotal, JSON.stringify(datosProgreso)];
    }
    
    await db.execute(query, params);
    
    // ✅ VERIFICAR LOGROS DESPUÉS DE GUARDAR PROGRESO
    const logrosNuevos = await logrosController.verificarYOtorgarLogros(idUsuario);
    
    // Registrar actividad en historial
    const actividadQuery = `
      INSERT INTO actividad_usuario 
      (id_usuario, tipo_actividad, id_referencia, titulo, resultado, 
       puntos_obtenidos, fecha_actividad)
      SELECT ?, 'actividad', ?, a.titulo, ?, ?, NOW()
      FROM actividades a WHERE a.id = ?
    `;
    
    await db.execute(actividadQuery, [
      idUsuario, idActividad, completada ? 'Completada' : 'En progreso', 
      puntuacionMaxima, idActividad
    ]);
    
    res.json({ 
      success: true,
      message: 'Progreso guardado exitosamente',
      logrosNuevos: logrosNuevos // ✅ Devolver logros obtenidos
    });
    
  } catch (error) {
    console.error('Error al guardar progreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de actividades de un usuario
router.get('/estadisticas-actividades/:idUsuario', async (req, res) => {
  try {
    const { idUsuario } = req.params;
    
    const query = `
      SELECT 
        COUNT(DISTINCT a.id) as totalActividades,
        COUNT(DISTINCT CASE WHEN pa.completada = 1 THEN pa.id_actividad END) as actividadesCompletadas,
        COALESCE(SUM(pa.puntuacion_maxima), 0) as puntosTotal,
        COALESCE(SUM(pa.tiempo_total), 0) as tiempoTotalMinutos,
        (SELECT a2.titulo 
         FROM progreso_actividades pa2 
         JOIN actividades a2 ON pa2.id_actividad = a2.id 
         WHERE pa2.id_usuario = ? 
         ORDER BY pa2.intentos DESC, pa2.tiempo_total DESC 
         LIMIT 1) as actividadFavorita
      FROM actividades a
      LEFT JOIN progreso_actividades pa ON a.id = pa.id_actividad AND pa.id_usuario = ?
      WHERE a.activo = 1
    `;
    
    const [stats] = await db.execute(query, [idUsuario, idUsuario]);
    
    res.json(stats[0] || {
      totalActividades: 0,
      actividadesCompletadas: 0,
      puntosTotal: 0,
      tiempoTotalMinutos: 0,
      actividadFavorita: 'Ninguna'
    });
    
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener ranking de GoGo (juego específico)
router.get('/ranking-gogo', async (req, res) => {
  try {
    const { limite = 10 } = req.query;
    
    const query = `
      SELECT 
        rg.id, rg.id_usuario, u.nombre as nombreUsuario,
        rg.puntuacion_maxima, rg.nivel, rg.fecha_record
      FROM ranking_gogo rg
      JOIN usuarios u ON rg.id_usuario = u.id
      ORDER BY rg.puntuacion_maxima DESC, rg.fecha_record ASC
      LIMIT ?
    `;
    
    const [ranking] = await db.execute(query, [parseInt(limite)]);
    
    res.json(ranking);
    
  } catch (error) {
    console.error('Error al obtener ranking:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar puntuación en ranking GoGo
router.post('/ranking-gogo', async (req, res) => {
  try {
    const { idUsuario, puntuacionMaxima, nivel } = req.body;
    
    // Verificar si el usuario ya tiene un record
    const checkQuery = `
      SELECT id, puntuacion_maxima 
      FROM ranking_gogo 
      WHERE id_usuario = ?
    `;
    
    const [existing] = await db.execute(checkQuery, [idUsuario]);
    
    let query, params;
    
    if (existing.length > 0 && puntuacionMaxima > existing[0].puntuacion_maxima) {
      // Actualizar record existente solo si es mejor
      query = `
        UPDATE ranking_gogo 
        SET puntuacion_maxima = ?, nivel = ?, fecha_record = NOW()
        WHERE id_usuario = ?
      `;
      params = [puntuacionMaxima, nivel, idUsuario];
    } else if (existing.length === 0) {
      // Crear nuevo record
      query = `
        INSERT INTO ranking_gogo 
        (id_usuario, puntuacion_maxima, nivel, fecha_record)
        VALUES (?, ?, ?, NOW())
      `;
      params = [idUsuario, puntuacionMaxima, nivel];
    } else {
      // No actualizar si la puntuación no es mejor
      return res.json({ message: 'Puntuación no es un nuevo record' });
    }
    
    await db.execute(query, params);
    
    res.json({ message: 'Ranking actualizado exitosamente' });
    
  } catch (error) {
    console.error('Error al actualizar ranking:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener historial de actividad de un usuario
router.get('/historial-actividades/:idUsuario', async (req, res) => {
  try {
    const { idUsuario } = req.params;
    const { limite = 20 } = req.query;
    
    const query = `
      SELECT 
        au.id, au.tipo_actividad, au.titulo, au.descripcion,
        au.resultado, au.puntos_obtenidos, au.fecha_actividad
      FROM actividad_usuario au
      WHERE au.id_usuario = ?
      ORDER BY au.fecha_actividad DESC
      LIMIT ?
    `;
    
    const [historial] = await db.execute(query, [idUsuario, parseInt(limite)]);
    
    res.json(historial);
    
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;