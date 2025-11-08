// auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');
const transporter = require('../config/mailer');

// ======================
// VALIDACIONES
// ======================
const validatePassword = (password) => {
  if (password.length < 6) {
    return { valid: false, message: 'La contraseña debe tener mínimo 6 caracteres' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos una mayúscula' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos una minúscula' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos un número' };
  }
  return { valid: true };
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// ======================
// REGISTRO
// ======================
exports.register = async (req, res) => {
  try {
    const { nombre, correo, contrasena, repetirContrasena } = req.body;

    if (!nombre || !correo || !contrasena || !repetirContrasena) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    if (!validateUsername(nombre)) {
      return res.status(400).json({ 
        message: 'El usuario debe tener entre 3-20 caracteres y solo puede contener letras, números y guiones bajos' 
      });
    }

    if (!validateEmail(correo)) {
      return res.status(400).json({ message: 'El correo electrónico no es válido' });
    }

    const passwordValidation = validatePassword(contrasena);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    if (contrasena !== repetirContrasena) {
      return res.status(400).json({ message: 'Las contraseñas no coinciden' });
    }

    const existingEmail = await User.findByEmail(correo);
    if (existingEmail.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const existingUser = await User.findByUserExact(nombre);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const contrasenaHash = await bcrypt.hash(contrasena, 12);
    await User.create(nombre, correo, contrasenaHash);

    res.status(201).json({ 
      message: 'Usuario registrado con éxito',
      info: 'Recuerda usar tu usuario exactamente como lo registraste'
    });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// ======================
// LOGIN
// ======================
exports.login = async (req, res) => {
  try {
    const { nombre, contrasena } = req.body;

    if (!nombre || !contrasena) {
      return res.status(400).json({ message: 'Usuario y contraseña son obligatorios' });
    }

    const userResults = await User.findByUserExact(nombre);
    
    if (userResults.length === 0) {
      return res.status(401).json({ 
        message: 'Usuario o contraseña incorrectos',
        hint: 'El usuario distingue entre mayúsculas y minúsculas'
      });
    }

    const user = userResults[0];
    const match = await bcrypt.compare(contrasena, user.contrasena);
    
    if (!match) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, correo: user.correo, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await User.updateLastLogin(user.id);

    res.json({ 
      message: 'Inicio de sesión exitoso', 
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
        foto: user.foto ? `${process.env.CLIENT_URL || 'http://localhost:3000'}${user.foto}` : null
      }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// ======================
// LOGOUT
// ======================
exports.logout = (req, res) => {
  // Aquí no es necesario hacer nada si usas JWT sin sesiones del lado del servidor
  res.status(200).json({ message: 'Sesión cerrada correctamente' });
};

// ======================
// OLVIDÉ CONTRASEÑA
// ======================
exports.forgotPassword = async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({ message: 'El correo es obligatorio' });
    }

    if (!validateEmail(correo)) {
      return res.status(400).json({ message: 'El correo electrónico no es válido' });
    }

    const userResults = await User.findByEmail(correo);
    
    if (userResults.length === 0) {
      return res.json({ 
        message: 'Si el correo está registrado, recibirás un enlace de recuperación' 
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expireTime = new Date(Date.now() + 60 * 60 * 1000);

    await User.saveResetToken(correo, resetToken, expireTime);

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"HydroSave" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: 'Recuperación de contraseña - HydroSave',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00a8e8;">Recuperación de contraseña</h2>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #00a8e8; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Restablecer contraseña
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Este enlace expirará en 1 hora.</p>
          <p style="color: #666; font-size: 14px;">Si no solicitaste este cambio, ignora este correo.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ 
      message: 'Si el correo está registrado, recibirás un enlace de recuperación' 
    });
  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// ======================
// RESTABLECER CONTRASEÑA
// ======================
exports.resetPassword = async (req, res) => {
  try {
    const { token, nuevaContrasena } = req.body;

    if (!token || !nuevaContrasena) {
      return res.status(400).json({ message: 'Token y nueva contraseña son obligatorios' });
    }

    const passwordValidation = validatePassword(nuevaContrasena);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    const userResults = await User.findByResetToken(token);
    
    if (userResults.length === 0) {
      return res.status(400).json({ 
        message: 'Token inválido o expirado. Solicita un nuevo enlace.' 
      });
    }

    const user = userResults[0];
    const hash = await bcrypt.hash(nuevaContrasena, 12);
    await User.updatePassword(user.id, hash);

    res.json({ 
      message: 'Contraseña actualizada correctamente',
      info: 'Ya puedes iniciar sesión con tu nueva contraseña'
    });
  } catch (error) {
    console.error('Error en reset password:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};