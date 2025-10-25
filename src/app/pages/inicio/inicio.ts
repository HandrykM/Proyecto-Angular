import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js/auto';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.css'],
  imports: [CommonModule, RouterModule],
  standalone: true
})
export class Inicio implements OnInit, AfterViewInit, OnDestroy {
  
  // Chart instance gsap
  private consumptionChart: Chart | undefined;
fotoUsuario: string;
  usuario: { foto?: string; nombre?: string; rol?: string } | null = null;

  // Datos para ejemplos prácticos
  examples = [
    {
      title: 'Sistema de Reúso Residencial Bogotá',
      location: 'Bogotá, Cundinamarca',
      description: 'Implementación de sistema de captación de aguas grises y lluvia en conjunto residencial de 120 apartamentos.',
      savings: '45% reducción en consumo',
      icon: 'fas fa-building'
    },
    {
      title: 'Proyecto Rural Antioquia',
      location: 'Medellín, Antioquia',
      description: 'Sistemas comunitarios de reúso de agua para agricultura sostenible beneficiando 200 familias campesinas.',
      savings: '60% ahorro en riego',
      icon: 'fas fa-tractor'
    },
    {
      title: 'Centro Educativo Valle del Cauca',
      location: 'Cali, Valle del Cauca',
      description: 'Instalación de sistemas educativos de reúso de agua que sirven como modelo pedagógico.',
      savings: '38% reducción de costos',
      icon: 'fas fa-school'
    },
    {
      title: 'Industria Textil Atlántico',
      location: 'Barranquilla, Atlántico',
      description: 'Implementación de tecnología avanzada para tratamiento y reúso de aguas residuales industriales.',
      savings: '50% menor consumo',
      icon: 'fas fa-industry'
    }
  ];

  // Datos para flujo del agua
  flowSteps = [
    {
      title: 'Captación',
      description: 'El agua se recoge desde múltiples fuentes: duchas, lavamanos, lavadora y lluvia.'
    },
    {
      title: 'Almacenamiento',
      description: 'Se almacena temporalmente en tanques especializados con sistemas de ventilación.'
    },
    {
      title: 'Filtración Básica',
      description: 'Pasa por filtros de sedimentos y grasas para eliminar impurezas visibles.'
    },
    {
      title: 'Tratamiento',
      description: 'Desinfección y estabilización química para garantizar seguridad en el reúso.'
    },
    {
      title: 'Distribución',
      description: 'El agua tratada se distribuye a inodoros, riego y limpieza mediante tuberías separadas.'
    }
  ];

  // Recursos oficiales en Colombia
  officialResources = [
    {
      name: 'IDEAM',
      description: 'Instituto de Hidrología, Meteorología y Estudios Ambientales - Datos y normativas sobre recursos hídricos.',
      icon: 'fas fa-cloud-rain',
      link: 'http://www.ideam.gov.co'
    },
    {
      name: 'Ministerio de Ambiente',
      description: 'Políticas y regulaciones ambientales relacionadas con el uso sostenible del agua.',
      icon: 'fas fa-leaf',
      link: 'https://www.minambiente.gov.co'
    },
    {
      name: 'Superintendencia de Servicios Públicos',
      description: 'Regulación y control de servicios públicos domiciliarios, incluyendo acueducto.',
      icon: 'fas fa-building',
      link: 'https://www.superservicios.gov.co'
    },
    {
      name: 'DANE',
      description: 'Departamento Nacional de Estadística - Cifras sobre consumo de agua y servicios públicos.',
      icon: 'fas fa-chart-pie',
      link: 'https://www.dane.gov.co'
    }
  ];

  // Casos de éxito
  successCases = [
    {
      title: 'Conjunto Residencial Ciudadela El Recreo',
      location: 'Bosa, Bogotá',
      year: '2023',
      description: 'Implementación de sistema integral de reúso que incluye captación de lluvia, tratamiento de aguas grises y distribución automatizada. Proyecto pionero que sirve de modelo para otros desarrollos urbanos.',
      waterSaved: '2.4 millones',
      costSavings: '$45 millones anuales'
    },
    {
      title: 'Hacienda La Esperanza',
      location: 'Carmen de Viboral, Antioquia',
      year: '2022',
      description: 'Sistema comunitario rural que combina técnicas tradicionales con tecnología moderna para el reúso de agua en cultivos de flores y hortalizas. Ha mejorado la productividad y sostenibilidad del sector.',
      waterSaved: '1.8 millones',
      costSavings: '$28 millones anuales'
    },
    {
      title: 'Universidad Icesi - Campus Sostenible',
      location: 'Cali, Valle del Cauca',
      year: '2023',
      description: 'Proyecto educativo que integra investigación, educación y práctica en reúso de agua. Incluye laboratorios vivientes donde estudiantes desarrollan nuevas tecnologías de tratamiento.',
      waterSaved: '960 mil',
      costSavings: '$18 millones anuales'
    }
  ];

