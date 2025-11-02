import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActividadesService } from '../../../services/actividades';
import { AuthService } from '../../../services/auth';

interface ResultadoCategoria {
	nombre: string;
	correctas: number;
	total: number;
	porcentaje: number;
}

interface Recomendacion {
	icono: string;
	texto: string;
}

@Component({
	selector: 'app-trivia-basica',
	templateUrl: './trivia-basica.html',
	styleUrls: ['./trivia-basica.css'],
	imports: [CommonModule,], //TitleCasePipe
	standalone: true
})
export class TriviaBasicaComponent implements OnInit, OnDestroy {
	// Variables de control para mostrar/ocultar ventanas
	showMiniWindowTrivia: boolean = true;
	showResults: boolean = false;
	@ViewChild('triviaFrame') triviaFrame!: ElementRef<HTMLIFrameElement>;

	triviaUrl!: SafeResourceUrl;
	cargandoTrivia = true;
	mostrarStats = true;
	mostrarResultados = false;
	mostrarSelectorDificultad = false;

	// Datos del juego
	dificultadActual = 'facil';
		puntuacionActual = 0;
		puntuacionFinal = 0;
		respuestasCorrectas = 0;
		totalPreguntas = 0;
		precision = 0;
			rachaActual = 0;
			mejorRacha = 0;
			private rachaTemp = 0;
		progresoGeneral = 0;
		puntosPorPregunta = 10; // Cada pregunta vale 10 puntos
		maxPuntosTrivia = 100; // 10 preguntas x 10 puntos

	// Medalla obtenida
	medallaObtenida = 'bronce';
	tituloMedalla = 'Medalla de Bronce';

	// Tiempo
	tiempoInicio: Date = new Date();
	tiempoTranscurrido = 0;
	segundosTranscurridos = 0;
	intervalTimer: any;
	usuarioId: number;

	// Resultados detallados
	resultadosPorCategoria: ResultadoCategoria[] = [];
	recomendaciones: Recomendacion[] = [];

	constructor(
		private router: Router,
		private sanitizer: DomSanitizer,
		private actividadesService: ActividadesService,
		private authService: AuthService
	) {
		this.usuarioId = this.authService.getUsuarioId();
		this.construirUrlTrivia();
	}

	ngOnInit(): void {
		this.iniciarTemporizador();
		this.configurarComunicacionConTrivia();
	}

	ngOnDestroy(): void {
		if (this.intervalTimer) {
			clearInterval(this.intervalTimer);
		}
	}

