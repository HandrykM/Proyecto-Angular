// backend/controllers/preferencias.controller.js
const db = require('../config/db');
const nodemailer = require('nodemailer');
const transporter = require('../config/mailer');

class PreferenciasController {
  /**
   * Obtener preferencias del usuario
   */
  async obtenerPreferencias(req, res) {
    try {
      const userId = req.user.id;

      const [preferencias] = await db.execute(`
        SELECT 
          idioma,
          modo_oscuro as modoOscuro,
          tamano_fuente as tamanoFuente,
          notif_email,
          notif_sms,
          notif_push,
          notif_recordatorios,
          notif_logros
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
      res.status(500).json({
        success: false,
        mensaje: 'Error al obtener preferencias'
      });
    }
  }

  /**
   * Guardar preferencias del usuario
   */
  async guardarPreferencias(req, res) {
    try {
      const userId = req.user.id;
      const { idioma, modoOscuro, tamanoFuente, notificaciones } = req.body;

      const [existe] = await db.execute(`
        SELECT id FROM configuracion_usuario WHERE id_usuario = ?
      `, [userId]);

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
            idioma = ?,
            modo_oscuro = ?,
            tamano_fuente = ?,
            notif_email = ?,
            notif_sms = ?,
            notif_push = ?,
            notif_recordatorios = ?,
            notif_logros = ?,
            fecha_modificacion = NOW()
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

      res.json({
        success: true,
        mensaje: 'Preferencias guardadas correctamente'
      });

    } catch (error) {
      console.error('Error al guardar preferencias:', error);
      res.status(500).json({
        success: false,
        mensaje: 'Error al guardar preferencias'
      });
    }
  }

  /**
   * Crear configuración por defecto
   */
  async crearConfiguracionDefecto(userId) {
    await db.execute(`
      INSERT INTO configuracion_usuario (
        id_usuario, idioma, modo_oscuro, tamano_fuente,
        notif_email, notif_sms, notif_push, notif_recordatorios, notif_logros
      ) VALUES (?, 'es', 0, 'mediano', 1, 0, 1, 1, 1)
    `, [userId]);
  }

  /**
   * ✅ VERIFICAR SI TIENE NOTIFICACIONES ACTIVAS
   */
  async tieneNotificacionActiva(userId, tipo) {
    try {
      const [config] = await db.execute(`
        SELECT notif_email, notif_sms, notif_push, notif_recordatorios, notif_logros
        FROM configuracion_usuario
        WHERE id_usuario = ?
      `, [userId]);

      if (config.length === 0) {
        return false;
      }

      const notif = config[0];

      switch (tipo) {
        case 'email': return notif.notif_email === 1;
        case 'sms': return notif.notif_sms === 1;
        case 'push': return notif.notif_push === 1;
        case 'recordatorios': return notif.notif_recordatorios === 1;
        case 'logros': return notif.notif_logros === 1;
        default: return false;
      }
    } catch (error) {
      console.error('Error verificando notificación:', error);
      return false;
    }
  }

  /**
   * ✅ ENVIAR NOTIFICACIÓN POR EMAIL
   */
  async enviarNotificacionEmail(userId, asunto, mensaje) {
    try {
      // Verificar si tiene notificaciones email activadas
      const tieneEmail = await this.tieneNotificacionActiva(userId, 'email');
      if (!tieneEmail) {
        console.log(`❌ Usuario ${userId} tiene notificaciones email desactivadas`);
        return false;
      }

      // Obtener datos del usuario
      const [usuario] = await db.execute(`
        SELECT correo, nombre FROM usuarios WHERE id = ?
      `, [userId]);

      if (usuario.length === 0) {
        console.error('Usuario no encontrado');
        return false;
      }

      const mailOptions = {
        from: `"HydroSave" <${process.env.EMAIL_USER}>`,
        to: usuario[0].correo,
        subject: asunto,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  background: #f0f8ff; 
                  padding: 20px; 
                }
                .container { 
                  background: white; 
                  padding: 30px; 
                  border-radius: 10px; 
                  max-width: 600px; 
                  margin: 0 auto; 
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header { 
                  text-align: center; 
                  color: #00a8e8; 
                  margin-bottom: 20px; 
                }
                .content { 
                  color: #333; 
                  line-height: 1.6; 
                }
                .footer { 
                  text-align: center; 
                  margin-top: 30px; 
                  color: #999; 
                  font-size: 12px; 
                }
                .button { 
                  background: #00a8e8; 
                  color: white; 
                  padding: 12px 30px; 
                  text-decoration: none; 
                  border-radius: 5px; 
                  display: inline-block; 
                  margin-top: 20px; 
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>💧 HydroSave</h1>
                </div>
                <div class="content">
                  <p>Hola ${usuario[0].nombre},</p>
                  ${mensaje}
                  <a href="http://localhost:4200/perfil" class="button">Ver mi perfil</a>
                </div>
                <div class="footer">
                  <p>Este es un mensaje automático de HydroSave</p>
                  <p>Si no deseas recibir notificaciones, puedes desactivarlas en tu perfil</p>
                </div>
              </div>
            </body>
          </html>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Email enviado correctamente a:', usuario[0].correo);
      return true;

    } catch (error) {
      console.error('❌ Error al enviar email:', error);
      return false;
    }
  }

  /**
   * ✅ ENVIAR NOTIFICACIÓN POR SMS (Twilio)
   */
  async enviarNotificacionSMS(userId, mensaje) {
    try {
      // Verificar si tiene notificaciones SMS activadas
      const tieneSMS = await this.tieneNotificacionActiva(userId, 'sms');
      if (!tieneSMS) {
        console.log(`❌ Usuario ${userId} tiene notificaciones SMS desactivadas`);
        return false;
      }

      const [usuario] = await db.execute(`
        SELECT telefono, nombre FROM usuarios WHERE id = ?
      `, [userId]);

      if (usuario.length === 0 || !usuario[0].telefono) {
        console.log('❌ Usuario sin teléfono registrado');
        return false;
      }

      // TODO: Integrar Twilio aquí
      console.log(`📱 SMS a ${usuario[0].telefono}: ${mensaje}`);
      
      /* EJEMPLO CON TWILIO:
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const client = require('twilio')(accountSid, authToken);

      await client.messages.create({
        body: mensaje,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: usuario[0].telefono
      });
      */

      return true;
    } catch (error) {
      console.error('❌ Error al enviar SMS:', error);
      return false;
    }
  }

  /**
   * ✅ NOTIFICAR MÓDULO COMPLETADO
   */
  async notificarModuloCompletado(userId, modulo) {
    try {
      const tieneEmail = await this.tieneNotificacionActiva(userId, 'email');
      const tienePush = await this.tieneNotificacionActiva(userId, 'push');

      if (tieneEmail) {
        const asunto = '🎉 ¡Módulo Completado!';
        const mensaje = `
          <h2>¡Felicidades! Has completado un módulo</h2>
          <h3>${modulo.titulo}</h3>
          <p>${modulo.descripcion}</p>
          <p><strong>Puntos obtenidos:</strong> +${modulo.puntos}</p>
        `;
        await this.enviarNotificacionEmail(userId, asunto, mensaje);
      }

      if (tienePush) {
        // Aquí se enviaría la notificación push al frontend
        console.log('🔔 Push notification: Módulo completado');
      }

      return true;
    } catch (error) {
      console.error('Error notificando módulo completado:', error);
      return false;
    }
  }

  /**
   * ✅ NOTIFICAR LOGRO OBTENIDO
   */
  async notificarLogro(userId, logro) {
    try {
      const tieneEmail = await this.tieneNotificacionActiva(userId, 'email');
      const tieneLogros = await this.tieneNotificacionActiva(userId, 'logros');
      const tienePush = await this.tieneNotificacionActiva(userId, 'push');

      if (tieneEmail && tieneLogros) {
        const asunto = '🏆 ¡Nuevo Logro Desbloqueado!';
        const mensaje = `
          <h2>¡Felicidades! Has desbloqueado un nuevo logro</h2>
          <h3>${logro.titulo}</h3>
          <p>${logro.descripcion}</p>
          <p><strong>Puntos obtenidos:</strong> +${logro.puntosRecompensa}</p>
        `;
        await this.enviarNotificacionEmail(userId, asunto, mensaje);
      }

      if (tienePush && tieneLogros) {
        console.log('🔔 Push notification: Logro obtenido');
      }

      return true;
    } catch (error) {
      console.error('Error notificando logro:', error);
      return false;
    }
  }

  /**
   * ✅ ENVIAR RECORDATORIO DE ESTUDIO
   */
  async enviarRecordatorioEstudio(userId) {
    try {
      const tieneEmail = await this.tieneNotificacionActiva(userId, 'email');
      const tieneRecordatorios = await this.tieneNotificacionActiva(userId, 'recordatorios');
      const tieneSMS = await this.tieneNotificacionActiva(userId, 'sms');

      if (tieneEmail && tieneRecordatorios) {
        const asunto = '📚 Recordatorio de Estudio - HydroSave';
        const mensaje = `
          <h2>¡No olvides continuar con tu aprendizaje!</h2>
          <p>Hace tiempo que no te vemos por la plataforma.</p>
          <p>Continúa tu progreso y sigue aprendiendo sobre la reutilización del agua.</p>
        `;
        await this.enviarNotificacionEmail(userId, asunto, mensaje);
      }

      if (tieneSMS && tieneRecordatorios) {
        const mensajeSMS = '📚 HydroSave: ¡Continúa tu aprendizaje! Hace tiempo que no te vemos.';
        await this.enviarNotificacionSMS(userId, mensajeSMS);
      }

      return true;
    } catch (error) {
      console.error('Error enviando recordatorio:', error);
      return false;
    }
  }

  /**
   * ✅ NOTIFICAR CERTIFICADO DISPONIBLE
   */
  async notificarCertificadoDisponible(userId) {
    try {
      const tieneEmail = await this.tieneNotificacionActiva(userId, 'email');
      const tienePush = await this.tieneNotificacionActiva(userId, 'push');

      if (tieneEmail) {
        const asunto = '🎓 ¡Certificado Disponible!';
        const mensaje = `
          <h2>¡Felicitaciones! Has completado todos los módulos</h2>
          <p>Tu certificado de finalización ya está disponible para descargar.</p>
          <p>Accede a tu perfil para generarlo y descargarlo.</p>
        `;
        await this.enviarNotificacionEmail(userId, asunto, mensaje);
      }

      if (tienePush) {
        console.log('🔔 Push notification: Certificado disponible');
      }

      return true;
    } catch (error) {
      console.error('Error notificando certificado:', error);
      return false;
    }
  }
}

module.exports = new PreferenciasController();