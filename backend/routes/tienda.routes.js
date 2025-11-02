// backend/routes/tienda.routes.js
const express = require('express');
const router = express.Router();
const tiendaController = require('../controllers/tienda.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(verifyToken);

// Productos
router.get('/productos', tiendaController.obtenerProductos.bind(tiendaController));
router.get('/categorias', tiendaController.obtenerCategorias.bind(tiendaController));

// Puntos
router.get('/puntos', tiendaController.obtenerPuntosUsuario.bind(tiendaController));

// Compras
router.post('/comprar', tiendaController.realizarCompra.bind(tiendaController));
router.get('/mis-compras', tiendaController.obtenerComprasUsuario.bind(tiendaController));

// Desbloqueo
router.get('/verificar-desbloqueo', tiendaController.verificarDesbloqueo.bind(tiendaController));

module.exports = router;