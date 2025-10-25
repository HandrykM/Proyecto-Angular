// src/app/components/lecturas-manager/lecturas-manager.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RichTextEditorComponent } from '../rich-text-editor/rich-text-editor.component';

export interface LecturaData {
  id?: number;
  titulo: string;
  descripcion?: string;
  contenido: string;
  duracion?: string;
  orden: number;
  activa: boolean;
}

@Component({
  selector: 'app-lecturas-manager',
  templateUrl: './lecturas-manager.component.html',
  styleUrls: ['./lecturas-manager.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule,]// RichTextEditorComponent]
})
export class LecturasManagerComponent {
  @Input() lecturas: LecturaData[] = [];
  @Output() lecturasChange = new EventEmitter<LecturaData[]>();
  
  mostrarFormulario = false;
  lecturaActual: LecturaData = this.crearLecturaVacia();
  editandoIndice: number | null = null;
  
  constructor() {}
  
  crearLecturaVacia(): LecturaData {
    return {
      titulo: '',
      descripcion: '',
      contenido: '',
      duracion: '10 min',
      orden: this.lecturas.length + 1,
      activa: true
    };
  }
  
  abrirFormulario(): void {
    this.mostrarFormulario = true;
    this.lecturaActual = this.crearLecturaVacia();
    this.editandoIndice = null;
  }
  
  editarLectura(lectura: LecturaData, indice: number): void {
    this.mostrarFormulario = true;
    this.lecturaActual = { ...lectura };
    this.editandoIndice = indice;
  }
  
  guardarLectura(): void {
    if (!this.lecturaActual.titulo || !this.lecturaActual.contenido) {
      alert('El título y el contenido son obligatorios');
      return;
    }
    
    if (this.editandoIndice !== null) {
      this.lecturas[this.editandoIndice] = { ...this.lecturaActual };
    } else {
      this.lecturas.push({ ...this.lecturaActual });
    }
    
    this.lecturasChange.emit([...this.lecturas]);
    this.cerrarFormulario();
  }
  
  eliminarLectura(indice: number): void {
    if (confirm('¿Eliminar esta lectura?')) {
      this.lecturas.splice(indice, 1);
      // Reordenar
      this.lecturas.forEach((lec, idx) => {
        lec.orden = idx + 1;
      });
      this.lecturasChange.emit([...this.lecturas]);
    }
  }
  
  moverLectura(indice: number, direccion: 'arriba' | 'abajo'): void {
    if (direccion === 'arriba' && indice > 0) {
      [this.lecturas[indice], this.lecturas[indice - 1]] = 
      [this.lecturas[indice - 1], this.lecturas[indice]];
    } else if (direccion === 'abajo' && indice < this.lecturas.length - 1) {
      [this.lecturas[indice], this.lecturas[indice + 1]] = 
      [this.lecturas[indice + 1], this.lecturas[indice]];
    }
    
    // Actualizar orden
    this.lecturas.forEach((lec, idx) => {
      lec.orden = idx + 1;
    });
    
    this.lecturasChange.emit([...this.lecturas]);
  }
  
  toggleActiva(indice: number): void {
    this.lecturas[indice].activa = !this.lecturas[indice].activa;
    this.lecturasChange.emit([...this.lecturas]);
  }
  
  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.lecturaActual = this.crearLecturaVacia();
    this.editandoIndice = null;
  }
  
  onContenidoChange(contenido: string): void {
    this.lecturaActual.contenido = contenido;
  }
}