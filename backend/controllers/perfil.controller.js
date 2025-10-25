// backend/controllers/perfil.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/perfiles/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'perfil-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, JPG, PNG, GIF)'));
    }
  }
});

// === OBTENER PERFIL COMPLETO === //
const obtenerPerfilCompleto = async (req, res) => {
  try {
    const userId = req.user.id;

    const [userResult] = await db.execute(
      `SELECT u.id, u.nombre, u.correo, u.telefono, u.nombre_usuario as nombreUsuario, 
              u.foto, u.fecha_registro as fechaRegistro, u.rol
       FROM usuarios u 
       WHERE u.id = ?`,
      [userId]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const usuario = userResult[0];

    const configuracion = {
      idioma: 'es',
      modoOscuro: false,
      tamanoFuente: 'mediano',
      notificaciones: {
        email: true,
        sms: false,
        push: true,
        recordatorios: true,
        logros: true
      }
    };

    // ✅ MÓDULOS COMPLETADOS (con progreso >= 100%)
    const [modulosCompletados] = await db.execute(`
      SELECT COUNT(DISTINCT modulo_data.modulo_id) as modulos_completados
      FROM (
        SELECT 
          l.modulo_id,
          COUNT(l.id) as total_lecturas,
          SUM(CASE WHEN pl.completada = 1 THEN 1 ELSE 0 END) as lecturas_completadas,
          ROUND((SUM(CASE WHEN pl.completada = 1 THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(l.id), 0), 0) as progreso
        FROM lecturas l
        INNER JOIN modulos m ON l.modulo_id = m.id
        LEFT JOIN progreso_lecturas pl ON l.id = pl.lectura_id AND pl.usuario_id = ?
        WHERE l.activa = 1 AND m.activo = 1
        GROUP BY l.modulo_id
        HAVING progreso >= 100
      ) as modulo_data
    `, [userId]);

    // ✅ PUNTOS DE MÓDULOS (solo módulos completados al 100%)
    const [puntosModulos] = await db.execute(`
      SELECT COALESCE(SUM(CAST(m.puntos AS UNSIGNED)), 0) as puntos_modulos
      FROM modulos m
      LEFT JOIN lecturas l ON m.id = l.modulo_id AND l.activa = 1
      LEFT JOIN progreso_lecturas pl ON l.id = pl.lectura_id AND pl.usuario_id = ?
      WHERE m.activo = 1
      GROUP BY m.id
      HAVING ROUND((SUM(CASE WHEN pl.completada = 1 THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(l.id), 0), 0) >= 100
    `, [userId]);

    // ✅ PUNTOS DE ACTIVIDADES (sin límites artificiales)
    const [puntosActividades] = await db.execute(`
      SELECT COALESCE(SUM(CAST(puntos_obtenidos AS UNSIGNED)), 0) as puntos_actividades
      FROM actividad_usuario
      WHERE id_usuario = ? 
        AND resultado = 'Completada' 
        AND puntos_obtenidos > 0
    `, [userId]);

    // Tiempo total de estudio
    const [tiempoEstudio] = await db.execute(
      `SELECT COALESCE(SUM(tiempo_minutos), 0) as tiempo_total
       FROM tiempo_estudio
       WHERE id_usuario = ?`,
      [userId]
    );

    // Actividades completadas
    const [actividadesCompletadas] = await db.execute(
      `SELECT COUNT(*) as total_actividades
       FROM actividad_usuario
       WHERE id_usuario = ? AND resultado = 'Completada'`,
      [userId]
    );

    // Última actividad
    const [ultimaActividad] = await db.execute(
      `SELECT MAX(fecha_lectura) as ultima_fecha
       FROM progreso_contenido
       WHERE id_usuario = ?`,
      [userId]
    );

    const puntosModulosNum = parseInt(puntosModulos[0]?.puntos_modulos) || 0;
    const puntosActividadesNum = parseInt(puntosActividades[0]?.puntos_actividades) || 0;
    const totalPuntos = puntosModulosNum + puntosActividadesNum;

    /*console.log('📊 DEBUG PUNTOS:', {
      puntosModulos: puntosModulosNum,
      puntosActividades: puntosActividadesNum,
      totalPuntos
    });*/

    const estadisticas = {
      tiempoTotalEstudio: tiempoEstudio[0]?.tiempo_total || 0,
      modulosCompletados: parseInt(modulosCompletados[0]?.modulos_completados) || 0,
      actividadesCompletadas: actividadesCompletadas[0]?.total_actividades || 0,
      puntosTotal: totalPuntos,
      racha: 1,
      ultimaActividad: ultimaActividad[0]?.ultima_fecha || usuario.fechaRegistro
    };

    const perfilCompleto = {
      ...usuario,
      configuracion,
      estadisticas
    };

    res.json(perfilCompleto);

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// === OBTENER HISTORIAL DE ACTIVIDAD - CORREGIDO === //
const obtenerHistorialActividad = async (req, res) => {
  try {
    const userId = req.user.id;
    const limite = parseInt(req.query.limite) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const tipo = req.query.tipo;

    let query = `
      SELECT 
        'modulo' as tipo,
        m.titulo,
        pl.fecha_completada as fecha,
        CAST(m.puntos AS UNSIGNED) as puntos,
        CASE WHEN progreso_mod.progreso >= 100 THEN 1 ELSE 0 END as completado,
        m.nivel as detalles
      FROM progreso_lecturas pl
      INNER JOIN lecturas l ON pl.lectura_id = l.id
      INNER JOIN modulos m ON l.modulo_id = m.id
      LEFT JOIN (
        SELECT 
          l2.modulo_id,
          ROUND((SUM(CASE WHEN pl2.completada = 1 THEN 1 ELSE 0 END) * 100.0) / COUNT(l2.id), 0) as progreso
        FROM lecturas l2
        LEFT JOIN progreso_lecturas pl2 ON l2.id = pl2.lectura_id AND pl2.usuario_id = ?
        WHERE l2.activa = 1
        GROUP BY l2.modulo_id
      ) as progreso_mod ON m.id = progreso_mod.modulo_id
      WHERE pl.usuario_id = ? AND m.activo = 1 AND pl.completada = 1
      ${tipo === 'modulo' ? '' : 'AND 1=0'}
      GROUP BY m.id, m.titulo, pl.fecha_completada, m.puntos, m.nivel
      
      UNION ALL
      
      SELECT 
        'actividad' as tipo,
        a.titulo,
        au.fecha_actividad as fecha,
        CAST(au.puntos_obtenidos AS UNSIGNED) as puntos,
        CASE WHEN au.resultado = 'Completada' THEN 1 ELSE 0 END as completado,
        a.nivel as detalles
      FROM actividad_usuario au
      JOIN actividades a ON au.id_referencia = a.id
      WHERE au.id_usuario = ? AND au.tipo_actividad = 'actividad'
      ${tipo === 'actividad' ? '' : tipo ? 'AND 1=0' : ''}
      
      ORDER BY fecha DESC
      LIMIT ? OFFSET ?
    `;

    const params = [userId, userId, userId, limite, offset];

    const [historial] = await db.execute(query, params);

    res.json({
      success: true,
      data: historial
    });

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener historial',
      data: []
    });
  }
};

// === ACTUALIZAR INFORMACIÓN PERSONAL === //
const actualizarInformacionPersonal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombre, nombreUsuario, correo, telefono } = req.body;

    if (!nombre || !correo) {
      return res.status(400).json({ mensaje: 'Nombre y correo son obligatorios' });
    }

    const [emailCheck] = await db.execute(
      'SELECT id FROM usuarios WHERE correo = ? AND id != ?',
      [correo, userId]
    );

    if (emailCheck.length > 0) {
      return res.status(400).json({ mensaje: 'El correo ya está en uso' });
    }

    if (nombreUsuario) {
      const [usernameCheck] = await db.execute(
        'SELECT id FROM usuarios WHERE nombre_usuario = ? AND id != ?',
        [nombreUsuario, userId]
      );

      if (usernameCheck.length > 0) {
        return res.status(400).json({ mensaje: 'El nombre de usuario ya está en uso' });
      }
    }

    await db.execute(
      `UPDATE usuarios 
       SET nombre = ?, correo = ?, telefono = ?, nombre_usuario = ?
       WHERE id = ?`,
      [nombre, correo, telefono || null, nombreUsuario || null, userId]
    );

    const [updatedUser] = await db.execute(
      `SELECT u.*, 
              COALESCE(d.total_contenido_leido, 0) as modulosCompletados,
              COALESCE(d.total_actividades_completadas, 0) as actividadesCompletadas
       FROM usuarios u 
       LEFT JOIN dashboard d ON u.id = d.id_usuario 
       WHERE u.id = ?`,
      [userId]
    );

    res.json({
      mensaje: 'Información actualizada correctamente',
      usuario: updatedUser[0]
    });

  } catch (error) {
    console.error('Error al actualizar información:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// === SUBIR FOTO DE PERFIL === //
const subirFotoPerfil = [
  upload.single('foto'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ mensaje: 'No se proporcionó ningún archivo' });
      }

      const userId = req.user.id;
      const fotoUrl = `${req.protocol}://${req.get('host')}/uploads/perfiles/${req.file.filename}`;

      const [oldPhotoResult] = await db.execute(
        'SELECT foto FROM usuarios WHERE id = ?',
        [userId]
      );

      await db.execute(
        'UPDATE usuarios SET foto = ? WHERE id = ?',
        [fotoUrl, userId]
      );

      if (oldPhotoResult[0]?.foto) {
        const oldPhotoPath = oldPhotoResult[0].foto.replace(`${req.protocol}://${req.get('host')}/`, '');
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }

      res.json({
        mensaje: 'Foto de perfil actualizada correctamente',
        url: fotoUrl
      });

    } catch (error) {
      console.error('Error al subir foto:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
  }
];

