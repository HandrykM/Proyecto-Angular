// backend/routes/biblioteca.routes.nuevo.js
const express = require('express');
const router = express.Router();
const bibliotecaCtrl = require('../controllers/biblioteca.controller');

// === CRUD de biblioteca === //
router.get('/', bibliotecaCtrl.getRecursos);                    // Obtener todos
router.get('/:id', bibliotecaCtrl.getRecurso);                  // Obtener uno
router.post('/', bibliotecaCtrl.createRecurso);                 // Crear
router.put('/:id', bibliotecaCtrl.updateRecurso);               // Actualizar
router.delete('/:id', bibliotecaCtrl.deleteRecurso);            // Eliminar

// === Registro de lecturas === //
router.post('/:id/lectura', bibliotecaCtrl.registrarLectura);   // Registrar lectura
router.get('/:id/verificar-lectura', bibliotecaCtrl.verificarLectura); // Verificar si se leyó

module.exports = router;