// src/app/pages/tienda/tienda.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { TiendaService, Producto, Categoria, Puntos } from '../../services/tienda.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tienda.component.html',
  styleUrls: ['./tienda.component.css']
})
export class TiendaComponent implements OnInit, OnDestroy {
  
  // ===== DATOS =====
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  categorias: Categoria[] = [];
  puntos: Puntos | null = null;
  misCompras: any[] = [];
  
  // ===== ESTADO =====
  cargando: boolean = true;
  comprando: boolean = false;
  error: string | null = null;
  
  // ===== USUARIO =====
  usuario: any = null;
  fotoUsuario: string | null = null;
  
  // ===== FILTROS =====
  categoriaActiva: number | null = null;
  soloDestacados: boolean = false;
  ordenamiento: string = 'recientes';
  
  // ===== MODAL =====
  mostrarModalCompra: boolean = false;
  productoSeleccionado: Producto | null = null;
  
  // ===== SUBSCRIPCIONES =====
  private subscriptions: Subscription[] = [];
  
  constructor(
    private tiendaService: TiendaService,
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.cargarDatosIniciales();
    this.suscribirPuntos();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  // ===== INICIALIZACIÓN =====
  
  private async cargarDatosIniciales(): Promise<void> {
    this.cargando = true;
    this.error = null;
    
    try {
      // Cargar datos del usuario
      await this.cargarUsuario();
      
      // Cargar datos en paralelo
      await Promise.all([
        this.cargarCategorias(),
        this.cargarProductos(),
        this.cargarPuntos(),
        this.cargarMisCompras()
      ]);
      
    } catch (error: any) {
      console.error('Error cargando datos:', error);
      this.error = error.error?.mensaje || 'Error al cargar la tienda';
    } finally {
      this.cargando = false;
    }
  }
  
  private async cargarUsuario(): Promise<void> {
    return new Promise((resolve) => {
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        try {
          this.usuario = JSON.parse(usuarioGuardado);
          this.fotoUsuario = this.usuario?.foto || null;
        } catch (error) {
          console.error('Error parseando usuario:', error);
        }
      }
      
      // Intentar obtener del servicio si está disponible
      if (this.authService.usuario$) {
        const sub = this.authService.usuario$.subscribe({
          next: (user: any) => {
            if (user) {
              this.usuario = user;
              this.fotoUsuario = user?.foto || null;
            }
            resolve();
          },
          error: (error: any) => {
            console.error('Error obteniendo usuario:', error);
            resolve();
          }
        });
        this.subscriptions.push(sub);
      } else {
        resolve();
      }
    });
  }
  
  private suscribirPuntos(): void {
    const sub = this.tiendaService.puntos$.subscribe({
      next: (puntos) => {
        this.puntos = puntos;
      }
    });
    this.subscriptions.push(sub);
  }
  
  // ===== CARGA DE DATOS =====
  