  constructor(
    private authService: AuthService
  ) {
    const foto = this.authService.getFotoUsuario();
this.fotoUsuario = foto !== null ? foto : '';
    // Registrar componentes de Chart.js
    Chart.register(...registerables);

    
  }

  ngOnInit(): void {
    // Configurar smooth scrolling para la navegación flotante
    this.setupSmoothScrolling();
    this.authService.usuario$.subscribe(usuario => {
    this.usuario = usuario;
    
  });
  }

  ngAfterViewInit(): void {
    // Inicializar gráfico después de que la vista se haya cargado
    setTimeout(() => {
      this.initializeChart();
    }, 100);

    // Configurar observador de intersección para navegación activa
    this.setupActiveNavigation();

    // Animaciones de entrada para elementos
    this.initializeAnimations();
  }

  ngOnDestroy(): void {
    // Limpiar el gráfico al destruir el componente
    if (this.consumptionChart) {
      this.consumptionChart.destroy();
    }
  }

  private initializeChart(): void {
    const canvas = document.getElementById('consumptionChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.consumptionChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Bogotá', 'Antioquia', 'Medellín', 'Cartagena', 'Cali'],
        datasets: [{
          label: 'Consumo L/día per cápita',
          data: [150, 140, 160, 130, 145],
          backgroundColor: [
            'rgba(0, 168, 232, 0.8)',
            'rgba(0, 119, 182, 0.8)',
            'rgba(128, 255, 219, 0.8)',
            'rgba(0, 168, 232, 0.6)',
            'rgba(0, 119, 182, 0.6)'
          ],
          borderColor: [
            'rgba(0, 168, 232, 1)',
            'rgba(0, 119, 182, 1)',
            'rgba(128, 255, 219, 1)',
            'rgba(0, 168, 232, 1)',
            'rgba(0, 119, 182, 1)'
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Consumo de Agua por Departamento',
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#1a1a2e'
          },
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(26, 26, 46, 0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: '#00a8e8',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return `${context.parsed.y} litros por día per cápita`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Litros por día per cápita',
              color: '#6c757d',
              font: {
                weight: 'bold'
              }
            },
            ticks: {
              color: '#6c757d'
            },
            grid: {
              color: 'rgba(108, 117, 125, 0.1)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Departamentos / Ciudades',
              color: '#6c757d',
              font: {
                weight: 'bold'
              }
            },
            ticks: {
              color: '#6c757d'
            },
            grid: {
              display: false
            }
          }
        },
        animation: {
          duration: 2000,
          easing: 'easeInOutQuart'
        }
      }
    });
  }

  private setupSmoothScrolling(): void {
    // Configurar smooth scroll para los enlaces de navegación flotante
    const navItems = document.querySelectorAll('.nav-item[href^="#"]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const href = item.getAttribute('href');
        if (href) {
          const targetElement = document.querySelector(href);
          if (targetElement) {
            const offsetTop = targetElement.getBoundingClientRect().top + window.pageYOffset - 100;
            window.scrollTo({
              top: offsetTop,
              behavior: 'smooth'
            });
          }
        }
      });
    });
  }

  private setupActiveNavigation(): void {
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-item');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('id');
          
          // Remover clase activa de todos los elementos
          navItems.forEach(item => item.classList.remove('active'));
          
          // Agregar clase activa al elemento correspondiente
          const activeNavItem = document.querySelector(`.nav-item[href="#${sectionId}"]`);
          if (activeNavItem) {
            activeNavItem.classList.add('active');
          }
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '-100px 0px -100px 0px'
    });

    sections.forEach(section => {
      observer.observe(section);
    });
  }

  private initializeAnimations(): void {
    // Configurar animaciones de aparición con Intersection Observer
    const animatedElements = document.querySelectorAll('.impact-card, .example-card, .benefit-card, .resource-card, .case-card, .insight-card, .flow-step');
    
    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('animate-in');
          }, index * 100); // Stagger animation
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(element => {
      element.classList.add('animate-ready');
      animationObserver.observe(element);
    });

    // Agregar estilos CSS para las animaciones
    const style = document.createElement('style');
    style.textContent = `
      .animate-ready {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      
      .animate-in {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
  }

  // Método para manejar errores en la carga de imágenes (si se agregan más tarde)
  onImageError(event: any): void {
    event.target.style.display = 'none';
  }

  // Método para tracking de interacciones (para analytics futuros)
  trackInteraction(action: string, category: string, label?: string): void {
    // Implementar tracking de eventos si se requiere
    console.log(`Action: ${action}, Category: ${category}, Label: ${label || 'N/A'}`);
  }
}