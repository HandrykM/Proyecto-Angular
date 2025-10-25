const db = require('../config/db');

const User = {
  create: async (nombre, correo, contrasena) => {
    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, correo, contrasena) VALUES (?, ?, ?)', 
      [nombre, correo, contrasena]
    );
    return result;
  },

  // Búsqueda CASE-SENSITIVE para login
  findByUserExact: async (nombre) => {
    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE BINARY nombre = ?', 
      [nombre]
    );
    return rows;
  },

  findByUser: async (nombre) => {
    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE nombre = ?', 
      [nombre]
    );
    return rows;
  },

  findByEmail: async (correo) => {
    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE correo = ?', 
      [correo]
    );
    return rows;
  },

  saveResetToken: async (correo, token, expire) => {
    const [result] = await db.query(
      'UPDATE usuarios SET reset_token = ?, reset_token_expire = ? WHERE correo = ?', 
      [token, expire, correo]
    );
    return result;
  },

  findByResetToken: async (token) => {
    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE reset_token = ? AND reset_token_expire > NOW()', 
      [token]
    );
    return rows;
  },

  updatePassword: async (id, newPassword) => {
    const [result] = await db.query(
      'UPDATE usuarios SET contrasena = ?, reset_token = NULL, reset_token_expire = NULL WHERE id = ?', 
      [newPassword, id]
    );
    return result;
  },

  updateLastLogin: async (id) => {
    const [result] = await db.query(
      'UPDATE usuarios SET ultima_actividad = NOW() WHERE id = ?', 
      [id]
    );
    return result;
  }
};

module.exports = User;