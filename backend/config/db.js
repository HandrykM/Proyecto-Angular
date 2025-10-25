const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection()
  .then(conn => {
    console.log("Conexión a MySQL establecida ✅");
    conn.release();
  })
  .catch(err => {
    console.error("Error al conectar a la base de datos:", err);
  });

module.exports = db;
