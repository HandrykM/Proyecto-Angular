import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  standalone: true
})
export class Home implements OnInit, AfterViewInit {
  // Consejos para la barra de navegación
  currentTip: string = '';
tips: string[] = [
  'Cierra la llave al cepillarte: ahorra 12 L/min.',
  'El reúso de agua protege fuentes naturales.',
  'Usa el agua de lavar vegetales para regar.',
  'Prefiere regadera: ahorra hasta 50% de agua.',
  'Reutilizar agua es una práctica sostenible.',
  'Instala dispositivos ahorradores en grifos.',
  'Reusa agua del aire acondicionado para limpiar.',
  'El reúso combate la escasez de agua.',
  'Cada gota cuenta: cuida el planeta.',
  'Reutilizar agua reduce tu factura hasta 40%.',
  'El agua de lluvia es ideal para regar.',
  'Reusar agua mantiene el equilibrio ecológico.'
];


  // Variables para la calculadora
  people: number = 4;
  consumption: number = 800;
  reuseFrequency: number = 7;
  systemType: string = '';
  waterPrice: number = 0;
  showResults: boolean = false;
  loading: boolean = false;

  calculationResults = {
    weeklySaved: 0,
    monthlySaved: 0,
    annualSaved: 0,
    moneySaved: 0
  };

  // Datos para las secciones
  cycleSteps = [
    {
      title: 'Captación',
      description: 'Recogida de agua de lluvia y agua gris desde duchas, lavamanos y lavadoras para almacenaje inicial.'
    },
    {
      title: 'Uso',
      description: 'Empleo del agua captada en actividades domésticas como riego de plantas o limpieza de exteriores.'
    },
    {
      title: 'Tratamiento',
      description: 'Filtrado y desinfección básica para remover sedimentos, jabón y contaminantes leves.'
    },
    {
      title: 'Reúso',
      description: 'Reaplicación del agua tratada en inodoros, lavado de pisos o riego, cerrando el ciclo de forma eficiente.'
    }
  ];

  methods = [
    {
      icon: 'fas fa-house',
      title: 'Sistemas caseros básicos',
      description: 'Soluciones sencillas y de bajo costo sin conocimientos especializados.',
      features: [
        'Redireccionamiento manual del agua de lavadoras',
        'Recolección de agua de lluvia en barriles',
        'Cubetas para recoger agua de ducha'
      ]
    },
    {
      icon: 'fas fa-wrench',
      title: 'Sistemas intermedios',
      description: 'Requieren cierta instalación pero son accesibles para el hogar promedio.',
      features: [
        'Sistemas de desvío de aguas grises con filtros básicos',
        'Captación de agua de lluvia con filtración',
        'Inodoros alimentados por agua de lavamanos'
      ]
    },
    {
      icon: 'fas fa-microchip',
      title: 'Tecnologías avanzadas',
      description: 'Sistemas sofisticados que requieren instalación profesional.',
      features: [
        'Sistemas integrados de reciclaje de agua con monitoreo',
        'Biodigestores domésticos para tratamiento de aguas',
        'Sistemas de ósmosis y ultrafiltración'
      ]
    }
  ];

  guideSteps = [
    {
      title: 'Evalúa tu consumo',
      description: 'Identifica dónde usas más agua y qué puedes reutilizar'
    },
    {
      title: 'Elige un sistema',
      description: 'Selecciona un método básico para empezar'
    },
    {
      title: 'Prepara materiales',
      description: 'Consigue lo necesario para tu sistema'
    },
    {
      title: 'Instala',
      description: 'Sigue la guía específica para tu sistema'
    },
    {
      title: 'Monitorea',
      description: 'Controla el sistema y mide tus ahorros'
    }
  ];

  waterUses = [
    { icon: 'fas fa-seedling', title: 'Riego de jardín', description: 'Ideal para plantas y césped' },
    { icon: 'fas fa-toilet', title: 'Inodoros', description: 'Descarga de sanitarios' },
    { icon: 'fas fa-broom', title: 'Limpieza', description: 'Pisos y superficies' },
    { icon: 'fas fa-car', title: 'Lavado de coches', description: 'Exterior de vehículos' },
    { icon: 'fas fa-hammer', title: 'Construcción', description: 'Mezclas y limpieza' }
  ];

