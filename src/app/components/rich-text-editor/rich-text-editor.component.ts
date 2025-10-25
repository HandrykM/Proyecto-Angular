// src/app/components/rich-text-editor/rich-text-editor.component.ts
import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rich-text-editor',
  templateUrl: './rich-text-editor.component.html',
  styleUrls: ['./rich-text-editor.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class RichTextEditorComponent implements OnInit {
  @Input() contenido: string = '';
  @Output() contenidoChange = new EventEmitter<string>();
  
  @ViewChild('editor', { static: false }) editorRef!: ElementRef;
  
  mostrarFuenteDropdown = false;
  mostrarTamanoDropdown = false;
  mostrarColorPicker = false;
  
  fuentes = [
    'Arial', 'Courier New', 'Georgia', 'Times New Roman', 
    'Trebuchet MS', 'Verdana', 'Comic Sans MS', 'Impact'
  ];
  
  tamanos = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px'];
  
  colorActual = '#000000';
  
  ngOnInit(): void {
    if (this.contenido) {
      setTimeout(() => {
        if (this.editorRef) {
          this.editorRef.nativeElement.innerHTML = this.contenido;
        }
      }, 100);
    }
  }
  
  // Comandos de formato
  ejecutarComando(comando: string, valor?: string): void {
    document.execCommand(comando, false, valor);
    this.actualizarContenido();
  }
  
  cambiarFuente(fuente: string): void {
    this.ejecutarComando('fontName', fuente);
    this.mostrarFuenteDropdown = false;
  }
  
  cambiarTamano(tamano: string): void {
    this.ejecutarComando('fontSize', '7');
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const selectedText = selection.getRangeAt(0).cloneContents();
      const span = document.createElement('span');
      span.style.fontSize = tamano;
      span.appendChild(selectedText);
      selection.getRangeAt(0).deleteContents();
      selection.getRangeAt(0).insertNode(span);
    }
    this.mostrarTamanoDropdown = false;
    this.actualizarContenido();
  }
  
  cambiarColor(color: string): void {
    this.colorActual = color;
    this.ejecutarComando('foreColor', color);
    this.mostrarColorPicker = false;
  }
  
  cambiarColorFondo(color: string): void {
    this.ejecutarComando('backColor', color);
  }
  
  insertarImagen(): void {
    const url = prompt('Ingresa la URL de la imagen:');
    if (url) {
      this.ejecutarComando('insertImage', url);
    }
  }
  
  insertarEnlace(): void {
    const url = prompt('Ingresa la URL del enlace:');
    if (url) {
      this.ejecutarComando('createLink', url);
    }
  }
  
  insertarTabla(): void {
    const filas = prompt('Número de filas:', '3');
    const columnas = prompt('Número de columnas:', '3');
    
    if (filas && columnas) {
      let tabla = '<table border="1" style="border-collapse: collapse; width: 100%;">';
      for (let i = 0; i < parseInt(filas); i++) {
        tabla += '<tr>';
        for (let j = 0; j < parseInt(columnas); j++) {
          tabla += '<td style="padding: 8px; border: 1px solid #ddd;">Celda</td>';
        }
        tabla += '</tr>';
      }
      tabla += '</table><br>';
      
      this.insertarHTML(tabla);
    }
  }
  
  insertarHTML(html: string): void {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const div = document.createElement('div');
      div.innerHTML = html;
      range.insertNode(div);
    }
    this.actualizarContenido();
  }
  
  cambiarAlineacion(alineacion: string): void {
    this.ejecutarComando('justify' + alineacion);
  }
  
  insertarLista(tipo: string): void {
    this.ejecutarComando(tipo === 'ordenada' ? 'insertOrderedList' : 'insertUnorderedList');
  }
  
  limpiarFormato(): void {
    this.ejecutarComando('removeFormat');
  }
  
  verCodigo(): void {
    const editor = this.editorRef.nativeElement;
    const html = editor.innerHTML;
    const nuevoHTML = prompt('Editar HTML:', html);
    if (nuevoHTML !== null) {
      editor.innerHTML = nuevoHTML;
      this.actualizarContenido();
    }
  }
  
  actualizarContenido(): void {
    if (this.editorRef) {
      const html = this.editorRef.nativeElement.innerHTML;
      this.contenido = html;
      this.contenidoChange.emit(html);
    }
  }
}