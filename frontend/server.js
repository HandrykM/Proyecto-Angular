const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 8080;
const BUILD_PATH = path.join(__dirname, 'dist/frontend/browser');

// Servir archivos estáticos
app.use(express.static(BUILD_PATH));

// Todas las rutas no estáticas van a index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(BUILD_PATH, 'index.html'));
});

// Arrancar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Frontend servidor corriendo en puerto ${PORT}`);
  console.log(`📁 Sirviendo archivos desde: ${BUILD_PATH}`);
});
