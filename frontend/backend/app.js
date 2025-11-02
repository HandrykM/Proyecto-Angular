// backend/app.nuevo.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
// Logger de peticiones (muestra método, url y tiempo)
//app.use(morgan('dev'));

// Middleware para medir duración de cada request y detectar bloqueos
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    //console.log(`⏱️ ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Disable ETag and force no-cache for API responses to avoid 304 for JSON endpoints
app.disable('etag');
app.use('/api', (req, res, next) => {
  // For APIs we don't want browser caching to return 304 with empty body
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Servir archivos estáticos
// Configuración especial para videos y otros archivos
app.use('/uploads', (req, res, next) => {
  // Habilitar partial content y rangos para videos
  res.set({
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=3600',
  });
  if (req.path.endsWith('.mp4') || req.path.endsWith('.webm')) {
    const options = {
      dotfiles: 'deny',
      headers: {
        'Content-Type': req.path.endsWith('.mp4') ? 'video/mp4' : 'video/webm'
      }
    };
    express.static(path.join(__dirname, 'uploads'), options)(req, res, next);
  } else {
    express.static(path.join(__dirname, 'uploads'))(req, res, next);
  }
});
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Rutas de autenticación
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// Rutas de módulos
const modulosRoutes = require('./routes/modulos.routes');
app.use('/api/modulos', modulosRoutes);

// Rutas de lecturas
const lecturasRoutes = require('./routes/lecturas.routes');
app.use('/api/modulos', lecturasRoutes);

// Rutas de materiales adicionales
const materialesRoutes = require('./routes/materiales.routes');
app.use('/api/materiales', materialesRoutes);


// Rutas de actividades
const actividadesRoutes = require('./routes/actividades.routes');
app.use('/api', actividadesRoutes);

// Rutas de biblioteca (NUEVA VERSIÓN)
const bibliotecaRoutes = require('./routes/biblioteca.routes');
app.use('/api/biblioteca', bibliotecaRoutes);

// Rutas de upload (NUEVO)
const uploadRoutes = require('./routes/upload.routes');
app.use('/api/upload', uploadRoutes);

// Rutas de perfil
const perfilRoutes = require('./routes/perfil.routes');
app.use('/api/perfil', perfilRoutes);

// Rutas de logros
const logrosRoutes = require('./routes/logros.routes');
app.use('/api', logrosRoutes);

// Rutas de certificados
const certificadosRoutes = require('./routes/certificados.routes');
app.use('/api', certificadosRoutes);

// Rutas de preferencias
const preferenciasRoutes = require('./routes/preferencias.routes');
app.use('/api', preferenciasRoutes);

// Rutas de reutilizable (NUEVO)
const reutilizableRoutes = require('./routes/reutilizable.routes');
app.use('/api/reutilizable', reutilizableRoutes);

const configuracionUsuarioRoutes = require('./routes/configuracion_usuario.routes');
app.use('/api', configuracionUsuarioRoutes);



// Rutas de admin
const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health-check', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'proyecto-agua-api',
    timestamp: new Date().toISOString(),
    modules: [
      'auth', 
      'modulos', 
      'lecturas',
      'materiales',
      'actividades', 
      'biblioteca', 
      'upload',
      'perfil', 
      'logros', 
      'certificados', 
      'preferencias',
      'admin'
    ]
  });
});

app.get('/', (req, res) => {
  res.send('💧 API de Proyecto Agua funcionando');
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'El archivo es demasiado grande. Tamaño máximo: 50MB' 
      });
    }
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health-check`);
  console.log(`📁 Archivos estáticos: http://localhost:${PORT}/uploads/`);
});