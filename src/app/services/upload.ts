// src/app/services/upload.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Upload {

  constructor() { }

  // Validar archivo de imagen
  validarImagen(archivo: File): { valido: boolean; error?: string } {
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const tamanoMaximo = 5 * 1024 * 1024; // 5MB

    if (!tiposPermitidos.includes(archivo.type)) {
      return {
        valido: false,
        error: 'Solo se permiten archivos JPG, JPEG, PNG y GIF'
      };
    }

    if (archivo.size > tamanoMaximo) {
      return {
        valido: false,
        error: 'El archivo no puede ser mayor a 5MB'
      };
    }

    return { valido: true };
  }

  // Redimensionar imagen antes de subir
  redimensionarImagen(archivo: File, maxAncho: number = 400, maxAlto: number = 400): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo la proporción
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxAncho) {
            height = (height * maxAncho) / width;
            width = maxAncho;
          }
        } else {
          if (height > maxAlto) {
            width = (width * maxAlto) / height;
            height = maxAlto;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar la imagen redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/jpeg', 0.8);
      };

      img.src = URL.createObjectURL(archivo);
    });
  }

  // Convertir archivo a base64 para preview
  archivoABase64(archivo: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(archivo);
    });
  }

  // Generar URL temporal para preview
  crearUrlTemporal(archivo: File): string {
    return URL.createObjectURL(archivo);
  }

  // Limpiar URL temporal
  revocarUrlTemporal(url: string): void {
    URL.revokeObjectURL(url);
  }

  // Comprimir imagen
  comprimirImagen(archivo: File, calidad: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          const archivoComprimido = new File([blob!], archivo.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(archivoComprimido);
        }, 'image/jpeg', calidad);
      };

      img.src = URL.createObjectURL(archivo);
    });
  }
}