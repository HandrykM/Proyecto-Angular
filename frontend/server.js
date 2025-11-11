const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 8080;

// Servir archivos estáticos desde la carpeta correcta
app.use(express.static(path.join(__dirname, 'dist/frontend/browser')));

// IMPORTANTE: Todas las rutas que no sean archivos estáticos 
// deben devolver index.html para que Angular maneje el routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/frontend/browser/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Frontend servidor corriendo en puerto ${PORT}`);
  console.log(`📁 Sirviendo archivos desde: ${path.join(__dirname, 'dist/frontend/browser')}`);
});