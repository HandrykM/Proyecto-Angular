const jwt = require('jsonwebtoken');

exports.requireAdmin = (req, res, next) => {
  try {
    const token = req.headers['authorization'];

    if (!token) {
      return res.status(403).json({ message: 'Token requerido' });
    }

    const bearerToken = token.split(' ')[1];

    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
      }

      if (decoded.rol !== 'admin') {
        return res.status(403).json({ 
          message: 'Acceso denegado: se requiere rol de administrador' 
        });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Error en middleware admin:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

exports.requireAuth = (req, res, next) => {
  try {
    const token = req.headers['authorization'];

    if (!token) {
      return res.status(403).json({ message: 'Token requerido' });
    }

    const bearerToken = token.split(' ')[1];

    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Error en middleware auth:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};