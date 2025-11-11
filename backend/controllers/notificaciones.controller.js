// backend/controllers/notificaciones.controller.js
const db = require('../config/db');
const { Resend } = require('resend');

const resend = new Resend('re_jY6zXfLJ_9WVw69K2JbHERkRnZL13YkJu'); // Tu API key de Resend

class NotificacionesController {
  /**
   * Enviar notificación por email
   */
  async enviarEmail(req, res) {
    try {
      const userId = req.user.id;
      const { type, title, message } = req.body;

      // Obtener datos del usuario
      const [usuario] = await db.execute(
        'SELECT nombre, correo FROM usuarios WHERE id = ?',
        [userId]
      );

      if (usuario.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const { nombre, correo } = usuario[0];

      // Plantillas de email según tipo
      const templates = {
        logro: {
          subject: '🏆 ¡Nuevo Logro Desbloqueado!',
          html: this.getLogroTemplate(nombre, title, message)
        },
        modulo: {
          subject: '🎉 ¡Módulo Completado!',
          html: this.getModuloTemplate(nombre, title, message)
        },
        certificado: {
          subject: '🎓 ¡Certificado Disponible!',
          html: this.getCertificadoTemplate(nombre, message)
        },
        recordatorio: {
          subject: '📚 Recordatorio de Estudio',
          html: this.getRecordatorioTemplate(nombre, message)
        }
      };

      const template = templates[type] || {
        subject: title,
        html: this.getDefaultTemplate(nombre, title, message)
      };

      // Enviar email usando Resend
      await resend.emails.send({
        from: 'HydroSave <hydrosave05@gmail.com>',
        to: correo,
        subject: template.subject,
        html: template.html
      });

      console.log('✅ Email enviado correctamente a:', correo);
      res.json({ success: true, mensaje: 'Email enviado correctamente' });

    } catch (error) {
      console.error('Error al enviar email con Resend:', error);
      res.status(500).json({ error: 'Error al enviar email' });
    }
  }

  /**
   * Enviar notificación por SMS (simulado - integrar con Twilio)
   */
  async enviarSMS(req, res) {
    try {
      const userId = req.user.id;
      const { type, message } = req.body;

      // Obtener teléfono del usuario
      const [usuario] = await db.execute(
        'SELECT telefono FROM usuarios WHERE id = ?',
        [userId]
      );

      if (usuario.length === 0 || !usuario[0].telefono) {
        return res.status(404).json({ error: 'Teléfono no disponible' });
      }

      const telefono = usuario[0].telefono;

      // TODO: Integrar con Twilio o servicio SMS
      console.log(`📱 SMS a ${telefono}: ${message}`);

      // Por ahora solo simulamos el envío
      res.json({ 
        success: true, 
        mensaje: 'SMS enviado correctamente (simulado)',
        telefono
      });

    } catch (error) {
      console.error('Error al enviar SMS:', error);
      res.status(500).json({ error: 'Error al enviar SMS' });
    }
  }

  // ===================== PLANTILLAS =====================
  getLogroTemplate(nombre, titulo, mensaje) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f0f8ff; padding: 20px; }
            .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; color: #FFD700; margin-bottom: 20px; }
            .trophy { font-size: 60px; }
            .content { color: #333; line-height: 1.6; }
            .button { background: #FFD700; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="trophy">🏆</div>
              <h1>¡Nuevo Logro Desbloqueado!</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${nombre}</strong>,</p>
              <h2>${titulo}</h2>
              <p>${mensaje}</p>
              <a href="https://hydrosave-frontend.onrender.com/perfil" class="button">Ver mi perfil</a>
            </div>
            <div class="footer">
              <p>Este es un mensaje automático de HydroSave</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getModuloTemplate(nombre, titulo, mensaje) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f0f8ff; padding: 20px; }
            .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; color: #2ecc71; margin-bottom: 20px; }
            .icon { font-size: 60px; }
            .content { color: #333; line-height: 1.6; }
            .button { background: #2ecc71; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">🎉</div>
              <h1>¡Módulo Completado!</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${nombre}</strong>,</p>
              <h2>${titulo}</h2>
              <p>${mensaje}</p>
              <a href="https://hydrosave-frontend.onrender.com/modulos" class="button">Continuar aprendiendo</a>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getCertificadoTemplate(nombre, mensaje) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f0f8ff; padding: 20px; }
            .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; color: #9b59b6; margin-bottom: 20px; }
            .icon { font-size: 60px; }
            .content { color: #333; line-height: 1.6; }
            .button { background: #9b59b6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">🎓</div>
              <h1>¡Certificado Disponible!</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${nombre}</strong>,</p>
              <p>${mensaje}</p>
              <a href="https://hydrosave-frontend.onrender.com/perfil" class="button">Descargar certificado</a>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getRecordatorioTemplate(nombre, mensaje) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f0f8ff; padding: 20px; }
            .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; color: #3498db; margin-bottom: 20px; }
            .content { color: #333; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 Recordatorio de Estudio</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${nombre}</strong>,</p>
              <p>${mensaje}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getDefaultTemplate(nombre, titulo, mensaje) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f0f8ff; padding: 20px; }
            .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
            .content { color: #333; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${titulo}</h1>
            <div class="content">
              <p>Hola <strong>${nombre}</strong>,</p>
              <p>${mensaje}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

module.exports = new NotificacionesController();
