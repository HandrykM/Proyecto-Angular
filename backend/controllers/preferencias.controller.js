// backend/controllers/preferencias.controller.js
const db = require('../config/db');
const { Resend } = require('resend');

const resend = new Resend('re_jY6zXfLJ_9WVw69K2JbHERkRnZL13YkJu');

class PreferenciasController {
  // ===================== PREFERENCIAS =====================
  async obtenerPreferencias(req, res) {
    try {
      const userId = req.user.id;
      const [preferencias] = await db.execute(`
        SELECT idioma, modo_oscuro as modoOscuro, tamano_fuente as tamanoFuente,
               notif_email, notif_sms, notif_push, notif_recordatorios, notif_logros
        FROM configuracion_usuario
        WHERE id_usuario = ?
      `, [userId]);

      if (preferencias.length === 0) {
        await this.crearConfiguracionDefecto(userId);
        return this.obtenerPreferencias(req, res);
      }

      const config = preferencias[0];
      res.json({
        idioma: config.idioma || 'es',
        modoOscuro: config.modoOscuro === 1,
        tamanoFuente: config.tamanoFuente || 'mediano',
        notificaciones: {
          email: config.notif_email === 1,
          sms: config.notif_sms === 1,
          push: config.notif_push === 1,
          recordatorios: config.notif_recordatorios === 1,
          logros: config.notif_logros === 1
        }
      });

    } catch (error) {
      console.error('Error al obtener preferencias:', error);
      res.status(500).json({ success: false, mensaje: 'Error al obtener preferencias' });
    }
  }

  async guardarPreferencias(req, res) {
    try {
      const userId = req.user.id;
      const { idioma, modoOscuro, tamanoFuente, notificaciones } = req.body;

      const [existe] = await db.execute(`SELECT id FROM configuracion_usuario WHERE id_usuario = ?`, [userId]);

      if (existe.length === 0) {
        await db.execute(`
          INSERT INTO configuracion_usuario (
            id_usuario, idioma, modo_oscuro, tamano_fuente,
            notif_email, notif_sms, notif_push, notif_recordatorios, notif_logros
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId,
          idioma || 'es',
          modoOscuro ? 1 : 0,
          tamanoFuente || 'mediano',
          notificaciones?.email ? 1 : 0,
          notificaciones?.sms ? 1 : 0,
          notificaciones?.push ? 1 : 0,
          notificaciones?.recordatorios ? 1 : 0,
          notificaciones?.logros ? 1 : 0
        ]);
      } else {
        await db.execute(`
          UPDATE configuracion_usuario SET
            idioma = ?, modo_oscuro = ?, tamano_fuente = ?,
            notif_email = ?, notif_sms = ?, notif_push = ?,
            notif_recordatorios = ?, notif_logros = ?, fecha_modificacion = NOW()
          WHERE id_usuario = ?
        `, [
          idioma || 'es',
          modoOscuro ? 1 : 0,
          tamanoFuente || 'mediano',
          notificaciones?.email ? 1 : 0,
          notificaciones?.sms ? 1 : 0,
          notificaciones?.push ? 1 : 0,
          notificaciones?.recordatorios ? 1 : 0,
          notificaciones?.logros ? 1 : 0,
          userId
        ]);
      }

      res.json({ success: true, mensaje: 'Preferencias guardadas correctamente' });

    } catch (error) {
      console.error('Error al guardar preferencias:', error);
      res.status(500).json({ success: false, mensaje: 'Error al guardar preferencias' });
    }
  }

  async crearConfiguracionDefecto(userId) {
    await db.execute(`
      INSERT INTO configuracion_usuario (
        id_usuario, idioma, modo_oscuro, tamano_fuente,
        notif_email, notif_sms, notif_push, notif_recordatorios, notif_logros
      ) VALUES (?, 'es', 0, 'mediano', 1, 0, 1, 1, 1)
    `, [userId]);
  }

  // ===================== EMAIL CON RESEND =====================
  async enviarNotificacionEmail(userId, asunto, mensaje) {
    try {
      const [config] = await db.execute(`
        SELECT notif_email FROM configuracion_usuario WHERE id_usuario = ?
      `, [userId]);

      if (config.length === 0 || config[0].notif_email !== 1) return;

      const [usuario] = await db.execute(`SELECT correo, nombre FROM usuarios WHERE id = ?`, [userId]);
      if (usuario.length === 0) return;

      await resend.emails.send({
        from: 'HydroSave <hydrosave05@gmail.com>',
        to: usuario[0].correo,
        subject: asunto,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; background: #f0f8ff; padding: 20px; }
                .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
                .header { text-align: center; color: #00a8e8; margin-bottom: 20px; }
                .content { color: #333; line-height: 1.6; }
                .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
                .button { background: #00a8e8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header"><h1>HydroSave</h1></div>
                <div class="content">
                  <p>Hola ${usuario[0].nombre},</p>
                  <p>${mensaje}</p>
                  <a href="https://hydrosave-frontend.onrender.com/perfil" class="button">Ver mi perfil</a>
                </div>
                <div class="footer">
                  <p>Este es un mensaje automático de HydroSave</p>
                  <p>Si no deseas recibir notificaciones, puedes desactivarlas en tu perfil</p>
                </div>
              </div>
            </body>
          </html>
        `
      });

      console.log('Email enviado correctamente a:', usuario[0].correo);

    } catch (error) {
      console.error('Error al enviar email con Resend:', error);
    }
  }