  private cargarCategorias(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.tiendaService.obtenerCategorias().subscribe({
        next: (response) => {
          if (response.success) {
            this.categorias = response.data;
          }
          resolve();
        },
        error: (error) => {
          console.error('Error cargando categorías:', error);
          reject(error);
        }
      });
    });
  }
  
  private cargarProductos(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.tiendaService.obtenerProductos().subscribe({
        next: (response) => {
          if (response.success) {
            this.productos = response.data;
            this.aplicarFiltros();
          }
          resolve();
        },
        error: (error) => {
          console.error('Error cargando productos:', error);
          reject(error);
        }
      });
    });
  }
  
  private cargarPuntos(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.tiendaService.obtenerPuntos().subscribe({
        next: (response) => {
          if (response.success) {
            this.puntos = response.puntos;
          }
          resolve();
        },
        error: (error) => {
          console.error('Error cargando puntos:', error);
          reject(error);
        }
      });
    });
  }
  
  private cargarMisCompras(): Promise<void> {
    return new Promise((resolve) => {
      this.tiendaService.obtenerMisCompras().subscribe({
        next: (response) => {
          if (response.success) {
            this.misCompras = response.data;
          }
          resolve();
        },
        error: (error) => {
          console.error('Error cargando compras:', error);
          resolve(); // No es crítico
        }
      });
    });
  }
  
  // ===== FILTROS Y ORDENAMIENTO =====
  
  filtrarPorCategoria(categoriaId: number | null): void {
    this.categoriaActiva = categoriaId;
    this.aplicarFiltros();
  }
  
  toggleDestacados(): void {
    this.soloDestacados = !this.soloDestacados;
    this.aplicarFiltros();
  }
  
  aplicarOrdenamiento(): void {
    this.aplicarFiltros();
  }
  
  private aplicarFiltros(): void {
    let resultado = [...this.productos];
    
    // Filtrar por categoría
    if (this.categoriaActiva !== null) {
      resultado = resultado.filter(p => p.categoria_id === this.categoriaActiva);
    }
    
    // Filtrar destacados
    if (this.soloDestacados) {
      resultado = resultado.filter(p => p.destacado);
    }
    
    // Ordenar
    switch (this.ordenamiento) {
      case 'precio_asc':
        resultado.sort((a, b) => a.precio_puntos - b.precio_puntos);
        break;
      case 'precio_desc':
        resultado.sort((a, b) => b.precio_puntos - a.precio_puntos);
        break;
      case 'nombre':
        resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'recientes':
      default:
        // Ya viene ordenado por fecha de creación
        break;
    }
    
    this.productosFiltrados = resultado;
  }
  
  // ===== COMPRA DE PRODUCTOS =====
  
  comprarProducto(producto: Producto): void {
    // Validaciones previas
    if (producto.ya_comprado) {
      this.error = 'Ya has comprado este producto';
      return;
    }
    
    if (!this.puntos || this.puntos.disponible < producto.precio_puntos) {
      this.error = 'No tienes suficientes puntos';
      return;
    }
    
    if (producto.stock !== null && producto.stock <= 0) {
      this.error = 'Producto sin stock';
      return;
    }
    
    // Mostrar modal de confirmación
    this.productoSeleccionado = producto;
    this.mostrarModalCompra = true;
  }
  
  confirmarCompra(): void {
    if (!this.productoSeleccionado) return;
    
    this.comprando = true;
    this.error = null;
    
    this.tiendaService.realizarCompra(this.productoSeleccionado.id).subscribe({
      next: (response) => {
        if (response.success) {
          // Actualizar producto como comprado
          const producto = this.productos.find(p => p.id === this.productoSeleccionado!.id);
          if (producto) {
            producto.ya_comprado = true;
            if (producto.stock !== null) {
              producto.stock--;
            }
          }
          
          // Recargar datos
          this.cargarPuntos();
          this.cargarMisCompras();
          this.aplicarFiltros();
          
          // Cerrar modal
          this.cerrarModalCompra();
          
          // Mostrar mensaje de éxito
          this.mostrarMensajeExito('¡Compra realizada con éxito!');
        }
      },
      error: (error) => {
        console.error('Error en compra:', error);
        this.error = error.error?.mensaje || 'Error al realizar la compra';
      },
      complete: () => {
        this.comprando = false;
      }
    });
  }
  
  cerrarModalCompra(): void {
    this.mostrarModalCompra = false;
    this.productoSeleccionado = null;
  }
  
  // ===== NAVEGACIÓN =====
  
  verHistorialPuntos(): void {
    this.router.navigate(['/perfil'], { queryParams: { tab: 'puntos' } });
  }
  
  verTodasCompras(): void {
    this.router.navigate(['/perfil'], { queryParams: { tab: 'compras' } });
  }
  
  // ===== UTILIDADES =====
  
  obtenerIconoTipo(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'titulo': 'fas fa-crown',
      'rango': 'fas fa-shield-alt',
      'documento': 'fas fa-file-pdf',
      'video': 'fas fa-video',
      'curso': 'fas fa-graduation-cap',
      'recurso': 'fas fa-download',
      'avatar': 'fas fa-user-circle',
      'tema': 'fas fa-palette'
    };
    return iconos[tipo] || 'fas fa-box';
  }
  
  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const opciones: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('es-ES', opciones);
  }
  
  descargarRecurso(url: string, nombre: string): void {
    if (!url) {
      this.error = 'No hay archivo disponible para descargar';
      return;
    }
    
    // Crear elemento temporal para descargar
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.mostrarMensajeExito('Descarga iniciada');
  }
  
  private mostrarMensajeExito(mensaje: string): void {
    // Aquí podrías integrar un servicio de notificaciones toast
    console.log('✅', mensaje);
    
    // Mostrar temporalmente en el error (reutilizando el componente)
    const errorOriginal = this.error;
    this.error = null;
    
    setTimeout(() => {
      this.error = errorOriginal;
    }, 3000);
  }
}