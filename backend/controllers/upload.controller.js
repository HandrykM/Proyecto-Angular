// backend/controllers/upload.controller.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de almacenamiento para materiales
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/materiales';
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Filtro de archivos permitidos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/mpeg',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten PDF, imágenes, videos y presentaciones.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Middleware para subir archivo de material
exports.uploadMaterial = upload.single('archivo');

// Middleware para subir thumbnail
exports.uploadThumbnail = upload.single('thumbnail');

// Controlador para manejar la subida
exports.subirArchivoMaterial = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'No se proporcionó ningún archivo' 
      });
    }

    const fileUrl = `http://localhost:3000/uploads/materiales/${req.file.filename}`;
    
    res.json({
      success: true,
      mensaje: 'Archivo subido exitosamente',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        path: req.file.path
      }
    });
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al subir el archivo' 
    });
  }
};

// Eliminar archivo
exports.eliminarArchivo = (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/materiales', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ 
        success: true, 
        mensaje: 'Archivo eliminado exitosamente' 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        mensaje: 'Archivo no encontrado' 
      });
    }
  } catch (error) {
    console.error('Error eliminando archivo:', error);
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al eliminar el archivo' 
    });
  }
};

// Descargar archivo
exports.descargarArchivo = (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/materiales', filename);
    
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).json({ 
        success: false, 
        mensaje: 'Archivo no encontrado' 
      });
    }
  } catch (error) {
    console.error('Error descargando archivo:', error);
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al descargar el archivo' 
    });
  }
};