  // ===================== LOGROS =====================
  async notificarLogro(userId, logro) {
    try {
      const [config] = await db.execute(`
        SELECT notif_email, notif_logros FROM configuracion_usuario WHERE id_usuario = ?
      `, [userId]);

      if (config.length > 0 && config[0].notif_email === 1 && config[0].notif_logros === 1) {
        const asunto = '🏆 ¡Nuevo Logro Desbloqueado!';
        const mensaje = `
          <h2>¡Felicidades! Has desbloqueado un nuevo logro</h2>
          <h3>${logro.titulo}</h3>
          <p>${logro.descripcion}</p>
          <p><strong>Puntos obtenidos:</strong> +${logro.puntosRecompensa}</p>
        `;
        await this.enviarNotificacionEmail(userId, asunto, mensaje);
      }
    } catch (error) {
      console.error('Error al notificar logro:', error);
    }
  }

  // ===================== RECORDATORIOS =====================
  async enviarRecordatorioEstudio(userId) {
    try {
      const [config] = await db.execute(`
        SELECT notif_email, notif_recordatorios FROM configuracion_usuario WHERE id_usuario = ?
      `, [userId]);

      if (config.length > 0 && config[0].notif_email === 1 && config[0].notif_recordatorios === 1) {
        const asunto = '📚 Recordatorio de Estudio - HydroSave';
        const mensaje = `
          <h2>¡No olvides continuar con tu aprendizaje!</h2>
          <p>Hace tiempo que no te vemos por la plataforma.</p>
          <p>Continúa tu progreso y sigue aprendiendo sobre la reutilización del agua.</p>
        `;
        await this.enviarNotificacionEmail(userId, asunto, mensaje);
      }
    } catch (error) {
      console.error('Error al enviar recordatorio:', error);
    }
  }

  // ===================== CERTIFICADOS =====================
  async notificarCertificadoDisponible(userId) {
    try {
      const [config] = await db.execute(`
        SELECT notif_email FROM configuracion_usuario WHERE id_usuario = ?
      `, [userId]);

      if (config.length > 0 && config[0].notif_email === 1) {
        const asunto = '🎓 ¡Certificado Disponible!';
        const mensaje = `
          <h2>¡Felicitaciones! Has completado todos los módulos</h2>
          <p>Tu certificado de finalización ya está disponible para descargar.</p>
          <p>Accede a tu perfil para generarlo y descargarlo.</p>
        `;
        await this.enviarNotificacionEmail(userId, asunto, mensaje);
      }
    } catch (error) {
      console.error('Error al notificar certificado:', error);
    }
  }

  // ===================== SMS (por ahora logging) =====================
  async enviarNotificacionSMS(userId, mensaje) {
    try {
      const [config] = await db.execute(`SELECT notif_sms FROM configuracion_usuario WHERE id_usuario = ?`, [userId]);
      if (config.length === 0 || config[0].notif_sms !== 1) return;

      const [usuario] = await db.execute(`SELECT telefono, nombre FROM usuarios WHERE id = ?`, [userId]);
      if (usuario.length === 0 || !usuario[0].telefono) return;

      console.log(`SMS a ${usuario[0].telefono}: ${mensaje}`);
    } catch (error) {
      console.error('Error al enviar SMS:', error);
    }
  }
}

module.exports = new PreferenciasController();
