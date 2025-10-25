// backend/controllers/biblioteca.controller.nuevo.js
const db = require('../config/db');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const logrosController = require('./logros.controller');

// Obtener todos los recursos
exports.getRecursos = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM biblioteca ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener recursos:", err);
    res.status(500).json({ message: "Error al obtener recursos", error: err });
  }
};

// Obtener un recurso específico
exports.getRecurso = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM biblioteca WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Recurso no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Error al obtener recurso:", err);
    res.status(500).json({ message: "Error al obtener recurso", error: err });
  }
};

// Crear recurso con archivo
exports.createRecurso = async (req, res) => {
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

    // Usar la URL del archivo subido si existe
    const urlFinal = archivoUrl || url;
    const thumbnailFinal = thumbnailUrl || thumbnail;

    const [result] = await db.query(
      `INSERT INTO biblioteca 
      (titulo, descripcion, contenido, autor, tipo, url, thumbnail, nivel, categoria, duracion, puntos) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, descripcion, contenido, autor, tipo, urlFinal, thumbnailFinal, nivel, categoria, duracion, puntos]
    );

    res.status(201).json({ 
      message: "Recurso creado con éxito", 
      id: result.insertId 
    });
  } catch (err) {
    console.error("Error al crear recurso:", err.sqlMessage || err);
    res.status(500).json({ 
      message: "Error al crear recurso", 
      error: err.sqlMessage || err 
    });
  }
};

// Actualizar recurso
exports.updateRecurso = async (req, res) => {
  try {
    const { id } = req.params;
    const { archivoUrl, thumbnailUrl, ...resto } = req.body;
    
    // Si hay nuevas URLs de archivos, usarlas
    const datosActualizados = {
      ...resto,
      ...(archivoUrl && { url: archivoUrl }),
      ...(thumbnailUrl && { thumbnail: thumbnailUrl })
    };

    const [result] = await db.query(
      "UPDATE biblioteca SET ? WHERE id = ?", 
      [datosActualizados, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Recurso no encontrado" });
    }

    res.json({ message: "Recurso actualizado" });
  } catch (err) {
    console.error("Error al actualizar recurso:", err);
    res.status(500).json({ message: "Error al actualizar recurso", error: err });
  }
};

// Eliminar recurso y sus archivos
exports.deleteRecurso = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener información del recurso antes de eliminarlo
    const [recurso] = await db.query("SELECT url, thumbnail FROM biblioteca WHERE id = ?", [id]);
    
    if (recurso.length === 0) {
      return res.status(404).json({ message: "Recurso no encontrado" });
    }

    // Eliminar archivos físicos si existen (async)
    if (recurso[0].url && recurso[0].url.includes('uploads/materiales')) {
      const filename = path.basename(recurso[0].url);
      const filePath = path.join(__dirname, '../uploads/materiales', filename);
      try {
        await fsPromises.access(filePath);
        await fsPromises.unlink(filePath);
      } catch (err) {
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

    // Eliminar registro de la base de datos
    const [result] = await db.query("DELETE FROM biblioteca WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Recurso no encontrado" });
    }

    res.json({ message: "Recurso eliminado" });
  } catch (err) {
    console.error("Error al eliminar recurso:", err);
    res.status(500).json({ message: "Error al eliminar recurso", error: err });
  }
};

// Registrar lectura de recurso y otorgar puntos
exports.registrarLectura = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_usuario } = req.body;

    if (!id_usuario) {
      return res.status(400).json({ message: "ID de usuario requerido" });
    }

    // Verificar si ya se registró esta lectura
    const [lecturaExistente] = await db.query(
      `SELECT id FROM actividad_usuario 
       WHERE id_usuario = ? AND tipo_actividad = 'biblioteca' AND id_referencia = ?`,
      [id_usuario, id]
    );

    if (lecturaExistente.length > 0) {
      return res.json({ 
        message: "Ya has leído este recurso anteriormente",
        yaLeido: true
      });
    }

    // Obtener información del recurso
    const [recurso] = await db.query(
      "SELECT titulo, puntos FROM biblioteca WHERE id = ?", 
      [id]
    );

    if (recurso.length === 0) {
      return res.status(404).json({ message: "Recurso no encontrado" });
    }

    const puntosObtenidos = recurso[0].puntos || 0;

    // Registrar la lectura
    await db.query(
      `INSERT INTO actividad_usuario 
       (id_usuario, tipo_actividad, id_referencia, titulo, resultado, puntos_obtenidos) 
       VALUES (?, 'biblioteca', ?, ?, 'Completada', ?)`,
      [id_usuario, id, recurso[0].titulo, puntosObtenidos]
    );

    // ✅ VERIFICAR LOGROS DESPUÉS DE COMPLETAR LECTURA
    const logrosNuevos = await logrosController.verificarYOtorgarLogros(id_usuario);

    res.json({ 
      message: "Lectura registrada exitosamente",
      puntosObtenidos,
      yaLeido: false,
      logrosNuevos: logrosNuevos // ✅ Devolver logros obtenidos
    });
  } catch (err) {
    console.error("Error al registrar lectura:", err);
    res.status(500).json({ 
      message: "Error al registrar lectura", 
      error: err 
    });
  }
};

// Verificar si un usuario ya leyó un recurso
exports.verificarLectura = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_usuario } = req.query;

    if (!id_usuario) {
      return res.status(400).json({ message: "ID de usuario requerido" });
    }

    const [lectura] = await db.query(
      `SELECT id, puntos_obtenidos, fecha_actividad 
       FROM actividad_usuario 
       WHERE id_usuario = ? AND tipo_actividad = 'biblioteca' AND id_referencia = ?`,
      [id_usuario, id]
    );

    res.json({ 
      leido: lectura.length > 0,
      datos: lectura.length > 0 ? lectura[0] : null
    });
  } catch (err) {
    console.error("Error al verificar lectura:", err);
    res.status(500).json({ 
      message: "Error al verificar lectura", 
      error: err 
    });
  }
};