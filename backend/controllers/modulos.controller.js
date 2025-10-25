const db = require('../config/db');
const logrosController = require('./logros.controller');

// Obtener todos los módulos con progreso del usuario
exports.getModulosConProgreso = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT 
        m.*,
        COALESCE(progreso_data.progreso_porcentaje, 0) as progreso_porcentaje,
        COALESCE(progreso_data.lecturas_completadas, 0) as lecturas_completadas,
        COALESCE(progreso_data.total_lecturas, 0) as total_lecturas,
        COALESCE(materiales_data.total_materiales, 0) as total_materiales,
        CASE 
          WHEN progreso_data.progreso_porcentaje >= 100 THEN 1
          ELSE 0
        END as completado
      FROM modulos m 
      LEFT JOIN (
        SELECT 
          l.modulo_id,
          COUNT(l.id) as total_lecturas,
          SUM(CASE WHEN pl.completada = 1 THEN 1 ELSE 0 END) as lecturas_completadas,
          ROUND((SUM(CASE WHEN pl.completada = 1 THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(l.id), 0), 0) as progreso_porcentaje
        FROM lecturas l
        LEFT JOIN progreso_lecturas pl ON l.id = pl.lectura_id AND pl.usuario_id = ?
        WHERE l.activa = 1
        GROUP BY l.modulo_id
      ) as progreso_data ON m.id = progreso_data.modulo_id
      LEFT JOIN (
        SELECT 
          mm.modulo_id,
          COUNT(mm.id) as total_materiales
        FROM materiales_modulo mm
        WHERE mm.activo = 1
        GROUP BY mm.modulo_id
      ) as materiales_data ON m.id = materiales_data.modulo_id
      WHERE m.activo = 1
      ORDER BY m.orden ASC
    `;
    
    const [modulos] = await db.query(query, [userId]);
    
    // Determinar bloqueo de módulos
    const modulosConBloqueo = modulos.map((modulo, index) => {
      let bloqueado = false;
      if (index > 0) {
        const moduloAnterior = modulos[index - 1];
        bloqueado = moduloAnterior.progreso_porcentaje < 80;
      }
      
      return {
        ...modulo,
        bloqueado,
        progreso: Math.round(modulo.progreso_porcentaje || 0),
        completado: modulo.completado === 1
      };
    });
    
    res.json({ data: modulosConBloqueo });
    
  } catch (error) {
    console.error('❌ Error en getModulosConProgreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener un módulo específico con sus lecturas
exports.getModulo = async (req, res) => {
  try {
    const moduloId = req.params.id;
    const userId = req.user.id;
    
    // Obtener módulo
    const [modulo] = await db.query("SELECT * FROM modulos WHERE id = ? AND activo = 1", [moduloId]);
    if (!modulo[0]) {
      return res.status(404).json({ error: "Módulo no encontrado" });
    }
    
    // Obtener LECTURAS con estado de completado
    const [lecturas] = await db.query(`
      SELECT 
        l.id, 
        l.titulo, 
        l.descripcion, 
        l.contenido, 
        l.duracion, 
        l.orden,
        COALESCE(pl.completada, 0) as completado
      FROM lecturas l
      LEFT JOIN progreso_lecturas pl ON l.id = pl.lectura_id AND pl.usuario_id = ?
      WHERE l.modulo_id = ? AND l.activa = 1
      ORDER BY l.orden ASC
    `, [userId, moduloId]);
    
    // Obtener MATERIALES
    const [materiales] = await db.query(`
      SELECT id, titulo, descripcion, tipo, url, filename, icono, orden
      FROM materiales_modulo 
      WHERE modulo_id = ? AND activo = 1
      ORDER BY orden ASC
    `, [moduloId]);
    
    const moduloCompleto = {
      ...modulo[0],
      lecturas: lecturas || [],
      materialesAdicionales: materiales || [],
      total_lecturas: lecturas.length,
      total_materiales: materiales.length
    };
    
    res.json({ data: moduloCompleto });
    
  } catch (error) {
    console.error('Error en getModulo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Marcar lectura como completada
exports.marcarLecturaCompletada = async (req, res) => {
  try {
    const { id_lectura, id_modulo } = req.body;
    
    const userId = req.user.id;
    
    if (!id_lectura || !id_modulo) {
      return res.status(400).json({ error: 'ID de lectura y módulo son requeridos' });
    }
    
    // Verificar que el módulo existe y está activo
    const [modulo] = await db.query("SELECT * FROM modulos WHERE id = ? AND activo = 1", [id_modulo]);
    if (!modulo[0]) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }
    
    // Marcar lectura como completada
    await db.query(`
      INSERT INTO progreso_lecturas (
        usuario_id, lectura_id, completada, progreso_porcentaje, fecha_completada, fecha_inicio
      )
      VALUES (?, ?, 1, 100, NOW(), NOW())
      ON DUPLICATE KEY UPDATE 
        completada = 1,
        progreso_porcentaje = 100,
        fecha_completada = NOW(),
        ultima_actualizacion = NOW()
    `, [userId, id_lectura]);
    
    // Calcular progreso del módulo
    const [progreso] = await db.query(`
      SELECT 
        COUNT(l.id) as total,
        SUM(CASE WHEN pl.completada = 1 THEN 1 ELSE 0 END) as completadas
      FROM lecturas l
      LEFT JOIN progreso_lecturas pl ON l.id = pl.lectura_id AND pl.usuario_id = ?
      WHERE l.modulo_id = ? AND l.activa = 1
    `, [userId, id_modulo]);
    
    const total = progreso[0].total || 0;
    const completadas = progreso[0].completadas || 0;
    const progresoFinal = total > 0 ? Math.round((completadas / total) * 100) : 0;
    
    // ✅ REGISTRAR ACTIVIDAD si módulo está completo
    if (progresoFinal >= 100) {
      const puntos = modulo[0].puntos || 100;
      
      // Verificar si ya existe registro
      const [existe] = await db.query(`
        SELECT id FROM actividad_usuario 
        WHERE id_usuario = ? AND tipo_actividad = 'modulo' AND id_referencia = ?
        LIMIT 1
      `, [userId, id_modulo]);
      
      if (existe.length === 0) {
        await db.query(`
          INSERT INTO actividad_usuario (
            id_usuario, tipo_actividad, id_referencia, titulo, resultado, puntos_obtenidos, fecha_actividad
          ) VALUES (?, 'modulo', ?, ?, 'Completada', ?, NOW())
        `, [userId, id_modulo, modulo[0].titulo, puntos]);
      }
    }
    
    // ✅ VERIFICAR LOGROS DESPUÉS DE COMPLETAR LECTURA/MÓDULO
    const logrosNuevos = await logrosController.verificarYOtorgarLogros(userId);
    
    res.json({
      success: true,
      mensaje: 'Lectura marcada como completada',
      nuevo_progreso: progresoFinal,
      lecturas_completadas: completadas,
      total_lecturas: total,
      modulo_completado: progresoFinal >= 100,
      logrosNuevos: logrosNuevos // ✅ Devolver logros obtenidos
    });
    
  } catch (error) {
    console.error('❌ Error en marcarLecturaCompletada:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener estadísticas de progreso
exports.getEstadisticasProgreso = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [stats] = await db.query(`
      SELECT 
        COUNT(DISTINCT m.id) as total_modulos,
        COUNT(DISTINCT CASE WHEN progreso.progreso_porcentaje >= 100 THEN m.id END) as modulos_completados,
        COALESCE(AVG(progreso.progreso_porcentaje), 0) as progreso_promedio
      FROM modulos m
      LEFT JOIN (
        SELECT 
          l.modulo_id,
          ROUND((SUM(CASE WHEN pl.completada = 1 THEN 1 ELSE 0 END) * 100.0) / COUNT(l.id), 0) as progreso_porcentaje
        FROM lecturas l
        LEFT JOIN progreso_lecturas pl ON l.id = pl.lectura_id AND pl.usuario_id = ?
        WHERE l.activa = 1
        GROUP BY l.modulo_id
      ) as progreso ON m.id = progreso.modulo_id
      WHERE m.activo = 1
    `, [userId]);
    
    const [lecturasCompletadas] = await db.query(`
      SELECT COUNT(*) as total
      FROM progreso_lecturas pl
      INNER JOIN lecturas l ON pl.lectura_id = l.id
      WHERE pl.usuario_id = ? AND pl.completada = 1 AND l.activa = 1
    `, [userId]);
    
    const [ultimaActividad] = await db.query(`
      SELECT MAX(ultima_actualizacion) as ultima_fecha
      FROM progreso_lecturas
      WHERE usuario_id = ?
    `, [userId]);
    
    const estadisticas = {
      progreso_total: Math.round(stats[0]?.progreso_promedio || 0),
      modulos_completados: stats[0]?.modulos_completados || 0,
      lecturas_completadas: lecturasCompletadas[0]?.total || 0,
      ultima_actividad: ultimaActividad[0]?.ultima_fecha || null
    };
    
    res.json(estadisticas);
    
  } catch (error) {
    console.error('❌ Error en getEstadisticasProgreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Resetear progreso de módulo
exports.resetearProgresoModulo = async (req, res) => {
  try {
    const moduloId = req.params.id;
    const userId = req.user.id;
    
    // Eliminar progreso de lecturas del módulo
    await db.query(`
      DELETE pl FROM progreso_lecturas pl
      INNER JOIN lecturas l ON pl.lectura_id = l.id
      WHERE pl.usuario_id = ? AND l.modulo_id = ?
    `, [userId, moduloId]);
    
    res.json({
      success: true,
      mensaje: `Progreso del módulo ${moduloId} reseteado`
    });
    
  } catch (error) {
    console.error('❌ Error en resetearProgresoModulo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Guardar notas de lectura
exports.guardarNotasLectura = async (req, res) => {
  try {
    const { id_lectura, contenido } = req.body;
    const userId = req.user.id;
    
    await db.query(`
      INSERT INTO notas_lectura (id_usuario, id_lectura, contenido)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        contenido = VALUES(contenido),
        fecha_modificacion = CURRENT_TIMESTAMP
    `, [userId, id_lectura, contenido || '']);
    
    res.json({
      success: true,
      mensaje: 'Notas guardadas correctamente'
    });
    
  } catch (error) {
    console.error('❌ Error en guardarNotasLectura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener notas de lectura
exports.obtenerNotasLectura = async (req, res) => {
  try {
    const { userId, lecturaId } = req.params;
    
    if (parseInt(userId) !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    const [result] = await db.query(`
      SELECT contenido 
      FROM notas_lectura 
      WHERE id_usuario = ? AND id_lectura = ?
    `, [userId, lecturaId]);
    
    const contenido = result.length > 0 ? result[0].contenido : '';
    res.json({ contenido });
    
  } catch (error) {
    console.error('❌ Error en obtenerNotasLectura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Registrar tiempo de estudio
exports.registrarTiempoEstudio = async (req, res) => {
  try {
    const { id_lectura, tiempo_minutos } = req.body;
    const userId = req.user.id;
    
    if (!id_lectura || !tiempo_minutos || id_lectura <= 0 || tiempo_minutos <= 0) {
      return res.status(400).json({ error: 'Datos de tiempo inválidos' });
    }

    const payload = {
      id_lectura: id_lectura,
      tiempo_minutos: Math.round(tiempo_minutos)
    };

    await db.query(`
      INSERT INTO tiempo_estudio (id_usuario, id_lectura, tiempo_minutos, fecha)
      VALUES (?, ?, ?, NOW())
    `, [userId, id_lectura, Math.round(tiempo_minutos)]);
    
    // ✅ VERIFICAR LOGROS POR TIEMPO DE ESTUDIO
    const logrosNuevos = await logrosController.verificarYOtorgarLogros(userId);
    
    res.json({
      success: true,
      mensaje: 'Tiempo de estudio registrado',
      logrosNuevos: logrosNuevos
    });
    
  } catch (error) {
    console.warn('Error registrando tiempo (continuando):', error);
    return res.json({ success: false, mensaje: 'Error registrando tiempo' });
  }
};

module.exports = exports;