// === CAMBIAR CONTRASEÑA === //
const cambiarContrasena = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contrasenaActual, nuevaContrasena } = req.body;

    if (!contrasenaActual || !nuevaContrasena) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    }

    if (nuevaContrasena.length < 6) {
      return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const [userResult] = await db.execute(
      'SELECT contrasena FROM usuarios WHERE id = ?',
      [userId]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const contrasenaValida = await bcrypt.compare(contrasenaActual, userResult[0].contrasena);
    if (!contrasenaValida) {
      return res.status(400).json({ mensaje: 'La contraseña actual es incorrecta' });
    }

    const nuevaContrasenaHash = await bcrypt.hash(nuevaContrasena, 10);

    await db.execute(
      'UPDATE usuarios SET contrasena = ? WHERE id = ?',
      [nuevaContrasenaHash, userId]
    );

    res.json({ mensaje: 'Contraseña actualizada correctamente' });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// === OBTENER HISTORIAL DE SESIONES === //
const obtenerHistorialSesiones = async (req, res) => {
  try {
    const userId = req.user.id;

    const historialSesiones = [
      {
        id: 1,
        fechaAcceso: new Date().toISOString(),
        ip: req.ip || '127.0.0.1',
        dispositivo: req.get('User-Agent') || 'Desconocido',
        navegador: 'Chrome',
        ubicacion: 'Colombia',
        activo: true
      }
    ];

    res.json(historialSesiones);

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// === ACTUALIZAR CONFIGURACIÓN === //
const actualizarConfiguracion = async (req, res) => {
  try {
    const userId = req.user.id;
    const configuracion = req.body;

    res.json({
      mensaje: 'Configuración actualizada correctamente',
      configuracion
    });

  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// === OBTENER LOGROS === //
const obtenerLogros = async (req, res) => {
  try {
    const userId = req.user.id;

    const logros = [
      {
        id: 1,
        titulo: '¡Primer paso!',
        descripcion: 'Completaste tu primer módulo de aprendizaje',
        icono: 'fas fa-star',
        fechaObtenido: new Date().toISOString(),
        categoria: 'Progreso'
      },
      {
        id: 2,
        titulo: 'Estudiante dedicado',
        descripcion: 'Estudiaste durante 5 horas esta semana',
        icono: 'fas fa-clock',
        fechaObtenido: new Date(Date.now() - 86400000).toISOString(),
        categoria: 'Tiempo'
      }
    ];

    res.json(logros);

  } catch (error) {
    console.error('Error al obtener logros:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// === OBTENER CERTIFICADOS === //
const obtenerCertificados = async (req, res) => {
  try {
    const userId = req.user.id;

    const certificados = [
      {
        id: 1,
        titulo: 'Especialista en Reutilización de Agua',
        descripcion: 'Certificado por completar el curso básico de reutilización de agua',
        fechaEmision: new Date().toISOString(),
        modulo: 'Fundamentos de Reutilización',
        urlCertificado: '/certificates/cert-1.pdf',
        verificado: true
      }
    ];

    res.json(certificados);

  } catch (error) {
    console.error('Error al obtener certificados:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// === OBTENER ESTADÍSTICAS DETALLADAS === //
const obtenerEstadisticasDetalladas = async (req, res) => {
  try {
    const userId = req.user.id;

    const estadisticas = {
      actividadSemanal: [
        { dia: 'Lun', minutos: 45 },
        { dia: 'Mar', minutos: 30 },
        { dia: 'Mié', minutos: 60 },
        { dia: 'Jue', minutos: 20 },
        { dia: 'Vie', minutos: 90 },
        { dia: 'Sáb', minutos: 40 },
        { dia: 'Dom', minutos: 25 }
      ],
      progresoModulos: [
        { modulo: 'Fundamentos', progreso: 100 },
        { modulo: 'Técnicas Avanzadas', progreso: 75 },
        { modulo: 'Implementación', progreso: 30 }
      ]
    };

    res.json(estadisticas);

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// === CERRAR SESIÓN === //
const cerrarSesion = async (req, res) => {
  try {
    res.json({ mensaje: 'Sesión cerrada correctamente' });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// === ELIMINAR CUENTA === //
const eliminarCuenta = async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmacion } = req.body;

    if (confirmacion !== 'ELIMINAR') {
      return res.status(400).json({ mensaje: 'Confirmación incorrecta' });
    }

    const [userResult] = await db.execute(
      'SELECT foto FROM usuarios WHERE id = ?',
      [userId]
    );

    if (userResult[0]?.foto) {
      const photoPath = userResult[0].foto.replace(`${req.protocol}://${req.get('host')}/`, '');
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await db.execute('DELETE FROM usuarios WHERE id = ?', [userId]);

    res.json({ mensaje: 'Cuenta eliminada correctamente' });

  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  obtenerPerfilCompleto,
  actualizarInformacionPersonal,
  subirFotoPerfil,
  cambiarContrasena,
  obtenerHistorialSesiones,
  actualizarConfiguracion,
  obtenerLogros,
  obtenerCertificados,
  obtenerEstadisticasDetalladas,
  obtenerHistorialActividad,
  cerrarSesion,
  eliminarCuenta
};