	private construirUrlTrivia(): void {
		const params = new URLSearchParams({
			dificultad: this.dificultadActual,
			usuario: this.usuarioId.toString()
		});
		this.triviaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
			`/assets/trivia/index.html?${params.toString()}`
		);
	}

	private iniciarTemporizador(): void {
		this.intervalTimer = setInterval(() => {
			const tiempoActual = new Date();
			const diferencia = tiempoActual.getTime() - this.tiempoInicio.getTime();
			this.tiempoTranscurrido = Math.floor(diferencia / 60000);
			this.segundosTranscurridos = Math.floor((diferencia % 60000) / 1000);
		}, 1000);
	}

	private configurarComunicacionConTrivia(): void {
		window.addEventListener('message', (event) => {
			switch (event.data.type) {
				case 'trivia-update':
					this.procesarActualizacionTrivia(event.data);
					break;
				case 'trivia-completed':
					this.completarTrivia(event.data);
					break;
				case 'trivia-question-answered':
					this.actualizarEstadisticas(event.data);
					break;
			}
		});
	}

	private procesarActualizacionTrivia(data: any): void {
				this.respuestasCorrectas = data.correctas || 0;
				this.totalPreguntas = data.total || 0;
				// Lógica de racha actual y mejor racha
				if (data.isCorrect) {
					this.rachaTemp++;
				} else {
					this.rachaTemp = 0;
				}
				this.rachaActual = this.rachaTemp;
				if (this.rachaActual > this.mejorRacha) {
					this.mejorRacha = this.rachaActual;
				}
				this.puntuacionActual = this.respuestasCorrectas * this.puntosPorPregunta;
				if (this.totalPreguntas > 0) {
					this.precision = Math.round((this.respuestasCorrectas / this.totalPreguntas) * 100);
					this.progresoGeneral = Math.round((this.totalPreguntas / 10) * 100); // Asumiendo 10 preguntas
				}
	}

	private actualizarEstadisticas(data: any): void {
		// Actualizar estadísticas en tiempo real
		this.procesarActualizacionTrivia(data);
	}

		private completarTrivia(data: any): void {
			this.respuestasCorrectas = data.correctas || this.respuestasCorrectas;
			this.totalPreguntas = data.total || this.totalPreguntas;
			this.precision = data.precision || this.precision;
			// Al finalizar, la mejor racha es la máxima alcanzada
			this.puntuacionFinal = this.respuestasCorrectas * this.puntosPorPregunta;
			// Procesar resultados por categoría si están disponibles
			if (data.categorias) {
				this.resultadosPorCategoria = data.categorias;
			}
			this.determinarMedalla();
			this.generarRecomendaciones();
			// Ocultar mini ventana y mostrar solo resultados centrales
			this.showMiniWindowTrivia = false;
			this.showResults = true;
			this.mostrarResultados = false;
		}

	private determinarMedalla(): void {
				if (this.precision >= 80) {
					this.medallaObtenida = 'oro';
					this.tituloMedalla = '¡Medalla de Oro!';
				} else if (this.precision >= 60) {
					this.medallaObtenida = 'plata';
					this.tituloMedalla = '¡Medalla de Plata!';
				} else {
					this.medallaObtenida = 'bronce';
					this.tituloMedalla = 'Medalla de Bronce';
				}
	}

	private generarRecomendaciones(): void {
		this.recomendaciones = [];

		if (this.precision < 50) {
			this.recomendaciones.push({
				icono: 'fas fa-book',
				texto: 'Revisa los módulos básicos sobre reúso del agua'
			});
		}

		if (this.mejorRacha < 3) {
			this.recomendaciones.push({
				icono: 'fas fa-target',
				texto: 'Practica más para mejorar tu concentración'
			});
		}

		if (this.dificultadActual === 'facil' && this.precision >= 80) {
			this.recomendaciones.push({
				icono: 'fas fa-level-up-alt',
				texto: '¡Estás listo para el nivel intermedio!'
			});
		}

		if (this.tiempoTranscurrido < 5) {
			this.recomendaciones.push({
				icono: 'fas fa-clock',
				texto: 'Tómate más tiempo para leer las preguntas cuidadosamente'
			});
		}
	}

	onTriviaCargada(): void {
		setTimeout(() => {
			this.cargandoTrivia = false;
		}, 1000);
	}

	toggleStats(): void {
		this.mostrarStats = !this.mostrarStats;
	}

	seleccionarDificultad(dificultad: string): void {
		this.dificultadActual = dificultad;
		this.construirUrlTrivia();
		this.reiniciarDatos();
		this.cerrarSelectorDificultad();
	}

	cambiarDificultad(): void {
		this.mostrarSelectorDificultad = true;
	}

	cerrarSelectorDificultad(): void {
		this.mostrarSelectorDificultad = false;
	}

	private reiniciarDatos(): void {
		this.puntuacionActual = 0;
		this.puntuacionFinal = 0;
		this.respuestasCorrectas = 0;
		this.totalPreguntas = 0;
		this.precision = 0;
		this.rachaActual = 0;
		this.mejorRacha = 0;
		this.rachaTemp = 0;
		this.progresoGeneral = 0;
		this.tiempoInicio = new Date();
		this.resultadosPorCategoria = [];
		this.recomendaciones = [];
	}

		reiniciarTrivia(): void {
			if (this.triviaFrame) {
				this.triviaFrame.nativeElement.src = this.triviaFrame.nativeElement.src;
			}
			this.reiniciarDatos();
			this.showMiniWindowTrivia = true;
			this.showResults = false;
			this.mostrarResultados = false;
		}

	volverAActividades(): void {
		this.router.navigate(['/actividades']);
	}

	cerrarResultados(): void {
		this.mostrarResultados = false;
	}

	finalizarActividad(): void {
		const progreso = {
			id: 0,
			idUsuario: this.usuarioId,
			idActividad: 2, // ID de la trivia
			completada: true,
			progreso: 100,
			puntuacionMaxima: this.puntuacionFinal,
			intentos: 1,
			tiempoTotal: this.tiempoTranscurrido,
			ultimaActividad: new Date(),
			datosProgreso: {
				dificultad: this.dificultadActual,
				precision: this.precision,
				mejorRacha: this.mejorRacha,
				medallaObtenida: this.medallaObtenida,
				resultadosPorCategoria: this.resultadosPorCategoria
			}
		};

		this.actividadesService.guardarProgreso(progreso).subscribe({
			next: () => {
				console.log('Progreso de trivia guardado exitosamente');
				this.volverAActividades();
			},
			error: (error) => {
				console.error('Error al guardar progreso:', error);
				this.volverAActividades();
			}
		});
	}
}
