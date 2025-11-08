// backend/db.js
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    // Railway MySQL necesita SSL, pero sin validación estricta del certificado
    rejectUnauthorized: false
  }
});

// Verificar conexión al iniciar
db.getConnection()
  .then(conn => {
    console.log("✅ Conexión a la base de datos establecida correctamente");
    conn.release();
  })
  .catch(err => {
    console.error("❌ Error al conectar a la base de datos:", err.message);
  });

module.exports = db;
