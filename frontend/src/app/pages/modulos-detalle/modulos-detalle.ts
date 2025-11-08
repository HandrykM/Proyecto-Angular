import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

interface Pregunta {
  id: number;
  pregunta: string;
  opciones: string[];
  respuesta?: string;
}

@Component({
  standalone: true,
  selector: 'app-modulos-detalle',
  templateUrl: './modulos-detalle.html',
  styleUrls: ['./modulos-detalle.css'],
  imports: [CommonModule, FormsModule]   // 👈 agrega FormsModule aquí
})
export class ModulosDetalle implements OnInit {
private apiUrl = environment.apiUrl;

  modulo: any = {};
  preguntas: Pregunta[] = [];
  respuestas: { [key: number]: string } = {};
  resultado: string = '';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}
  

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarModulo(id);
      this.cargarPreguntas(id);
    }
  }

  cargarModulo(id: string) {
    this.http.get(`${this.apiUrl}/modulos/${id}`).subscribe({
      next: (data) => this.modulo = data,
      error: (err) => console.error(err)
    });
  }

  cargarPreguntas(id: string) {
    this.http.get<Pregunta[]>(`${this.apiUrl}/modulos/${id}/quiz`).subscribe({
      next: (data) => this.preguntas = data,
      error: (err) => console.error(err)
    });
  }

  enviarQuiz() {
    this.http.post(`${this.apiUrl}/resultados`, {
      moduloId: this.modulo.id,
      respuestas: this.respuestas
    }).subscribe({
      next: (res: any) => this.resultado = `Tu puntaje: ${res.puntaje} / ${res.total}`,
      error: (err) => console.error(err)
    });
  }
}
