// backend/config/multer.config.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/* ============================================================
   🔧 UTILIDAD PARA CREAR DIRECTORIOS SI NO EXISTEN
   ============================================================ */
const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/* ============================================================
   📂 CONFIGURACIÓN GENERAL
   ============================================================ */
const uploadBase = path.join(__dirname, '../uploads');
const uploadDirs = {
  materiales: path.join(uploadBase, 'materiales'),
  perfiles: path.join(uploadBase, 'perfiles'),
  certificados: path.join(uploadBase, 'certificados')
};

// Crear directorios base
Object.values(uploadDirs).forEach(ensureDirExists);

/* ============================================================
   🧾 1. MATERIALES (PDF, imágenes, videos, presentaciones)
   ============================================================ */
const storageMateriales = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureDirExists(uploadDirs.materiales);
    cb(null, uploadDirs.materiales);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Tipos MIME permitidos para materiales
const allowedMateriales = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const fileFilterMateriales = (req, file, cb) => {
  if (allowedMateriales.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido (${file.mimetype})`), false);
  }
};

const uploadMateriales = multer({
  storage: storageMateriales,
  fileFilter: fileFilterMateriales,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB máx
});

/* ============================================================
   🧍‍♂️ 2. PERFILES (solo imágenes)
   ============================================================ */
const storagePerfiles = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureDirExists(uploadDirs.perfiles);
    cb(null, uploadDirs.perfiles);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const fileFilterPerfiles = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Solo se permiten imágenes (jpg, jpeg, png, gif)'), false);
};

const uploadPerfiles = multer({
  storage: storagePerfiles,
  fileFilter: fileFilterPerfiles,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB máx
});

/* ============================================================
   🎓 3. CERTIFICADOS (solo PDF)
   ============================================================ */
const storageCertificados = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureDirExists(uploadDirs.certificados);
    cb(null, uploadDirs.certificados);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const fileFilterCertificados = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Solo se permiten archivos PDF para certificados'), false);
};

const uploadCertificados = multer({
  storage: storageCertificados,
  fileFilter: fileFilterCertificados,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB máx
});

/* ============================================================
   🚀 EXPORTAR CONFIGURACIONES
   ============================================================ */
module.exports = {
  uploadMateriales,
  uploadPerfiles,
  uploadCertificados
};
