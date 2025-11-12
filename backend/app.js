// backend/app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const app = express();

// ============================================
// DEBUGGING MIDDLEWARE - Solo en desarrollo
// ============================================
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log('==================================');
    console.log('📨 Origin:', req.headers.origin);
    console.log('🔍 Method:', req.method);
    console.log('🛣️  Path:', req.path);
    console.log('==================================');
    next();
  });
}

// ============================================
// CORS Configuration - OPTIMIZADA
// ============================================
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['https://hydrosave-frontend.onrender.com'];

console.log('🚀 Servidor iniciando...');
console.log('🌐 Entorno:', process.env.NODE_ENV);
console.log('🌐 Orígenes permitidos:', allowedOrigins);

const corsOptions = {
  origin: function(origin, callback) {
    // Permitir peticiones sin origin (Postman, apps móviles, mismo dominio)
    if (!origin || origin === 'null') {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`❌ Origin BLOQUEADO: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 horas
};

app.use(cors(corsOptions));

// Manejo explícito de preflight
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger de peticiones - Solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  // En producción, solo loggear errores
  app.use(morgan('combined', {
    skip: function (req, res) { return res.statusCode < 400 }
  }));
}

// Disable ETag and force no-cache for API responses
app.disable('etag');
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// ============================================
// Servir archivos estáticos
// ============================================
app.use('/uploads', (req, res, next) => {
  res.set({
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=3600',
    'Access-Control-Allow-Origin': allowedOrigins.join(','),
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

// ============================================
// RUTAS DE LA API
// ============================================

// Autenticación
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// Módulos
const modulosRoutes = require('./routes/modulos.routes');
app.use('/api/modulos', modulosRoutes);

// Lecturas
const lecturasRoutes = require('./routes/lecturas.routes');
app.use('/api/modulos', lecturasRoutes);

// Materiales
const materialesRoutes = require('./routes/materiales.routes');
app.use('/api/materiales', materialesRoutes);

// Actividades
const actividadesRoutes = require('./routes/actividades.routes');
app.use('/api', actividadesRoutes);

// Biblioteca
const bibliotecaRoutes = require('./routes/biblioteca.routes');
app.use('/api/biblioteca', bibliotecaRoutes);

// Upload
const uploadRoutes = require('./routes/upload.routes');
app.use('/api/upload', uploadRoutes);

// Perfil
const perfilRoutes = require('./routes/perfil.routes');
app.use('/api/perfil', perfilRoutes);

// Logros
const logrosRoutes = require('./routes/logros.routes');
app.use('/api', logrosRoutes);

// Certificados
const certificadosRoutes = require('./routes/certificados.routes');
app.use('/api', certificadosRoutes);

// Preferencias
const preferenciasRoutes = require('./routes/preferencias.routes');
app.use('/api', preferenciasRoutes);

// Reutilizable
const reutilizableRoutes = require('./routes/reutilizable.routes');
app.use('/api/reutilizable', reutilizableRoutes);

// Notificaciones
const notificacionesRoutes = require('./routes/notificaciones.routes');
app.use('/api/notificaciones', notificacionesRoutes);

// Configuración de usuario
const configuracionUsuarioRoutes = require('./routes/configuracion_usuario.routes');
app.use('/api', configuracionUsuarioRoutes);

// Admin
const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);

// ============================================
// RUTAS ESPECIALES
// ============================================

// Health check
app.get('/api/health-check', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'proyecto-agua-api',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database: process.env.DB_HOST ? 'connected' : 'not configured',
    allowedOrigins: allowedOrigins,
    backend_url: process.env.BACKEND_URL || 'not set',
    modules: [
      'auth', 'modulos', 'lecturas', 'materiales',
      'actividades', 'biblioteca', 'upload', 'perfil', 
      'logros', 'certificados', 'preferencias', 'admin'
    ]
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '💧 API de Proyecto Agua funcionando',
    version: '1.0.0',
    endpoints: {
      health: '/api/health-check',
      frontend: process.env.CLIENT_URL
    }
  });
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('❌ Error global:', err);
  
  if (err.message && err.message.includes('Not allowed by CORS')) {
    return res.status(403).json({ 
      error: 'CORS policy error',
      message: 'Origin not allowed',
      origin: req.headers.origin,
      allowedOrigins: allowedOrigins
    });
  }
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'El archivo es demasiado grande. Tamaño máximo: 50MB' 
      });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      error: 'Token inválido o expirado',
      message: err.message 
    });
  }
  
  res.status(err.status || 500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`🔍 Health check: ${process.env.BACKEND_URL || `http://localhost:${PORT}`}/api/health-check`);
  console.log(`📁 Archivos estáticos: /uploads/`);
  console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS permitido para:`, allowedOrigins);
  console.log(`🎯 Frontend URL: ${process.env.CLIENT_URL || 'not set'}`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;