  compatibilityData = [
    { source: 'Ducha/Bañera', uses: ['check', 'check', 'check', 'check', 'check'] },
    { source: 'Lavadora', uses: ['check', 'check', 'check', 'check', 'check'] },
    { source: 'Lavamanos', uses: ['check', 'check', 'check', 'check', 'check'] },
    { source: 'Agua de lluvia', uses: ['check', 'check', 'check', 'check', 'check'] },
    { source: 'Cocina (fregadero)', uses: ['check', 'check', 'warning', 'warning', 'check'] },
    { source: 'Inodoro', uses: ['times', 'times', 'times', 'times', 'times'] }
  ];

  precautions = [
    'No almacene agua gris por más de 24 horas para evitar el crecimiento bacteriano.',
    'Evite el contacto directo con agua gris sin tratar, use guantes si es necesario.',
    'No use agua gris para regar verduras u hortalizas que se consuman crudas.',
    'Asegúrese de que los sistemas de reúso estén correctamente etiquetados.',
    'Evite el uso de jabones o productos con boro, sodio, cloro y boro si planea reutilizar esa agua para riego.'
  ];

  benefits = {
    environmental: [
      'Reducción de la presión sobre fuentes de agua dulce',
      'Menor contaminación de cuerpos de agua',
      'Disminución de la huella hídrica'
    ],
    economic: [
      'Reducción en facturas de agua potable',
      'Menor gasto en mantenimiento de infraestructuras',
      'Valorización de la propiedad con sistemas eficientes'
    ]
  };

  ngOnInit(): void {
    // Inicializar consejos
    this.currentTip = this.tips[0];
    let tipIndex = 0;
    
    // Rotar consejos cada 6 segundos (aumentado de 5 para dar tiempo a leer)
    setInterval(() => {
      tipIndex = (tipIndex + 1) % this.tips.length;
      this.currentTip = this.tips[tipIndex];
    }, 6000);

    // Implementar smooth scroll para la navegación flotante
    this.setupSmoothScrolling();
  }

  ngAfterViewInit(): void {
    // Registrar plugins de GSAP
    gsap.registerPlugin(ScrollTrigger);
    
    // Animaciones para la sección hero
    this.animateHeroSection();
    
    // Animaciones para las secciones
    this.animateSections();

    // Configurar navegación flotante activa
    this.setupActiveNavigation();
  }

  private setupSmoothScrolling(): void {
    document.addEventListener('DOMContentLoaded', () => {
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const href = item.getAttribute('href');
          if (href) {
            const targetElement = document.querySelector(href);
            if (targetElement) {
              targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }
          }
        });
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

  private animateHeroSection(): void {
    gsap.from(".hero-title", {
      opacity: 0,
      y: 30,
      duration: 1,
      ease: "power3.out"
    });
    
    gsap.from(".hero-description", {
      opacity: 0,
      y: 20,
      duration: 0.8,
      delay: 0.3,
      ease: "power2.out"
    });
    
    gsap.from(".benefit-card", {
      opacity: 0,
      y: 30,
      duration: 0.6,
      stagger: 0.1,
      delay: 0.6,
      ease: "back.out(1.7)"
    });
    
    gsap.from(".water-drop-message", {
      opacity: 0,
      y: 20,
      duration: 0.5,
      delay: 0.9,
      ease: "elastic.out(1, 0.5)"
    });
  }

  private animateSections(): void {
    // Animación para todas las secciones
    gsap.utils.toArray("section").forEach((section: any) => {
      gsap.from(section, {
        opacity: 0,
        y: 50,
        duration: 0.8,
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          toggleActions: "play none none none"
        }
      });
    });

    // Animaciones específicas para elementos dentro de secciones
    this.animateCycleSteps();
    this.animateMethodCards();
    this.animateGuideSteps();
    this.animateWaterUses();
    this.animateBlogCards();
  }

  private animateCycleSteps(): void {
    gsap.utils.toArray(".cycle-step").forEach((step: any, index: number) => {
      gsap.from(step, {
        opacity: 0,
        x: index % 2 === 0 ? -50 : 50,
        duration: 0.6,
        scrollTrigger: {
          trigger: step,
          start: "top 75%"
        }
      });
    });
  }

