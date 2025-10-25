// src/app/components/icon-selector/icon-selector.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface IconOption {
  class: string;
  name: string;
  category: string;
}

@Component({
  selector: 'app-icon-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './icon-selector.component.html',
  styleUrls: ['./icon-selector.component.css']
})
export class IconSelectorComponent {
  @Input() selectedIcon: string = 'fas fa-book';
  @Output() iconSelected = new EventEmitter<string>();

  showPicker = false;
  searchTerm = '';
  selectedCategory = 'Todos';

  categories = ['Todos', 'Educación', 'Agua', 'Juegos', 'Ciencia', 'General'];

  allIcons: IconOption[] = [
    // Educación
    { class: 'fas fa-book', name: 'Libro', category: 'Educación' },
    { class: 'fas fa-graduation-cap', name: 'Gorra graduación', category: 'Educación' },
    { class: 'fas fa-book-open', name: 'Libro abierto', category: 'Educación' },
    { class: 'fas fa-pen', name: 'Pluma', category: 'Educación' },
    { class: 'fas fa-chalkboard-teacher', name: 'Profesor', category: 'Educación' },
    { class: 'fas fa-user-graduate', name: 'Estudiante', category: 'Educación' },
    { class: 'fas fa-certificate', name: 'Certificado', category: 'Educación' },
    
    // Agua
    { class: 'fas fa-tint', name: 'Gota agua', category: 'Agua' },
    { class: 'fas fa-water', name: 'Agua', category: 'Agua' },
    { class: 'fas fa-shower', name: 'Ducha', category: 'Agua' },
    { class: 'fas fa-faucet', name: 'Grifo', category: 'Agua' },
    { class: 'fas fa-sink', name: 'Lavabo', category: 'Agua' },
    { class: 'fas fa-toilet', name: 'Inodoro', category: 'Agua' },
    { class: 'fas fa-cloud-rain', name: 'Lluvia', category: 'Agua' },
    
    // Juegos
    { class: 'fas fa-gamepad', name: 'Gamepad', category: 'Juegos' },
    { class: 'fas fa-puzzle-piece', name: 'Puzzle', category: 'Juegos' },
    { class: 'fas fa-trophy', name: 'Trofeo', category: 'Juegos' },
    { class: 'fas fa-star', name: 'Estrella', category: 'Juegos' },
    { class: 'fas fa-medal', name: 'Medalla', category: 'Juegos' },
    { class: 'fas fa-dice', name: 'Dado', category: 'Juegos' },
    
    // Ciencia
    { class: 'fas fa-flask', name: 'Matraz', category: 'Ciencia' },
    { class: 'fas fa-microscope', name: 'Microscopio', category: 'Ciencia' },
    { class: 'fas fa-atom', name: 'Átomo', category: 'Ciencia' },
    { class: 'fas fa-leaf', name: 'Hoja', category: 'Ciencia' },
    { class: 'fas fa-seedling', name: 'Planta', category: 'Ciencia' },
    { class: 'fas fa-recycle', name: 'Reciclar', category: 'Ciencia' },
    
    // General
    { class: 'fas fa-home', name: 'Casa', category: 'General' },
    { class: 'fas fa-lightbulb', name: 'Bombilla', category: 'General' },
    { class: 'fas fa-cog', name: 'Engranaje', category: 'General' },
    { class: 'fas fa-chart-line', name: 'Gráfico', category: 'General' },
    { class: 'fas fa-tasks', name: 'Tareas', category: 'General' },
    { class: 'fas fa-clipboard-list', name: 'Lista', category: 'General' },
    { class: 'fas fa-brain', name: 'Cerebro', category: 'General' },
    { class: 'fas fa-question-circle', name: 'Pregunta', category: 'General' },
    { class: 'fas fa-info-circle', name: 'Información', category: 'General' },
    { class: 'fas fa-check-circle', name: 'Check', category: 'General' }
  ];

  filteredIcons: IconOption[] = [...this.allIcons];

  get selectedIconName(): string {
    const icon = this.allIcons.find(i => i.class === this.selectedIcon);
    return icon ? icon.name : 'Seleccionar icono';
  }

  togglePicker(): void {
    this.showPicker = !this.showPicker;
    if (this.showPicker) {
      this.filterIcons();
    }
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.filterIcons();
  }

  filterIcons(): void {
    let icons = [...this.allIcons];

    // Filtrar por categoría
    if (this.selectedCategory !== 'Todos') {
      icons = icons.filter(i => i.category === this.selectedCategory);
    }

    // Filtrar por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      icons = icons.filter(i => 
        i.name.toLowerCase().includes(term) || 
        i.class.toLowerCase().includes(term)
      );
    }

    this.filteredIcons = icons;
  }

  selectIcon(iconClass: string): void {
    this.selectedIcon = iconClass;
    this.iconSelected.emit(iconClass);
    this.showPicker = false;
  }
}