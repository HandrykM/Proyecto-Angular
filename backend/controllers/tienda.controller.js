// backend/controllers/tienda.controller.js
const db = require('../config/db');

class TiendaController {
  
  // ===== OBTENER PRODUCTOS =====
  async obtenerProductos(req, res) {
    try {
      const userId = req.user.id;
      const { categoria, tipo, destacado } = req.query;
      
      let query = `
        SELECT 
          p.*,
          c.nombre as categoria_nombre,
          c.icono as categoria_icono,
          c.color as categoria_color,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM compras_tienda ct 
              WHERE ct.producto_id = p.id 
                AND ct.usuario_id = ? 
                AND ct.activo = 1
            ) THEN 1 
            ELSE 0 
          END as ya_comprado
        FROM productos_tienda p
        INNER JOIN categorias_tienda c ON p.categoria_id = c.id
        WHERE p.activo = 1 AND c.activa = 1
      `;
      
      const params = [userId];
      
      if (categoria) {
        query += ` AND p.categoria_id = ?`;
        params.push(categoria);
      }
      
      if (tipo) {
        query += ` AND p.tipo = ?`;
        params.push(tipo);
      }
      
      if (destacado) {
        query += ` AND p.destacado = 1`;
      }
      
      query += ` ORDER BY p.orden ASC, p.fecha_creacion DESC`;
      
      const [productos] = await db.execute(query, params);
      
      res.json({
        success: true,
        data: productos
      });
      
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
  }
  
  // ===== OBTENER CATEGORÍAS =====
  async obtenerCategorias(req, res) {
    try {
      const [categorias] = await db.execute(`
        SELECT c.*, COUNT(p.id) as total_productos
        FROM categorias_tienda c
        LEFT JOIN productos_tienda p ON c.id = p.categoria_id AND p.activo = 1
        WHERE c.activa = 1
        GROUP BY c.id
        ORDER BY c.orden ASC
      `);
      
      res.json({
        success: true,
        data: categorias
      });
      
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
  }
  
  // ===== OBTENER PUNTOS DEL USUARIO =====
  async obtenerPuntosUsuario(req, res) {
    try {
      const userId = req.user.id;
      
      // Puntos ganados
      const [puntosGanados] = await db.execute(`
        SELECT COALESCE(SUM(CAST(puntos_obtenidos AS UNSIGNED)), 0) as total
        FROM actividad_usuario
        WHERE id_usuario = ? AND puntos_obtenidos > 0
      `, [userId]);
      
      // Puntos gastados
      const [puntosGastados] = await db.execute(`
        SELECT COALESCE(SUM(precio_pagado), 0) as total
        FROM compras_tienda
        WHERE usuario_id = ?
      `, [userId]);
      
      const disponible = puntosGanados[0].total - puntosGastados[0].total;
      
      res.json({
        success: true,
        puntos: {
          ganados: puntosGanados[0].total,
          gastados: puntosGastados[0].total,
          disponible: disponible
        }
      });
      
    } catch (error) {
      console.error('Error obteniendo puntos:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
  }
  
  // ===== REALIZAR COMPRA =====
  async realizarCompra(req, res) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const userId = req.user.id;
      const { productoId } = req.body;
      
      if (!productoId) {
        await connection.rollback();
        return res.status(400).json({ mensaje: 'productoId es requerido' });
      }
      
      // Verificar producto
      const [producto] = await connection.execute(`
        SELECT * FROM productos_tienda WHERE id = ? AND activo = 1
      `, [productoId]);
      
      if (producto.length === 0) {
        await connection.rollback();
        return res.status(404).json({ mensaje: 'Producto no encontrado' });
      }
      
      const prod = producto[0];
      
      // Verificar puntos del usuario
      const [puntosGanados] = await connection.execute(`
        SELECT COALESCE(SUM(CAST(puntos_obtenidos AS UNSIGNED)), 0) as total
        FROM actividad_usuario
        WHERE id_usuario = ? AND puntos_obtenidos > 0
      `, [userId]);
      
      const [puntosGastados] = await connection.execute(`
        SELECT COALESCE(SUM(precio_pagado), 0) as total
        FROM compras_tienda
        WHERE usuario_id = ?
      `, [userId]);
      
      const disponible = puntosGanados[0].total - puntosGastados[0].total;
      
      if (disponible < prod.precio_puntos) {
        await connection.rollback();
        return res.status(400).json({ 
          mensaje: 'Puntos insuficientes',
          disponible,
          requerido: prod.precio_puntos
        });
      }
      
      // Verificar si ya compró
      const [yaComprado] = await connection.execute(`
        SELECT id FROM compras_tienda 
        WHERE usuario_id = ? AND producto_id = ? AND activo = 1
      `, [userId, productoId]);
      
      if (yaComprado.length > 0) {
        await connection.rollback();
        return res.status(400).json({ mensaje: 'Ya compraste este producto' });
      }
      
      // Verificar stock
      if (prod.stock !== null && prod.stock <= 0) {
        await connection.rollback();
        return res.status(400).json({ mensaje: 'Producto sin stock' });
      }
      
      // Registrar compra
      await connection.execute(`
        INSERT INTO compras_tienda (usuario_id, producto_id, precio_pagado)
        VALUES (?, ?, ?)
      `, [userId, productoId, prod.precio_puntos]);
      
      // Reducir stock si aplica
      if (prod.stock !== null) {
        await connection.execute(`
          UPDATE productos_tienda SET stock = stock - 1 WHERE id = ?
        `, [productoId]);
      }
      
      // Registrar en historial
      await connection.execute(`
        INSERT INTO historial_puntos (
          usuario_id, tipo, cantidad, concepto, 
          referencia_tipo, referencia_id, 
          saldo_anterior, saldo_nuevo, fecha
        ) VALUES (?, 'gastado', ?, ?, 'compra', ?, ?, ?, NOW())
      `, [
        userId, 
        prod.precio_puntos, 
        `Compra: ${prod.nombre}`,
        productoId,
        disponible,
        disponible - prod.precio_puntos
      ]);
      
      await connection.commit();
      
      res.json({
        success: true,
        mensaje: 'Compra realizada exitosamente',
        producto: prod,
        puntos_restantes: disponible - prod.precio_puntos
      });
      
    } catch (error) {
      await connection.rollback();
      console.error('Error en compra:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor' });
    } finally {
      connection.release();
    }
  }
  
  // ===== OBTENER COMPRAS DEL USUARIO =====
  async obtenerComprasUsuario(req, res) {
    try {
      const userId = req.user.id;
      
      const [compras] = await db.execute(`
        SELECT 
          ct.*,
          p.nombre,
          p.descripcion,
          p.tipo,
          p.imagen_url,
          p.archivo_url,
          p.datos_extra
        FROM compras_tienda ct
        INNER JOIN productos_tienda p ON ct.producto_id = p.id
        WHERE ct.usuario_id = ? AND ct.activo = 1
        ORDER BY ct.fecha_compra DESC
      `, [userId]);
      
      res.json({
        success: true,
        data: compras
      });
      
    } catch (error) {
      console.error('Error obteniendo compras:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
  }
  
  // ===== VERIFICAR DESBLOQUEO =====
  async verificarDesbloqueo(req, res) {
    try {
      const userId = req.user.id;
      const { tipo, contenidoId } = req.query;
      
      if (!tipo || !contenidoId) {
        return res.status(400).json({ mensaje: 'tipo y contenidoId son requeridos' });
      }
      
      // Obtener requisitos
      const [requisitos] = await db.execute(`
        SELECT * FROM requisitos_desbloqueo
        WHERE tipo_contenido = ? AND contenido_id = ? AND activo = 1
      `, [tipo, contenidoId]);
      
      if (requisitos.length === 0) {
        return res.json({
          success: true,
          desbloqueado: true,
          mensaje: 'No hay requisitos'
        });
      }
      
      const req_data = requisitos[0];
      
      // Verificar puntos
      const [puntos] = await db.execute(`
        SELECT COALESCE(SUM(CAST(puntos_obtenidos AS UNSIGNED)), 0) as total
        FROM actividad_usuario
        WHERE id_usuario = ? AND puntos_obtenidos > 0
      `, [userId]);
      
      const puntosActuales = puntos[0].total;
      
      if (puntosActuales < req_data.puntos_requeridos) {
        return res.json({
          success: true,
          desbloqueado: false,
          mensaje: `Necesitas ${req_data.puntos_requeridos} puntos (tienes ${puntosActuales})`
        });
      }
      
      res.json({
        success: true,
        desbloqueado: true,
        mensaje: 'Contenido desbloqueado'
      });
      
    } catch (error) {
      console.error('Error verificando desbloqueo:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
  }
}

module.exports = new TiendaController();