  private animateMethodCards(): void {
    gsap.utils.toArray(".method-card").forEach((card: any, index: number) => {
      gsap.from(card, {
        opacity: 0,
        y: 50,
        duration: 0.5,
        delay: index * 0.1,
        scrollTrigger: {
          trigger: card,
          start: "top 80%"
        }
      });
    });
  }

  private animateGuideSteps(): void {
    gsap.utils.toArray(".step-card").forEach((step: any, index: number) => {
      gsap.from(step, {
        opacity: 0,
        scale: 0.8,
        duration: 0.4,
        delay: index * 0.1,
        scrollTrigger: {
          trigger: step,
          start: "top 85%"
        }
      });
    });
  }

  private animateWaterUses(): void {
    gsap.utils.toArray(".use-card").forEach((card: any, index: number) => {
      gsap.from(card, {
        opacity: 0,
        rotationY: 90,
        duration: 0.5,
        delay: index * 0.1,
        scrollTrigger: {
          trigger: card,
          start: "top 85%"
        }
      });
    });
  }

  private animateBlogCards(): void {
    gsap.utils.toArray(".blog-card").forEach((card: any, index: number) => {
      gsap.from(card, {
        opacity: 0,
        y: 30,
        duration: 0.6,
        delay: index * 0.1,
        scrollTrigger: {
          trigger: card,
          start: "top 85%"
        }
      });
    });
  }

  // Métodos para la calculadora
  calculateSavings(): void {
    if (!this.people || !this.consumption || !this.reuseFrequency || !this.systemType || !this.waterPrice) {
      return;
    }

    this.loading = true;
    this.showResults = false;

    // Simular carga (opcional, para UX)
    setTimeout(() => {
      const systemEfficiency = this.getSystemEfficiency();
      const dailyConsumption = this.consumption;
      const reusablePercentage = 0.7; // 70% del agua puede ser potencialmente reutilizada
      
      // Calcular agua que se puede reutilizar por día
      const dailyReusableWater = dailyConsumption * reusablePercentage;
      
      // Calcular ahorro según el sistema y frecuencia
      const dailySaved = (dailyReusableWater * systemEfficiency) * (this.reuseFrequency / 7);
      
      // Calcular ahorros en diferentes períodos
      this.calculationResults.weeklySaved = dailySaved * 7;
      this.calculationResults.monthlySaved = dailySaved * 30;
      this.calculationResults.annualSaved = dailySaved * 365;
      
      // Calcular ahorro económico anual
      const annualSavedM3 = this.calculationResults.annualSaved / 1000; // Convertir a m³
      this.calculationResults.moneySaved = annualSavedM3 * this.waterPrice;
      
      this.loading = false;
      this.showResults = true;

      // Animar la aparición de los resultados
      setTimeout(() => {
        gsap.from(".result-card", {
          opacity: 0,
          y: 20,
          duration: 0.5,
          stagger: 0.1,
          ease: "back.out(1.7)"
        });
      }, 100);
    }, 1500);
  }

  private getSystemEfficiency(): number {
    switch (this.systemType) {
      case 'basic':
        return 0.15; // 15%
      case 'intermediate':
        return 0.30; // 30%
      case 'advanced':
        return 0.50; // 50%
      default:
        return 0.15;
    }
  }

  resetCalculator(): void {
    this.people = 4;
    this.consumption = 800;
    this.reuseFrequency = 7;
    this.systemType = '';
    this.waterPrice = 0;
    this.showResults = false;
    this.loading = false;
    
    this.calculationResults = {
      weeklySaved: 0,
      monthlySaved: 0,
      annualSaved: 0,
      moneySaved: 0
    };
  }

  getMoneyFormat(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Método para obtener el icono correcto según compatibilidad
  getCompatibilityIcon(useType: string): { icon: string, color: string } {
    switch(useType) {
      case 'check':
        return { icon: 'fas fa-check', color: 'text-green-500' };
      case 'check*':
        return { icon: 'fas fa-check', color: 'text-green-500' };
      case 'warning':
        return { icon: 'fas fa-exclamation-triangle', color: 'text-yellow-500' };
      case 'times':
        return { icon: 'fas fa-times', color: 'text-red-500' };
      default:
        return { icon: 'fas fa-question', color: 'text-gray-500' };
    }
  }
}