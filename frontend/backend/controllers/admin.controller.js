// backend/controllers/admin.controller.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
//const materialesService = require('../services/materiales.service');

// ===== GESTIÓN DE USUARIOS =====

exports.obtenerUsuarios = async (req, res) => {
  try {
    const { busqueda = '', rol = '', orden = 'fecha_desc', limite = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT u.*, 
             COALESCE(modulos_data.modulos_completados, 0) as modulos_completados,
             COALESCE(actividades_data.actividades_completadas, 0) as actividades_completadas,
             COALESCE(actividades_data.puntos_totales, 0) as puntos_totales,
             COALESCE(biblioteca_data.recursos_leidos, 0) as recursos_leidos
      FROM usuarios u
      LEFT JOIN (
        /* Para cada usuario contamos los módulos en los que completó todas las lecturas */
        SELECT
          t.usuario_id,
          COUNT(*) as modulos_completados
        FROM (
          SELECT
            pl.usuario_id,
            l.modulo_id,
            COUNT(*) as lecturas_completadas,
            (SELECT COUNT(*) FROM lecturas WHERE modulo_id = l.modulo_id AND activa = 1) as total_lecturas
          FROM progreso_lecturas pl
          INNER JOIN lecturas l ON pl.lectura_id = l.id AND l.activa = 1
          INNER JOIN modulos m ON l.modulo_id = m.id AND m.activo = 1
          WHERE pl.completada = 1
          GROUP BY pl.usuario_id, l.modulo_id
          HAVING lecturas_completadas >= total_lecturas
        ) t
        GROUP BY t.usuario_id
      ) as modulos_data ON u.id = modulos_data.usuario_id
      LEFT JOIN (
        -- Contar solo las entradas de tipo 'actividad' (no contar módulos ni otros tipos)
        SELECT 
          id_usuario,
          COUNT(DISTINCT id) as actividades_completadas,
          SUM(puntos_obtenidos) as puntos_totales
        FROM actividad_usuario
        WHERE resultado = 'Completada' AND tipo_actividad = 'actividad'
        GROUP BY id_usuario
      ) as actividades_data ON u.id = actividades_data.id_usuario
      LEFT JOIN (
        SELECT 
          id_usuario,
          COUNT(DISTINCT id_referencia) as recursos_leidos
        FROM actividad_usuario
        WHERE tipo_actividad = 'biblioteca' AND resultado = 'Completada'
        GROUP BY id_usuario
      ) as biblioteca_data ON u.id = biblioteca_data.id_usuario
      WHERE 1=1
    `;
    
    const params = [];
    
    if (busqueda) {
      query += ` AND (u.nombre LIKE ? OR u.correo LIKE ?)`;
      params.push(`%${busqueda}%`, `%${busqueda}%`);
    }
    
    if (rol) {
      query += ` AND u.rol = ?`;
      params.push(rol);
    }
    
    query += ` GROUP BY u.id`;
    
    switch (orden) {
      case 'nombre_asc':
        query += ` ORDER BY u.nombre ASC`;
        break;
      case 'nombre_desc':
        query += ` ORDER BY u.nombre DESC`;
        break;
      case 'fecha_asc':
        query += ` ORDER BY u.fecha_registro ASC`;
        break;
      default:
        query += ` ORDER BY u.fecha_registro DESC`;
    }
    
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limite), parseInt(offset));
    
    const [usuarios] = await db.query(query, params);
    
    const [total] = await db.query(
      `SELECT COUNT(*) as total FROM usuarios WHERE 1=1 ${busqueda ? 'AND (nombre LIKE ? OR correo LIKE ?)' : ''}`,
      busqueda ? [`%${busqueda}%`, `%${busqueda}%`] : []
    );
    
    res.json({
      success: true,
      data: usuarios,
      total: total[0].total,
      limite: parseInt(limite),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

exports.crearUsuario = async (req, res) => {
  try {
    const { nombre, correo, contrasena, telefono, nombreUsuario, rol } = req.body;
    
    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ 
        mensaje: 'Nombre, correo y contraseña son obligatorios' 
      });
    }
    
    if (contrasena.length < 6) {
      return res.status(400).json({ 
        mensaje: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }
    
    // Verificar si el correo ya existe
    const [emailCheck] = await db.query(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo]
    );
    
    if (emailCheck.length > 0) {
      return res.status(400).json({ mensaje: 'El correo ya está en uso' });
    }
    
    // Hash de la contraseña
    const hash = await bcrypt.hash(contrasena, 12);
    
    const [result] = await db.query(`
      INSERT INTO usuarios 
      (nombre, correo, contrasena, telefono, nombre_usuario, rol, fecha_registro)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [nombre, correo, hash, telefono || null, nombreUsuario || null, rol || 'usuario']);
    
    res.status(201).json({
      success: true,
      mensaje: 'Usuario creado exitosamente',
      id: result.insertId
    });
    
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Función para resetear progreso de módulos
exports.resetearProgresoModulos = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Eliminar progreso de contenido (módulos)
    await db.query(
      'DELETE FROM progreso_contenido WHERE id_usuario = ?',
      [id]
    );
    
    // Eliminar progreso de lecturas
    await db.query(`
  DELETE FROM progreso_lecturas WHERE usuario_id = ?
`, [id]);
    
    // Eliminar tiempo de estudio
    await db.query(
      'DELETE FROM tiempo_estudio WHERE id_usuario = ?',
      [id]
    );

    // Eliminar notas
await db.query(`
  DELETE FROM notas_lectura WHERE id_usuario = ?
`, [id]);
    
    // Actualizar dashboard
    await db.query(
      'UPDATE dashboard SET total_contenido_leido = 0, progreso_total = 0 WHERE id_usuario = ?',
      [id]
    );
    
    res.json({
      success: true,
      mensaje: 'Progreso de módulos reseteado exitosamente'
    });
    
  } catch (error) {
    console.error('Error reseteando progreso módulos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Función para resetear progreso de actividades
exports.resetearProgresoActividades = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Eliminar progreso de actividades
    await db.query(
      'DELETE FROM progreso_actividades WHERE id_usuario = ?',
      [id]
    );
    
    // Eliminar actividad de usuario relacionada con actividades
    await db.query(`
  DELETE FROM actividad_usuario 
  WHERE id_usuario = ? AND tipo_actividad = 'modulo'
`, [id]);
    
    // Eliminar ranking de GoGo
    await db.query(
      'DELETE FROM ranking_gogo WHERE id_usuario = ?',
      [id]
    );
    
    res.json({
      success: true,
      mensaje: 'Progreso de actividades reseteado exitosamente'
    });
    
  } catch (error) {
    console.error('Error reseteando progreso actividades:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Función para resetear puntos
exports.resetearPuntos = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Resetear puntos en actividad_usuario
    await db.query(
      'UPDATE actividad_usuario SET puntos_obtenidos = 0 WHERE id_usuario = ?',
      [id]
    );
    
    // Resetear puntos en progreso_actividades
    await db.query(
      'UPDATE progreso_actividades SET puntuacion_maxima = 0 WHERE id_usuario = ?',
      [id]
    );
    
    res.json({
      success: true,
      mensaje: 'Puntos reseteados exitosamente'
    });
    
  } catch (error) {
    console.error('Error reseteando puntos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};



exports.obtenerUsuarioDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [usuario] = await db.query(`
      SELECT u.*,
             COUNT(DISTINCT pc.id) as modulos_completados,
             COUNT(DISTINCT au.id) as actividades_completadas,
             COALESCE(SUM(au.puntos_obtenidos), 0) as puntos_totales,
             COALESCE(SUM(te.tiempo_minutos), 0) as tiempo_total
      FROM usuarios u
      LEFT JOIN progreso_contenido pc ON u.id = pc.id_usuario AND pc.leido = 1
      LEFT JOIN actividad_usuario au ON u.id = au.id_usuario AND au.resultado = 'Completada'
      LEFT JOIN tiempo_estudio te ON u.id = te.id_usuario
      WHERE u.id = ?
      GROUP BY u.id
    `, [id]);
    
    if (usuario.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    
    // Obtener logros
    const [logros] = await db.query(`
      SELECT l.* FROM usuario_logros lu
      JOIN logros l ON lu.id_logro = l.id
      WHERE lu.id_usuario = ?
    `, [id]);
    
    // Obtener actividad reciente
    const [actividad] = await db.query(`
      SELECT * FROM actividad_usuario
      WHERE id_usuario = ?
      ORDER BY fecha_actividad DESC
      LIMIT 10
    `, [id]);
    
    res.json({
      success: true,
      data: {
        ...usuario[0],
        logros,
        actividad_reciente: actividad
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo detalle usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, telefono, nombreUsuario } = req.body;
    
    if (!nombre || !correo) {
      return res.status(400).json({ mensaje: 'Nombre y correo son obligatorios' });
    }
    
    // Verificar si el correo ya existe
    const [emailCheck] = await db.query(
      'SELECT id FROM usuarios WHERE correo = ? AND id != ?',
      [correo, id]
    );
    
    if (emailCheck.length > 0) {
      return res.status(400).json({ mensaje: 'El correo ya está en uso' });
    }
    
    await db.query(`
      UPDATE usuarios 
      SET nombre = ?, correo = ?, telefono = ?, nombre_usuario = ?
      WHERE id = ?
    `, [nombre, correo, telefono || null, nombreUsuario || null, id]);
    
    res.json({
      success: true,
      mensaje: 'Usuario actualizado correctamente'
    });
    
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    // No permitir eliminar el propio usuario admin
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ mensaje: 'No puedes eliminar tu propia cuenta' });
    }
    
    await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
    
    res.json({
      success: true,
      mensaje: 'Usuario eliminado correctamente'
    });
    
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

exports.resetearPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevaContrasena } = req.body;
    
    if (!nuevaContrasena || nuevaContrasena.length < 6) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    const hash = await bcrypt.hash(nuevaContrasena, 12);
    
    await db.query(
      'UPDATE usuarios SET contrasena = ? WHERE id = ?',
      [hash, id]
    );
    
    res.json({
      success: true,
      mensaje: 'Contraseña reseteada correctamente'
    });
    
  } catch (error) {
    console.error('Error reseteando contraseña:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

exports.cambiarRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;
    
    if (!['usuario', 'admin'].includes(rol)) {
      return res.status(400).json({ mensaje: 'Rol no válido' });
    }
    
    // No permitir cambiar el propio rol
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ mensaje: 'No puedes cambiar tu propio rol' });
    }
    
    await db.query('UPDATE usuarios SET rol = ? WHERE id = ?', [rol, id]);
    
    res.json({
      success: true,
      mensaje: `Rol cambiado a ${rol} correctamente`
    });
    
  } catch (error) {
    console.error('Error cambiando rol:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// ===== GESTIÓN DE MÓDULOS =====

exports.obtenerModulos = async (req, res) => {
  try {
    const [modulos] = await db.query(`
      SELECT 
        m.*,
        COUNT(DISTINCT CASE 
          WHEN au.tipo_actividad = 'modulo' 
          AND au.resultado = 'Completada' 
          AND au.id_referencia = m.id 
          THEN au.id_usuario 
        END) as usuarios_completados
      FROM modulos m
      LEFT JOIN actividad_usuario au 
        ON au.tipo_actividad = 'modulo' 
        AND au.id_referencia = m.id
        AND au.resultado = 'Completada'
      GROUP BY m.id
      ORDER BY m.orden ASC
    `);
    
    res.json({
      success: true,
      data: modulos
    });
    
  } catch (error) {
    console.error('Error obteniendo módulos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

exports.crearModulo = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      titulo,
      descripcion,
      nivel,
      orden,
      icono,
      color,
      puntos,
      lecturas,
      materiales
    } = req.body;
    
    // Validación
    if (!titulo || !descripcion || !nivel || !orden) {
      await connection.rollback();
      return res.status(400).json({ 
        mensaje: 'Campos requeridos: titulo, descripcion, nivel, orden' 
      });
    }
    
    const colorFinal = color || obtenerColorPorNivel(nivel);
    
    // 1. Insertar módulo (sin campos de lectura antiguos)
    const [resultModulo] = await connection.query(`
      INSERT INTO modulos (
        titulo, descripcion, nivel, orden, icono, color, puntos, 
        activo, fecha_creacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())
    `, [
      titulo,
      descripcion,
      nivel,
      orden,
      icono || 'fas fa-book',
      colorFinal,
      puntos || 100
    ]);
    
    const moduloId = resultModulo.insertId;
   // console.log('✅ Módulo creado con ID:', moduloId);
    
    // 2. Insertar lecturas en la tabla lecturas
    if (lecturas && Array.isArray(lecturas) && lecturas.length > 0) {
      for (let i = 0; i < lecturas.length; i++) {
        const lectura = lecturas[i];
        
        if (!lectura.titulo || !lectura.contenido) {
          console.warn('⚠️ Lectura sin título o contenido, saltando...');
          continue;
        }
        
        await connection.query(`
          INSERT INTO lecturas (
            modulo_id, titulo, contenido, descripcion, duracion, orden, activa, fecha_creacion
          ) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
        `, [
          moduloId,
          lectura.titulo,
          lectura.contenido,
          lectura.descripcion || '',
          lectura.duracion || '10 min',
          i + 1
        ]);
        
       // console.log(`✅ Lectura ${i+1} "${lectura.titulo}" creada`);
      }
    }
    
    // 3. Insertar materiales en la tabla materiales_modulo
    if (materiales && Array.isArray(materiales) && materiales.length > 0) {
  for (let i = 0; i < materiales.length; i++) {
    const material = materiales[i];
    
    await connection.query(`
      INSERT INTO materiales_modulo (
        modulo_id, titulo, descripcion, tipo, url, filename, 
        hash_archivo, tamano_bytes, icono, orden, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      moduloId,
      material.titulo,
      material.descripcion || material.titulo,
      material.tipo,
      material.url,
      material.filename,
      material.hash || null,       // ⬅️ NUEVO
      material.size || 0,           // ⬅️ NUEVO
      obtenerIconoPorTipo(material.tipo),
      i + 1
    ]);
  }

      
     // console.log(`✅ ${materiales.length} materiales vinculados`);
    }
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      mensaje: 'Módulo creado exitosamente',
      id: moduloId
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error creando módulo:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

exports.actualizarModulo = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      nivel,
      orden,
      icono,
      color,
      puntos,
      lecturas,
      materiales
    } = req.body;
    
    const colorFinal = color || obtenerColorPorNivel(nivel);
    
    // 1. Actualizar módulo
    await connection.query(`
      UPDATE modulos 
      SET titulo = ?, descripcion = ?, nivel = ?, orden = ?, 
          icono = ?, color = ?, puntos = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      titulo,
      descripcion,
      nivel,
      orden,
      icono || 'fas fa-book',
      colorFinal,
      puntos || 100,
      id
    ]);
    
    // 2. Actualizar lecturas
    if (lecturas && Array.isArray(lecturas)) {
      // Eliminar lecturas existentes
      await connection.query('DELETE FROM lecturas WHERE modulo_id = ?', [id]);
      
      // Recrear lecturas
      for (let i = 0; i < lecturas.length; i++) {
        const lectura = lecturas[i];
        
        if (!lectura.titulo || !lectura.contenido) continue;
        
        await connection.query(`
          INSERT INTO lecturas (
            modulo_id, titulo, contenido, descripcion, duracion, orden, activa
          ) VALUES (?, ?, ?, ?, ?, ?, 1)
        `, [
          id,
          lectura.titulo,
          lectura.contenido,
          lectura.descripcion || '',
          lectura.duracion || '10 min',
          i + 1
        ]);
      }
    }
    
    // 3. Actualizar materiales
    if (materiales && Array.isArray(materiales)) {
      // Obtener materiales existentes
      const [existentes] = await connection.query(
        'SELECT id, filename FROM materiales_modulo WHERE modulo_id = ?',
        [id]
      );
      
      // Eliminar archivos físicos de materiales que ya no están
      const nuevosFilenames = materiales.map(m => m.filename).filter(Boolean);
      for (const existente of existentes) {
        if (!nuevosFilenames.includes(existente.filename)) {
          // Eliminar archivo físico
          try {
            const filePath = path.join(__dirname, '../uploads/materiales', existente.filename);
            await fsPromises.unlink(filePath);
            console.log('🗑️ Archivo eliminado:', existente.filename);
          } catch (err) {
            console.warn('⚠️ No se pudo eliminar archivo:', existente.filename);
          }
        }
      }
      
      // Eliminar registros de base de datos
      await connection.query('DELETE FROM materiales_modulo WHERE modulo_id = ?', [id]);
      
      // Recrear materiales
      for (let i = 0; i < materiales.length; i++) {
        const material = materiales[i];
        
        await connection.query(`
          INSERT INTO materiales_modulo (
            modulo_id, titulo, descripcion, tipo, url, filename, icono, orden, activo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
          id,
          material.titulo,
          material.descripcion || material.titulo,
          material.tipo,
          material.url,
          material.filename,
          obtenerIconoPorTipo(material.tipo),
          i + 1
        ]);
      }
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      mensaje: 'Módulo actualizado exitosamente'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error actualizando módulo:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
};

// Función auxiliar para obtener color por nivel
function obtenerColorPorNivel(nivel) {
  const colores = {
    'basico': '#1abc9c',
    'intermedio': '#f39c12',
    'avanzado': '#e74c3c'
  };
  return colores[nivel] || '#00a8e8';
}

function obtenerIconoPorTipo(tipo) {
  const iconos = {
    'infografia': 'fas fa-image',
    'guia': 'fas fa-file-pdf',
    'video': 'fas fa-video',
    'otro': 'fas fa-file'
  };
  return iconos[tipo] || 'fas fa-file';
}
// AGREGAR nueva función para obtener módulo con lecturas
exports.obtenerModuloCompleto = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Obtener módulo
    const [modulo] = await db.query('SELECT * FROM modulos WHERE id = ?', [id]);
    
    if (!modulo[0]) {
      return res.status(404).json({ mensaje: 'Módulo no encontrado' });
    }
    
    // 2. Obtener lecturas
    const [lecturas] = await db.query(`
      SELECT * FROM lecturas 
      WHERE modulo_id = ? AND activa = 1 
      ORDER BY orden ASC
    `, [id]);
    
    // 3. Obtener materiales
    const [materiales] = await db.query(`
      SELECT * FROM materiales_modulo 
      WHERE modulo_id = ? AND activo = 1
      ORDER BY orden ASC
    `, [id]);
    
    res.json({
      success: true,
      data: {
        ...modulo[0],
        lecturas: lecturas,
        materialesAdicionales: materiales
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo módulo completo:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

exports.eliminarModulo = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // 1. Obtener materiales para eliminar archivos físicos
    const [materiales] = await connection.query(
      'SELECT filename FROM materiales_modulo WHERE modulo_id = ?',
      [id]
    );
    
    // 2. Eliminar archivos físicos
    for (const material of materiales) {
      try {
        const filePath = path.join(__dirname, '../uploads/materiales', material.filename);
        await fsPromises.unlink(filePath);
        console.log('🗑️ Archivo eliminado:', material.filename);
      } catch (err) {
        console.warn('⚠️ No se pudo eliminar archivo:', material.filename);
      }
    }
    
    // 3. Usar procedimiento almacenado para eliminar todo
    await connection.query('CALL eliminar_modulo_completo(?)', [id]);
    
    await connection.commit();
    
    res.json({
      success: true,
      mensaje: 'Módulo eliminado completamente'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error eliminando módulo:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
};
// Toggle activo/inactivo de un módulo (para admin)
exports.toggleActivoModulo = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(`
      UPDATE modulos
      SET activo = NOT activo
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      mensaje: 'Estado del módulo actualizado correctamente'
    });

  } catch (error) {
    console.error('Error cambiando estado del módulo:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

exports.toggleActivoActividad = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query(`
      UPDATE actividades 
      SET activo = NOT activo 
      WHERE id = ?
    `, [id]);
    
    res.json({
      success: true,
      mensaje: 'Estado de la actividad actualizado correctamente'
    });
    
  } catch (error) {
    console.error('Error cambiando estado de la actividad:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};


// ===== GESTIÓN DE ACTIVIDADES =====

// En admin.controller.js - Obtener TODAS las actividades (incluyendo inactivas)

exports.obtenerActividades = async (req, res) => {
  try {
    // Para admin, mostrar TODAS las actividades (activas e inactivas)
    const [actividades] = await db.query(`
      SELECT a.*,
             COUNT(DISTINCT au.id_usuario) as usuarios_completaron
      FROM actividades a
      LEFT JOIN actividad_usuario au ON a.id = au.id_referencia 
        AND au.tipo_actividad = 'actividad'
        AND au.resultado = 'Completada'
      GROUP BY a.id
      ORDER BY a.orden ASC, a.id ASC
    `);
    
    res.json({
      success: true,
      data: actividades
    });
    
  } catch (error) {
    console.error('Error obteniendo actividades:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

exports.crearActividad = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      tipo,
      nivel,
      puntos,
      icono,
      color,
      duracion,
      orden
    } = req.body;
    
    if (!titulo || !descripcion || !tipo || !nivel) {
      return res.status(400).json({ mensaje: 'Campos requeridos: titulo, descripcion, tipo, nivel' });
    }
    
    const [result] = await db.query(`
      INSERT INTO actividades (
        titulo, descripcion, tipo, nivel, puntos, icono, color, duracion, orden, activo, fecha_creacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
    `, [
      titulo,
      descripcion,
      tipo,
      nivel,
      puntos || 10,
      icono || 'fas fa-gamepad',
      color || '#3498db',
      duracion || '10-15 min',
      orden || 1
    ]);
    
    res.status(201).json({
      success: true,
      mensaje: 'Actividad creada exitosamente',
      id: result.insertId
    });
    
  } catch (error) {
    console.error('Error creando actividad:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

exports.actualizarActividad = async (req, res) => {
  try {
    const { id } = req.params;
    const campos = req.body;
    
    const allowedFields = [
      'titulo', 'descripcion', 'tipo', 'nivel', 'puntos', 
      'icono', 'color', 'duracion', 'orden', 'activo'
    ];
    
    const updates = [];
    const values = [];
    
    Object.keys(campos).forEach(field => {
      if (allowedFields.includes(field)) {
        updates.push(`${field} = ?`);
        values.push(campos[field]);
      }
    });
    
    if (updates.length === 0) {
      return res.status(400).json({ mensaje: 'No hay campos válidos para actualizar' });
    }
    
    values.push(id);
    
    await db.query(`
      UPDATE actividades 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, values);
    
    res.json({
      success: true,
      mensaje: 'Actividad actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('Error actualizando actividad:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

exports.eliminarActividad = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query('UPDATE actividades SET activo = 0 WHERE id = ?', [id]);
    
    res.json({
      success: true,
      mensaje: 'Actividad eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('Error eliminando actividad:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// ===== GESTIÓN DE BIBLIOTECA =====

exports.obtenerRecursosBiblioteca = async (req, res) => {
  try {
    const [recursos] = await db.query(`
      SELECT * FROM biblioteca
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      data: recursos
    });
    
  } catch (error) {
    console.error('Error obteniendo recursos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

exports.crearRecursoBiblioteca = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      contenido,
      autor,
      tipo,
      url,
      thumbnail,
      nivel,
      categoria,
      duracion,
      puntos,
      archivoUrl,
      thumbnailUrl
    } = req.body;
    
    if (!titulo || !autor || !tipo) {
      return res.status(400).json({ 
        mensaje: 'Campos requeridos: titulo, autor, tipo' 
      });
    }
    
    const urlFinal = archivoUrl || url;
    const thumbnailFinal = thumbnailUrl || thumbnail;
    
    const [result] = await db.query(`
      INSERT INTO biblioteca (
        titulo, descripcion, contenido, autor, tipo, url, thumbnail, 
        nivel, categoria, duracion, puntos, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      titulo,
      descripcion || null,
      contenido || null,
      autor,
      tipo,
      urlFinal || null,
      thumbnailFinal || null,
      nivel || 'basico',
      categoria || null,
      duracion || null,
      puntos || 0
    ]);
    
    res.status(201).json({
      success: true,
      mensaje: 'Recurso creado exitosamente',
      id: result.insertId
    });
    
  } catch (error) {
    console.error('Error creando recurso:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

exports.actualizarRecursoBiblioteca = async (req, res) => {
  try {
    const { id } = req.params;
    const campos = req.body;
    
    const allowedFields = [
      'titulo', 'descripcion', 'contenido', 'autor', 'tipo', 'url', 
      'thumbnail', 'nivel', 'categoria', 'duracion', 'puntos'
    ];
    
    const updates = [];
    const values = [];
    
    Object.keys(campos).forEach(field => {
      if (allowedFields.includes(field)) {
        updates.push(`${field} = ?`);
        values.push(campos[field]);
      }
    });
    
    // Manejar archivos subidos
    if (campos.archivoUrl) {
      updates.push('url = ?');
      values.push(campos.archivoUrl);
    }
    
    if (campos.thumbnailUrl) {
      updates.push('thumbnail = ?');
      values.push(campos.thumbnailUrl);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ 
        mensaje: 'No hay campos válidos para actualizar' 
      });
    }
    
    values.push(id);
    
    await db.query(`
      UPDATE biblioteca 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = ?
    `, values);
    
    res.json({
      success: true,
      mensaje: 'Recurso actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('Error actualizando recurso:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

exports.eliminarRecursoBiblioteca = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener información del recurso antes de eliminarlo
    const [recurso] = await db.query(
      'SELECT url, thumbnail FROM biblioteca WHERE id = ?', 
      [id]
    );
    
    if (recurso.length === 0) {
      return res.status(404).json({ 
        mensaje: 'Recurso no encontrado' 
      });
    }

    // Eliminar archivos físicos si existen y están en uploads (async)
    if (recurso[0].url && recurso[0].url.includes('uploads/materiales')) {
      const filename = path.basename(recurso[0].url);
      const filePath = path.join(__dirname, '../uploads/materiales', filename);
      try {
        await fsPromises.access(filePath);
        await fsPromises.unlink(filePath);
      } catch (err) {
        // Si no existe o hay error al eliminar, lo ignoramos y seguimos
        console.warn('⚠️ No se pudo eliminar archivo (url):', filePath);
      }
    }

    if (recurso[0].thumbnail && recurso[0].thumbnail.includes('uploads/materiales')) {
      const filename = path.basename(recurso[0].thumbnail);
      const filePath = path.join(__dirname, '../uploads/materiales', filename);
      try {
        await fsPromises.access(filePath);
        await fsPromises.unlink(filePath);
      } catch (err) {
        console.warn('⚠️ No se pudo eliminar archivo (thumbnail):', filePath);
      }
    }
    
    // Eliminar de la base de datos
    await db.query('DELETE FROM biblioteca WHERE id = ?', [id]);
    
    res.json({
      success: true,
      mensaje: 'Recurso eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error eliminando recurso:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// ===== ESTADÍSTICAS GLOBALES =====

exports.obtenerEstadisticasGenerales = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM usuarios) as total_usuarios,
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'admin') as total_admins,
        (SELECT COUNT(*) FROM modulos WHERE activo = 1) as total_modulos,
        (SELECT COUNT(*) FROM actividades WHERE activo = 1) as total_actividades,
        (SELECT COUNT(*) FROM biblioteca) as total_recursos,
        (SELECT COUNT(*) FROM certificados) as total_certificados,
        (SELECT COALESCE(SUM(tiempo_minutos), 0) FROM tiempo_estudio) as tiempo_total_estudio
    `);
    
    res.json({
      success: true,
      data: stats[0]
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas generales:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

exports.obtenerEstadisticasUsuarios = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        DATE_FORMAT(fecha_registro, '%Y-%m') as mes,
        COUNT(*) as nuevos_usuarios
      FROM usuarios
      WHERE fecha_registro >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(fecha_registro, '%Y-%m')
      ORDER BY mes ASC
    `);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas de usuarios:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};



exports.obtenerEstadisticasActividades = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        a.titulo,
        a.tipo,
        COUNT(DISTINCT au.id_usuario) as usuarios_completaron,
        AVG(au.puntos_obtenidos) as promedio_puntos
      FROM actividades a
      LEFT JOIN actividad_usuario au ON a.id = au.id_referencia AND au.resultado = 'Completada'
      WHERE a.activo = 1
      GROUP BY a.id, a.titulo, a.tipo
      ORDER BY usuarios_completaron DESC
    `);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas de actividades:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};