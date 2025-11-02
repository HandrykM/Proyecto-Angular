import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then(m => m.Home) }, // Página principal (pública)
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./pages/register/register').then(m => m.Register) },
  { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPassword) },
  { path: 'reset-password', loadComponent: () => import('./pages/reset-password/reset-password').then(m => m.ResetPassword) },

  // 🔒 Rutas protegidas por AuthGuard
  { path: 'inicio', loadComponent: () => import('./pages/inicio/inicio').then(m => m.Inicio), canActivate: [AuthGuard] },
  { path: 'modulos', loadComponent: () => import('./pages/modulos/modulos').then(m => m.Modulos), canActivate: [AuthGuard] },
  { path: 'modulos/:id', loadComponent: () => import('./pages/modulos-detalle/modulos-detalle').then(m => m.ModulosDetalle), canActivate: [AuthGuard] },
  { path: 'biblioteca', loadComponent: () => import('./pages/biblioteca/biblioteca').then(m => m.Biblioteca), canActivate: [AuthGuard] },
  
  // 🎯 RUTAS DE ACTIVIDADES
  { path: 'actividades', loadComponent: () => import('./pages/actividades/actividades').then(m => m.ActividadesComponent), canActivate: [AuthGuard] },
  { path: 'actividades/simulador-agua', loadComponent: () => import('./pages/actividades/simulador-agua/simulador-agua').then(m => m.SimuladorAguaComponent), canActivate: [AuthGuard] },
  { path: 'actividades/juego-reutilizable', loadComponent: () => import('./pages/actividades/juego-reutilizable/juego-reutilizable.component').then(m => m.JuegoReutilizableComponent), canActivate: [AuthGuard] },
  { path: 'actividades/trivia-basica', loadComponent: () => import('./pages/actividades/trivia-basica/trivia-basica').then(m => m.TriviaBasicaComponent), canActivate: [AuthGuard] },
  { path: 'actividades/trivia-media', loadComponent: () => import('./pages/actividades/trivia-media/trivia-media').then(m => m.TriviaMediaComponent), canActivate: [AuthGuard] },
  { path: 'actividades/juego-gogo', loadComponent: () => import('./pages/actividades/juego-gogo/juego-gogo').then(m => m.JuegoGogoComponent), canActivate: [AuthGuard] },
  
  {
  path: 'lectura/:idModulo/:idLectura',
  loadComponent: () => import('./pages/lectura-viewer/lectura-viewer').then(m => m.LecturaViewerComponent),
  canActivate: [AuthGuard]
},
{
    path: 'tienda',
    loadComponent: () => import('./pages/tienda/tienda.component').then(m => m.TiendaComponent),
    canActivate: [AuthGuard]
  },
  // Si tienes un componente para quiz rápido, descomenta la siguiente línea y crea el archivo si no existe:
  // { path: 'actividades/quiz-rapido', loadComponent: () => import('./pages/actividades/quiz-rapido/quiz-rapido').then(m => m.QuizRapidoComponent), canActivate: [AuthGuard] },
  { 
  path: 'admin', 
  loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent), 
  canActivate: [AuthGuard] 
},
  
  { path: 'perfil', loadComponent: () => import('./components/perfil/perfil').then(m => m.Perfil), canActivate: [AuthGuard] },

  // Redirección por defecto
  { path: '**', redirectTo: '/' }
];