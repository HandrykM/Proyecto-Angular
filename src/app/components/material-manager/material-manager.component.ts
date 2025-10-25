// src/app/components/material-manager/material-manager.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

export interface MaterialAdicional {
  id?: number;
  tipo: 'video' | 'pdf' | 'imagen' | 'documento' | 'enlace';
  titulo: string;
  descripcion?: string;
  url?: string;
  archivo?: File;
  icono?: string;
}

@Component({
  selector: 'app-material-manager',
  templateUrl: './material-manager.component.html',
  styleUrls: ['./material-manager.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MaterialManagerComponent {
  @Input() materiales: MaterialAdicional[] = [];
  @Output() materialesChange = new EventEmitter<MaterialAdicional[]>();
  
  mostrarFormulario = false;
  materialActual: MaterialAdicional = this.crearMaterialVacio();
  editandoIndice: number | null = null;
  
  tiposMaterial = [
  { valor: 'video', label: 'Video', icono: 'fas fa-video' },
  { valor: 'pdf', label: 'PDF', icono: 'fas fa-file-pdf' },
  { valor: 'imagen', label: 'Imagen', icono: 'fas fa-image' },
  { valor: 'documento', label: 'Documento', icono: 'fas fa-file-alt' },
  { valor: 'enlace', label: 'Enlace Externo', icono: 'fas fa-link' }
] as const;  // Esto hace que `valor` sea de tipo literal 'video' | 'pdf' | 'imagen' | 'documento' | 'enlace'


  
  iconosDisponibles = [
    'fas fa-video', 'fas fa-file-pdf', 'fas fa-image', 'fas fa-file-alt',
    'fas fa-link', 'fas fa-book', 'fas fa-file-word', 'fas fa-file-excel',
    'fas fa-file-powerpoint', 'fas fa-file-archive', 'fas fa-play-circle',
    'fas fa-download', 'fas fa-external-link-alt'
  ];
  
  mostrarSelectorIconos = false;
  
  constructor(private http: HttpClient) {}

  
  
  crearMaterialVacio(): MaterialAdicional {
    return {
      tipo: 'pdf',
      titulo: '',
      descripcion: '',
      url: '',
      icono: 'fas fa-file'
    };
  }

  
  
  abrirFormulario(): void {
    this.mostrarFormulario = true;
    this.materialActual = this.crearMaterialVacio();
    this.editandoIndice = null;
  }
  
  editarMaterial(material: MaterialAdicional, indice: number): void {
    this.mostrarFormulario = true;
    this.materialActual = { ...material };
    this.editandoIndice = indice;
  }
  
  guardarMaterial(): void {
    if (!this.materialActual.titulo) {
      alert('El título es obligatorio');
      return;
    }
    
    if (!this.materialActual.url && !this.materialActual.archivo) {
      alert('Debes proporcionar una URL o subir un archivo');
      return;
    }
    
    // Asignar icono según tipo si no se ha seleccionado uno
    if (!this.materialActual.icono) {
      const tipoInfo = this.tiposMaterial.find(t => t.valor === this.materialActual.tipo);
      this.materialActual.icono = tipoInfo?.icono || 'fas fa-file';
    }
    
    if (this.editandoIndice !== null) {
      // Editar material existente
      this.materiales[this.editandoIndice] = { ...this.materialActual };
    } else {
      // Agregar nuevo material
      this.materiales.push({ ...this.materialActual });
    }
    
    this.materialesChange.emit([...this.materiales]);
    this.cerrarFormulario();
  }
  
  eliminarMaterial(indice: number): void {
    if (confirm('¿Eliminar este material?')) {
      this.materiales.splice(indice, 1);
      this.materialesChange.emit([...this.materiales]);
    }
  }
  
  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.materialActual = this.crearMaterialVacio();
    this.editandoIndice = null;
  }
  
  onArchivoSeleccionado(event: any): void {
    const archivo = event.target?.files[0];
    if (archivo) {
      this.materialActual.archivo = archivo;
      
      // Si no hay título, usar nombre del archivo
      if (!this.materialActual.titulo) {
        this.materialActual.titulo = archivo.name;
      }
      
      // Determinar tipo automáticamente
      const extension = archivo.name.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'pdf':
          this.materialActual.tipo = 'pdf';
          this.materialActual.icono = 'fas fa-file-pdf';
          break;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
          this.materialActual.tipo = 'imagen';
          this.materialActual.icono = 'fas fa-image';
          break;
        case 'doc':
        case 'docx':
          this.materialActual.tipo = 'documento';
          this.materialActual.icono = 'fas fa-file-word';
          break;
        case 'xls':
        case 'xlsx':
          this.materialActual.tipo = 'documento';
          this.materialActual.icono = 'fas fa-file-excel';
          break;
        case 'ppt':
        case 'pptx':
          this.materialActual.tipo = 'documento';
          this.materialActual.icono = 'fas fa-file-powerpoint';
          break;
        default:
          this.materialActual.tipo = 'documento';
          this.materialActual.icono = 'fas fa-file-alt';
      }
    }
  }
  
  seleccionarIcono(icono: string): void {
    this.materialActual.icono = icono;
    this.mostrarSelectorIconos = false;
  }
  
  obtenerNombreTipo(tipo: string): string {
    const tipoInfo = this.tiposMaterial.find(t => t.valor === tipo);
    return tipoInfo?.label || tipo;
  }
  
  obtenerIconoTipo(tipo: string): string {
    const tipoInfo = this.tiposMaterial.find(t => t.valor === tipo);
    return tipoInfo?.icono || 'fas fa-file';
  }

  
}