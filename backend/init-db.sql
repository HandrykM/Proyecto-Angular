-- ============================================
-- SCRIPT DE INICIALIZACIÓN PARA RENDER
-- Base de datos limpia con solo usuario admin
-- ============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS proyecto_agua CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE proyecto_agua;

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  correo VARCHAR(100) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  rol ENUM('usuario', 'admin') DEFAULT 'usuario',
  avatar VARCHAR(255),
  direccion VARCHAR(255),
  telefono VARCHAR(20),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP NULL,
  nombre_completo VARCHAR(200),
  foto VARCHAR(255),
  nombre_usuario VARCHAR(100),
  reset_password_token VARCHAR(255),
  reset_password_expires DATETIME,
  INDEX idx_correo (correo),
  INDEX idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar usuario administrador (Handryk)
INSERT INTO usuarios (id, nombre, correo, contrasena, rol, telefono, fecha_registro, nombre_completo)
VALUES (1, 'Handryk', 'handrykmosquera@gmail.com', 
        '$2b$12$HdF5J1cbCFoV/MxQUIOdfeJ3vEWmMryLpAskyVRyecE1QiDsYKdNu', 
        'admin', '3053366575', NOW(), 'Handryk Riascos');

-- ============================================
-- TABLA: modulos
-- ============================================
CREATE TABLE IF NOT EXISTS modulos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  nivel ENUM('basico', 'intermedio', 'avanzado') DEFAULT 'basico',
  orden INT DEFAULT 1,
  icono VARCHAR(100) DEFAULT 'fas fa-book',
  color VARCHAR(50) DEFAULT '#00a8e8',
  puntos INT DEFAULT 100,
  activo TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_activo (activo),
  INDEX idx_orden (orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: lecturas
-- ============================================
CREATE TABLE IF NOT EXISTS lecturas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  modulo_id INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  contenido LONGTEXT NOT NULL,
  descripcion TEXT,
  duracion VARCHAR(50) DEFAULT '10 min',
  orden INT DEFAULT 1,
  activa TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (modulo_id) REFERENCES modulos(id) ON DELETE CASCADE,
  INDEX idx_modulo_activa (modulo_id, activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: materiales_modulo
-- ============================================
CREATE TABLE IF NOT EXISTS materiales_modulo (
  id INT PRIMARY KEY AUTO_INCREMENT,
  modulo_id INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo ENUM('infografia', 'guia', 'video', 'otro') DEFAULT 'otro',
  url VARCHAR(500),
  filename VARCHAR(255),
  hash_archivo VARCHAR(64),
  tamano_bytes BIGINT DEFAULT 0,
  icono VARCHAR(100) DEFAULT 'fas fa-file',
  orden INT DEFAULT 1,
  activo TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (modulo_id) REFERENCES modulos(id) ON DELETE CASCADE,
  INDEX idx_modulo (modulo_id),
  INDEX idx_hash (hash_archivo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: progreso_lecturas
-- ============================================
CREATE TABLE IF NOT EXISTS progreso_lecturas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  lectura_id INT NOT NULL,
  completada TINYINT(1) DEFAULT 0,
  progreso_porcentaje INT DEFAULT 0,
  fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_completada TIMESTAMP NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (lectura_id) REFERENCES lecturas(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_lecture (usuario_id, lectura_id),
  INDEX idx_usuario_completada (usuario_id, completada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: notas_lectura
-- ============================================
CREATE TABLE IF NOT EXISTS notas_lectura (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  id_lectura INT NOT NULL,
  contenido TEXT NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_lectura) REFERENCES lecturas(id) ON DELETE CASCADE,
  INDEX idx_usuario_lectura (id_usuario, id_lectura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: actividades
-- ============================================
CREATE TABLE IF NOT EXISTS actividades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo ENUM('juego', 'simulacion', 'cuestionario', 'practica') DEFAULT 'juego',
  nivel ENUM('basico', 'intermedio', 'avanzado') DEFAULT 'basico',
  puntos INT DEFAULT 10,
  icono VARCHAR(100) DEFAULT 'fas fa-gamepad',
  color VARCHAR(50) DEFAULT '#3498db',
  duracion VARCHAR(50) DEFAULT '10-15 min',
  orden INT DEFAULT 1,
  activo TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activo (activo),
  INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: progreso_actividades
-- ============================================
CREATE TABLE IF NOT EXISTS progreso_actividades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  id_actividad INT NOT NULL,
  completada TINYINT(1) DEFAULT 0,
  puntuacion_maxima INT DEFAULT 0,
  intentos INT DEFAULT 0,
  fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_completada TIMESTAMP NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_actividad) REFERENCES actividades(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_activity (id_usuario, id_actividad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: actividad_usuario
-- ============================================
CREATE TABLE IF NOT EXISTS actividad_usuario (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  tipo_actividad VARCHAR(50),
  id_referencia INT,
  resultado VARCHAR(50),
  puntos_obtenidos INT DEFAULT 0,
  fecha_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario_fecha (id_usuario, fecha_actividad),
  INDEX idx_tipo (tipo_actividad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: biblioteca
-- ============================================
CREATE TABLE IF NOT EXISTS biblioteca (
  id INT PRIMARY KEY AUTO_INCREMENT,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  contenido LONGTEXT,
  autor VARCHAR(255),
  tipo ENUM('articulo', 'video', 'infografia', 'documento') DEFAULT 'articulo',
  url VARCHAR(500),
  thumbnail VARCHAR(500),
  hash_archivo VARCHAR(64),
  nivel ENUM('basico', 'intermedio', 'avanzado'),
  categoria VARCHAR(100),
  duracion VARCHAR(50),
  puntos INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tipo (tipo),
  INDEX idx_nivel (nivel),
  INDEX idx_hash (hash_archivo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: logros
-- ============================================
CREATE TABLE IF NOT EXISTS logros (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(100) DEFAULT 'fas fa-trophy',
  categoria ENUM('modulos', 'actividades', 'tiempo', 'puntos', 'especial') DEFAULT 'especial',
  puntos_requeridos INT DEFAULT 0,
  activo TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: usuario_logros
-- ============================================
CREATE TABLE IF NOT EXISTS usuario_logros (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  id_logro INT NOT NULL,
  fecha_obtencion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_logro) REFERENCES logros(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_achievement (id_usuario, id_logro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: certificados
-- ============================================
CREATE TABLE IF NOT EXISTS certificados (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  codigo_verificacion VARCHAR(100) UNIQUE,
  url_certificado VARCHAR(500),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_codigo (codigo_verificacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: tiempo_estudio
-- ============================================
CREATE TABLE IF NOT EXISTS tiempo_estudio (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  fecha DATE NOT NULL,
  tiempo_minutos INT DEFAULT 0,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_date (id_usuario, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: sesiones_usuario
-- ============================================
CREATE TABLE IF NOT EXISTS sesiones_usuario (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  ip VARCHAR(45),
  dispositivo VARCHAR(255),
  navegador VARCHAR(100),
  sistema_operativo VARCHAR(100),
  ubicacion VARCHAR(255),
  user_agent TEXT,
  activo TINYINT(1) DEFAULT 1,
  fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario_activo (id_usuario, activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: ranking_gogo
-- ============================================
CREATE TABLE IF NOT EXISTS ranking_gogo (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  puntuacion_maxima INT DEFAULT 0,
  nivel_alcanzado INT DEFAULT 1,
  gotas_recolectadas INT DEFAULT 0,
  tiempo_jugado INT DEFAULT 0,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user (id_usuario),
  INDEX idx_puntuacion (puntuacion_maxima DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: dashboard
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  total_contenido_leido INT DEFAULT 0,
  progreso_total DECIMAL(5,2) DEFAULT 0,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_dashboard (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar dashboard para el usuario admin
INSERT INTO dashboard (id_usuario, total_contenido_leido, progreso_total)
VALUES (1, 0, 0.00);

-- ============================================
-- PROCEDIMIENTO: eliminar_modulo_completo
-- ============================================
DELIMITER $$
CREATE PROCEDURE eliminar_modulo_completo(IN p_modulo_id INT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error al eliminar módulo';
  END;

  START TRANSACTION;
  
  DELETE FROM progreso_lecturas WHERE lectura_id IN (SELECT id FROM lecturas WHERE modulo_id = p_modulo_id);
  DELETE FROM notas_lectura WHERE id_lectura IN (SELECT id FROM lecturas WHERE modulo_id = p_modulo_id);
  DELETE FROM actividad_usuario WHERE tipo_actividad = 'modulo' AND id_referencia = p_modulo_id;
  DELETE FROM lecturas WHERE modulo_id = p_modulo_id;
  DELETE FROM materiales_modulo WHERE modulo_id = p_modulo_id;
  DELETE FROM modulos WHERE id = p_modulo_id;
  
  COMMIT;
END$$
DELIMITER ;

-- ============================================
-- BASE DE DATOS INICIALIZADA
-- ============================================
SELECT 'Base de datos inicializada correctamente con usuario admin Handryk' AS mensaje;