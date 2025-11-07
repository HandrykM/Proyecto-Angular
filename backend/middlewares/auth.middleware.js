// backend/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');

// Caché de sesiones activas (evita consultas duplicadas)
const sessionCache = new Map();
const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_aqui_cambiala_en_produccion');
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = {
      id: decoded.id,
      nombre: decoded.nombre,
      correo: decoded.correo,
      rol: decoded.rol
    };

    // ✅ GESTIÓN DE SESIONES (evita duplicados)
    const userId = decoded.id;
    const cacheKey = `session_${userId}_${token.substring(0, 20)}`;

    // Verificar si la sesión ya está en caché
    if (sessionCache.has(cacheKey)) {
      const cachedSession = sessionCache.get(cacheKey);
      
      // Si la sesión en caché no ha expirado, usar esa
      if (Date.now() - cachedSession.timestamp < SESSION_CACHE_TTL) {
        req.sessionId = cachedSession.sessionId;
        
        // Actualizar última actividad cada 2 minutos (no en cada request)
        if (Date.now() - cachedSession.lastUpdate > 2 * 60 * 1000) {
          updateSessionActivity(cachedSession.sessionId, userId);
          cachedSession.lastUpdate = Date.now();
        }
        
        return next();
      } else {
        // Sesión en caché expirada, eliminar
        sessionCache.delete(cacheKey);
      }
    }

    // ✅ BUSCAR O CREAR SESIÓN (solo si no está en caché)
    const sessionId = await findOrCreateSession(req, userId, token);
    
    if (sessionId) {
      req.sessionId = sessionId;
      
      // Guardar en caché
      sessionCache.set(cacheKey, {
        sessionId,
        timestamp: Date.now(),
        lastUpdate: Date.now()
      });
    }

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    console.error('Error en verificación de token:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Buscar sesión activa o crear una nueva
 */
async function findOrCreateSession(req, userId, token) {
  try {
    const ip = getClientIP(req);
    const userAgent = req.get('User-Agent') || 'Desconocido';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const deviceType = result.device.type || 'desktop';
    const browserName = result.browser.name || 'Desconocido';
    const osName = result.os.name || 'Desconocido';
    const dispositivo = `${deviceType === 'mobile' ? '📱' : '💻'} ${osName} - ${browserName}`;

    // Buscar sesión activa con las mismas características
    const [existingSessions] = await db.execute(`
      SELECT id 
      FROM sesiones_usuario 
      WHERE id_usuario = ? 
        AND ip = ? 
        AND dispositivo = ?
        AND activo = 1
        AND ultima_actividad > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
      LIMIT 1
    `, [userId, ip, dispositivo]);

    if (existingSessions.length > 0) {
      // Usar sesión existente
      return existingSessions[0].id;
    }

    // Crear nueva sesión
    const geo = geoip.lookup(ip);
    const ubicacion = geo ? `${geo.city || ''}, ${geo.country || ''}`.trim() : 'Desconocida';

    const [result_insert] = await db.execute(`
      INSERT INTO sesiones_usuario (
        id_usuario, ip, dispositivo, navegador, 
        sistema_operativo, ubicacion, user_agent, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, [userId, ip, dispositivo, browserName, osName, ubicacion, userAgent]);

    console.log('✅ Nueva sesión registrada:', {
      userId,
      ip,
      dispositivo,
      ubicacion
    });

    return result_insert.insertId;

  } catch (error) {
    console.error('Error al gestionar sesión:', error);
    return null;
  }
}

/**
 * Actualizar última actividad de la sesión
 */
async function updateSessionActivity(sessionId, userId) {
  try {
    await db.execute(
      'UPDATE sesiones_usuario SET ultima_actividad = NOW() WHERE id = ? AND id_usuario = ?',
      [sessionId, userId]
    );
  } catch (error) {
    console.error('Error al actualizar actividad de sesión:', error);
  }
}

/**
 * Obtener IP real del cliente
 */
function getClientIP(req) {
  // Verificar headers de proxies
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }

  return req.ip || req.connection.remoteAddress || '127.0.0.1';
}

/**
 * Limpiar caché de sesiones periódicamente
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of sessionCache.entries()) {
    if (now - value.timestamp > SESSION_CACHE_TTL) {
      sessionCache.delete(key);
    }
  }
}, SESSION_CACHE_TTL);

/**
 * Verificar rol de administrador
 */
const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
  next();
};

module.exports = {
  verifyToken,
  verifyAdmin
};