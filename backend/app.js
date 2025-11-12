// backend/app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const app = express();

// ============================================
// DEBUGGING MIDDLEWARE - DEBE IR PRIMERO
// ============================================
app.use((req, res, next) => {
  console.log('==================================');
  console.log('📨 Origin:', req.headers.origin);
  console.log('🔍 Method:', req.method);
  console.log('🛣️  Path:', req.path);
  console.log('🌐 ALLOWED_ORIGINS env:', process.env.ALLOWED_ORIGINS);
  console.log('==================================');
  next();
});

// ============================================
// CORS Configuration - CORREGIDA
// ============================================
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['https://hydrosave-frontend.onrender.com'];

console.log('🚀 Servidor iniciando...');
console.log('🌐 Orígenes permitidos configurados:', allowedOrigins);

const corsOptions = {
  origin: function(origin, callback) {
    // Permitir peticiones sin origin (Postman, apps móviles)
    if (!origin) {
      console.log('✅ Petición sin origin - PERMITIDA');
      return callback(null, true);
    }
    
    console.log(`🔍 Verificando origin: ${origin}`);
    console.log(`📋 Lista de permitidos:`, allowedOrigins);
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ Origin PERMITIDO: ${origin}`);
      callback(null, true);
    } else {
      console.error(`❌ Origin BLOQUEADO: ${origin}`);
      console.error(`📋 Orígenes permitidos:`, allowedOrigins);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Manejo explícito de preflight
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger de peticiones
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Middleware para medir duración de cada request
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`⏱️ ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Disable ETag and force no-cache for API responses
app.disable('etag');
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// ============================================
// Servir archivos estáticos
// ============================================
app.use('/uploads', (req, res, next) => {
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
    modules: [
      'auth', 'modulos', 'lecturas', 'materiales',
      'actividades', 'biblioteca', 'upload', 'perfil', 
      'logros', 'certificados', 'preferencias', 'admin'
    ]
  });
});

app.get('/', (req, res) => {
  res.send('💧 API de Proyecto Agua funcionando');
});

// ============================================
// MANEJO DE ERRORES
// ============================================

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
  
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`🔍 Health check: https://proyecto-angular-loa8.onrender.com/api/health-check`);
  console.log(`📁 Archivos estáticos: /uploads/`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS permitido para:`, allowedOrigins);
  console.log('='.repeat(50));
});
