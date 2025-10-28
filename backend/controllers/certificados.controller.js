// backend/controllers/certificados.controller.js
const db = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CertificadosController {
  /**
   * Verificar si el usuario puede obtener certificado
   */
  async verificarElegibilidad(req, res) {
  try {
    const userId = req.user.id;

    // ✅ Contar módulos activos
    const [modulosTotal] = await db.execute(`
      SELECT COUNT(*) as total FROM modulos WHERE activo = 1
    `);

    // ✅ CORRECCIÓN: Contar módulos completados al 100%
    const [modulosCompletados] = await db.execute(`
      SELECT COUNT(DISTINCT modulo_data.modulo_id) as completados
      FROM (
        SELECT 
          l.modulo_id,
          COUNT(l.id) as total_lecturas,
          SUM(CASE WHEN pl.completada = 1 THEN 1 ELSE 0 END) as lecturas_completadas,
          ROUND((SUM(CASE WHEN pl.completada = 1 THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(l.id), 0), 0) as progreso
        FROM lecturas l
        INNER JOIN modulos m ON l.modulo_id = m.id
        LEFT JOIN progreso_lecturas pl ON l.id = pl.lectura_id AND pl.usuario_id = ?
        WHERE l.activa = 1 AND m.activo = 1
        GROUP BY l.modulo_id
        HAVING progreso >= 100
      ) as modulo_data
    `, [userId]);

    const total = modulosTotal[0].total;
    const completados = modulosCompletados[0].completados;
    const elegible = completados >= total;
    const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

    res.json({
      success: true,
      elegible: elegible,
      modulosCompletados: completados,
      modulosTotal: total,
      porcentaje: porcentaje
    });

  } catch (error) {
    console.error('Error al verificar elegibilidad:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al verificar elegibilidad'
    });
  }
}

  /**
   * Generar certificado PDF
   */
  async generarCertificado(req, res) {
  try {
    const userId = req.user.id;

    // ✅ PASO 1: Verificar elegibilidad primero
    const [modulosTotal] = await db.execute(`
      SELECT COUNT(*) as total FROM modulos WHERE activo = 1
    `);

    const [modulosCompletados] = await db.execute(`
      SELECT COUNT(DISTINCT modulo_data.modulo_id) as completados
      FROM (
        SELECT 
          l.modulo_id,
          COUNT(l.id) as total_lecturas,
          SUM(CASE WHEN pl.completada = 1 THEN 1 ELSE 0 END) as lecturas_completadas,
          ROUND((SUM(CASE WHEN pl.completada = 1 THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(l.id), 0), 0) as progreso
        FROM lecturas l
        INNER JOIN modulos m ON l.modulo_id = m.id
        LEFT JOIN progreso_lecturas pl ON l.id = pl.lectura_id AND pl.usuario_id = ?
        WHERE l.activa = 1 AND m.activo = 1
        GROUP BY l.modulo_id
        HAVING progreso >= 100
      ) as modulo_data
    `, [userId]);

    const total = modulosTotal[0].total;
    const completados = modulosCompletados[0].completados;

    console.log(`📊 Usuario ${userId} - Módulos: ${completados}/${total}`);

    // ✅ PASO 2: Validar elegibilidad estricta
    if (completados < total) {
      return res.status(403).json({
        success: false,
        mensaje: `Debes completar todos los módulos. Progreso: ${completados}/${total}`,
        modulosCompletados: completados,
        modulosTotal: total
      });
    }

    // ✅ PASO 3: Obtener información del usuario
    const [usuario] = await db.execute(`
      SELECT 
        COALESCE(nombre_usuario, nombre) as nombre_completo,
        correo,
        fecha_registro
      FROM usuarios
      WHERE id = ?
    `, [userId]);

    if (usuario.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    // ✅ PASO 4: Verificar si ya existe certificado
    const [certificadoExistente] = await db.execute(`
      SELECT id, url_certificado, codigo_verificacion 
      FROM certificados
      WHERE id_usuario = ? AND modulo = 'Programa Completo'
    `, [userId]);

    let certificadoUrl;
    let codigoVerificacion;

    if (certificadoExistente.length > 0) {
      // Certificado ya existe - devolver existente
      certificadoUrl = certificadoExistente[0].url_certificado;
      codigoVerificacion = certificadoExistente[0].codigo_verificacion;
      
      return res.json({
        success: true,
        mensaje: 'Certificado ya existe',
        certificado: {
          url: certificadoUrl,
          codigoVerificacion: codigoVerificacion,
          fechaEmision: new Date().toISOString()
        }
      });
    }

    // ✅ PASO 5: Obtener módulos completados para el certificado
    const [modulos] = await db.execute(`
      SELECT 
        m.titulo,
        m.nivel
      FROM modulos m
      INNER JOIN (
        SELECT 
          l.modulo_id,
          COUNT(l.id) as total_lecturas,
          SUM(CASE WHEN pl.completada = 1 THEN 1 ELSE 0 END) as lecturas_completadas,
          ROUND((SUM(CASE WHEN pl.completada = 1 THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(l.id), 0), 0) as progreso
        FROM lecturas l
        LEFT JOIN progreso_lecturas pl ON l.id = pl.lectura_id AND pl.usuario_id = ?
        WHERE l.activa = 1
        GROUP BY l.modulo_id
        HAVING progreso >= 100
      ) prog ON m.id = prog.modulo_id
      WHERE m.activo = 1
      ORDER BY m.orden ASC
    `, [userId]);

    // ✅ PASO 6: Generar código de verificación
    codigoVerificacion = require('crypto').randomBytes(16).toString('hex');

    // ✅ PASO 7: Crear directorio de certificados
    const uploadDir = path.join(__dirname, '..', 'uploads', 'certificados');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `certificado_${userId}_${Date.now()}.pdf`;
    const certificadoPath = path.join(uploadDir, fileName);

    // ✅ PASO 8: Generar PDF
    await this.crearPDFCertificado(
      certificadoPath,
      usuario[0].nombre_completo,
      modulos,
      codigoVerificacion
    );

    certificadoUrl = `${req.protocol}://${req.get('host')}/uploads/certificados/${fileName}`;

    // ✅ PASO 9: Guardar en base de datos
    await db.execute(`
      INSERT INTO certificados (
        id_usuario, 
        titulo, 
        descripcion, 
        modulo, 
        fecha_emision, 
        url_certificado, 
        codigo_verificacion, 
        verificado
      ) VALUES (?, ?, ?, ?, NOW(), ?, ?, 1)
    `, [
      userId,
      'Certificado de Finalización - Programa de Reutilización de Agua',
      'Certificado por completar todos los módulos del programa',
      'Programa Completo',
      certificadoUrl,
      codigoVerificacion
    ]);

    console.log('✅ Certificado generado exitosamente para usuario', userId);

    res.json({
      success: true,
      mensaje: 'Certificado generado exitosamente',
      certificado: {
        url: certificadoUrl,
        codigoVerificacion: codigoVerificacion,
        fechaEmision: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error al generar certificado:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al generar certificado',
      error: error.message
    });
  }
}

  /**
   * Crear PDF del certificado
   */
  async crearPDFCertificado(rutaArchivo, nombreCompleto, modulos, codigoVerificacion) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margin: 50
        });

        const stream = fs.createWriteStream(rutaArchivo);
        doc.pipe(stream);

        const azulPrimario = '#00a8e8';
        const azulOscuro = '#0077b6';

        doc.rect(0, 0, 842, 595).fill('#f0f8ff');

        doc.strokeColor(azulPrimario)
           .lineWidth(10)
           .rect(30, 30, 782, 535)
           .stroke();

        doc.strokeColor(azulOscuro)
           .lineWidth(3)
           .rect(40, 40, 762, 515)
           .stroke();

        doc.fillColor(azulPrimario)
           .fontSize(40)
           .font('Helvetica-Bold')
           .text(' HydroSave', 70, 70);

        doc.fillColor(azulOscuro)
           .fontSize(48)
           .font('Helvetica-Bold')
           .text('CERTIFICADO DE FINALIZACIÓN', 0, 140, {
             align: 'center',
             width: 842
           });

        doc.moveTo(250, 200)
           .lineTo(592, 200)
           .strokeColor(azulPrimario)
           .lineWidth(2)
           .stroke();

        doc.fillColor('#555')
           .fontSize(20)
           .font('Helvetica')
           .text('Se otorga a', 0, 220, {
             align: 'center',
             width: 842
           });

        doc.fillColor(azulPrimario)
           .fontSize(36)
           .font('Helvetica-Bold')
           .text(nombreCompleto.toUpperCase(), 0, 250, {
             align: 'center',
             width: 842
           });

        doc.fillColor('#666')
           .fontSize(16)
           .font('Helvetica')
           .text('Por haber completado exitosamente el programa completo de', 0, 300, {
             align: 'center',
             width: 842
           });

        doc.fontSize(20)
           .font('Helvetica-Bold')
           .fillColor(azulOscuro)
           .text('REUTILIZACIÓN Y CONSERVACIÓN DEL AGUA', 0, 325, {
             align: 'center',
             width: 842
           });

        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#333')
           .text('Módulos completados:', 100, 370);

        let yPos = 390;
        const columna1X = 120;
        const columna2X = 450;
        let columna = 1;

        modulos.forEach((modulo) => {
          const x = columna === 1 ? columna1X : columna2X;
          
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor('#666')
             .text(`✓ ${modulo.titulo}`, x, yPos, { width: 300 });
          
          if (columna === 1) {
            columna = 2;
          } else {
            columna = 1;
            yPos += 18;
          }
        });

        const fechaEmision = new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });

        doc.fontSize(13)
           .fillColor('#333')
           .font('Helvetica')
           .text(`Fecha de emisión: ${fechaEmision}`, 0, 500, {
             align: 'center',
             width: 842
           });

        doc.fontSize(9)
           .fillColor('#999')
           .text(`Código de verificación: ${codigoVerificacion}`, 0, 525, {
             align: 'center',
             width: 842
           });

        doc.fontSize(11)
           .fillColor('#666')
           .text('______________HydroSave________________', 306, 460)
           .text('Dirección Académica HydroSave', 306, 480);

        doc.end();

        stream.on('finish', () => resolve());
        stream.on('error', (error) => reject(error));

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Obtener certificados del usuario
   */
  async obtenerCertificadosUsuario(req, res) {
    try {
      const userId = req.user.id;

      const [certificados] = await db.execute(`
        SELECT 
          id,
          titulo,
          descripcion,
          modulo,
          fecha_emision,
          url_certificado,
          codigo_verificacion,
          verificado
        FROM certificados
        WHERE id_usuario = ?
        ORDER BY fecha_emision DESC
      `, [userId]);

      res.json({
        success: true,
        data: certificados
      });

    } catch (error) {
      console.error('Error al obtener certificados:', error);
      res.status(500).json({
        success: false,
        mensaje: 'Error al obtener certificados'
      });
    }
  }
}

module.exports = new CertificadosController();