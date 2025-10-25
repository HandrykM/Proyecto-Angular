// src/app/services/i18n.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Language = 'es' | 'en' | 'pt';

export interface Translation {
  [key: string]: string | Translation;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private currentLanguageSubject = new BehaviorSubject<Language>('es');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  private translations: { [key in Language]: Translation } = {
    es: {
      // Navegación
      nav: {
        home: 'Inicio',
        modules: 'Módulos',
        library: 'Biblioteca',
        activities: 'Actividades',
        profile: 'Perfil',
        admin: 'Admin',
        logout: 'Cerrar sesión'
      },
      
      // Home
      home: {
        welcome: 'Bienvenido a HydroSave',
        subtitle: 'Aprende sobre reutilización del agua',
        getStarted: 'Comenzar',
        login: 'Iniciar sesión',
        register: 'Registrarse',
        features: {
          title: 'Características',
          interactive: 'Aprendizaje Interactivo',
          interactiveDesc: 'Aprende con módulos dinámicos y actividades prácticas',
          certified: 'Certificaciones',
          certifiedDesc: 'Obtén certificados al completar los cursos',
          community: 'Comunidad',
        // Notas y textos específicos
        profileNotes: {
          notesTitle: 'Mis Notas Personales',
          notesDesc: 'Escribe tus reflexiones, ideas clave o preguntas sobre esta lectura'
        },
          communityDesc: 'Únete a miles de estudiantes comprometidos'
        }
      },

      // Auth
      auth: {
        login: 'Iniciar sesión',
        register: 'Registrarse',
        email: 'Correo electrónico',
        password: 'Contraseña',
        confirmPassword: 'Confirmar contraseña',
        name: 'Nombre',
        forgotPassword: '¿Olvidaste tu contraseña?',
        rememberMe: 'Recordarme',
        noAccount: '¿No tienes cuenta?',
        hasAccount: '¿Ya tienes cuenta?',
        resetPassword: 'Restablecer contraseña',
        sendResetLink: 'Enviar enlace',
        backToLogin: 'Volver al inicio de sesión'
      },

      // Dashboard
      dashboard: {
        welcome: 'Bienvenido de nuevo',
        myProgress: 'Mi Progreso',
        completedModules: 'Módulos Completados',
        totalPoints: 'Puntos Totales',
        currentStreak: 'Racha Actual',
        days: 'días',
        continueWhere: 'Continuar donde lo dejaste',
        recommendedActivities: 'Actividades Recomendadas',
        recentAchievements: 'Logros Recientes'
      },

      // Módulos
      modules: {
        title: 'Módulos de Aprendizaje',
        subtitle: 'Explora nuestros cursos',
        level: {
          basic: 'Básico',
          intermediate: 'Intermedio',
          advanced: 'Avanzado'
        },
        progress: 'Progreso',
        start: 'Comenzar',
        continue: 'Continuar',
        completed: 'Completado',
        lessons: 'lecciones',
        points: 'puntos',
        duration: 'Duración estimada'
      },

      // Actividades
      activities: {
        title: 'Actividades Interactivas',
        subtitle: 'Pon a prueba tus conocimientos',
        types: {
          quiz: 'Quiz',
          game: 'Juego',
          trivia: 'Trivia',
          simulator: 'Simulador'
        },
        difficulty: 'Dificultad',
        completedBy: 'Completado por',
        users: 'usuarios',
        startActivity: 'Iniciar actividad',
        viewResults: 'Ver resultados'
      },

      // Biblioteca
      library: {
        title: 'Biblioteca de Recursos',
        subtitle: 'Materiales de apoyo',
        search: 'Buscar recursos',
        filterBy: 'Filtrar por',
        all: 'Todos',
        videos: 'Videos',
        articles: 'Artículos',
        infographics: 'Infografías',
        guides: 'Guías',
        download: 'Descargar',
        view: 'Ver',
        author: 'Autor',
        readTime: 'Tiempo de lectura'
      },

      // Perfil
      profile: {
        title: 'Mi Perfil',
        personalInfo: 'Información Personal',
        security: 'Seguridad',
        preferences: 'Preferencias',
        statistics: 'Estadísticas',
        achievements: 'Logros',
        certificates: 'Certificados',
        account: 'Cuenta',
        editPhoto: 'Cambiar foto',
        saveChanges: 'Guardar cambios',
        changePassword: 'Cambiar contraseña',
    // Placeholder y textos auxiliares
    librarySearch: {
      placeholder: 'Buscar recursos, autores, categorías...'
    },
        currentPassword: 'Contraseña actual',
        newPassword: 'Nueva contraseña',
        language: 'Idioma',
        darkMode: 'Modo oscuro',
        fontSize: 'Tamaño de fuente',
        notifications: 'Notificaciones',
        emailNotifications: 'Notificaciones por email',
        deleteAccount: 'Eliminar cuenta',
        logoutAllDevices: 'Cerrar sesión en todos los dispositivos'
      },

      // Admin
      admin: {
        dashboard: 'Panel de Control',
        users: 'Usuarios',
        modules: 'Módulos',
        activities: 'Actividades',
        library: 'Biblioteca',
        statistics: 'Estadísticas',
        totalUsers: 'Total de Usuarios',
        activeModules: 'Módulos Activos',
        completedActivities: 'Actividades Completadas',
        addNew: 'Agregar Nuevo',
        edit: 'Editar',
        delete: 'Eliminar',
        save: 'Guardar',
        cancel: 'Cancelar'
      },

      // Común
      common: {
        loading: 'Cargando',
        error: 'Error',
        success: 'Éxito',
        warning: 'Advertencia',
        confirm: 'Confirmar',
        cancel: 'Cancelar',
        save: 'Guardar',
        delete: 'Eliminar',
        edit: 'Editar',
        close: 'Cerrar',
        back: 'Volver',
        next: 'Siguiente',
        previous: 'Anterior',
        search: 'Buscar',
        filter: 'Filtrar',
        sort: 'Ordenar',
        viewAll: 'Ver todo',
        viewMore: 'Ver más',
        noResults: 'No se encontraron resultados',
        comingSoon: 'Próximamente'
      },

      // Mensajes
      messages: {
        loginSuccess: 'Inicio de sesión exitoso',
        loginError: 'Error al iniciar sesión',
        registerSuccess: 'Registro exitoso',
        saveSuccess: 'Guardado correctamente',
        deleteSuccess: 'Eliminado correctamente',
        updateSuccess: 'Actualizado correctamente',
        errorOccurred: 'Ocurrió un error',
        confirmDelete: '¿Estás seguro de que deseas eliminar?',
        unsavedChanges: 'Tienes cambios sin guardar'
      }
    },

    en: {
      nav: {
        home: 'Home',
        modules: 'Modules',
        library: 'Library',
        activities: 'Activities',
        profile: 'Profile',
        admin: 'Admin',
        logout: 'Logout'
      },
      
      home: {
        welcome: 'Welcome to HydroSave',
        subtitle: 'Learn about water reuse',
        getStarted: 'Get Started',
        login: 'Login',
        register: 'Register',
        features: {
          title: 'Features',
          interactive: 'Interactive Learning',
          interactiveDesc: 'Learn with dynamic modules and practical activities',
          certified: 'Certifications',
          certifiedDesc: 'Get certificates upon completing courses',
          community: 'Community',
        profileNotes: {
          notesTitle: 'My Personal Notes',
          notesDesc: 'Write your reflections, key ideas or questions about this reading'
        },
          communityDesc: 'Join thousands of committed students'
        }
      },

      auth: {
        login: 'Login',
        register: 'Register',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        name: 'Name',
        forgotPassword: 'Forgot password?',
        rememberMe: 'Remember me',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
        resetPassword: 'Reset Password',
        sendResetLink: 'Send Reset Link',
        backToLogin: 'Back to Login'
      },

      dashboard: {
        welcome: 'Welcome back',
        myProgress: 'My Progress',
        completedModules: 'Completed Modules',
        totalPoints: 'Total Points',
        currentStreak: 'Current Streak',
        days: 'days',
        continueWhere: 'Continue where you left off',
        recommendedActivities: 'Recommended Activities',
        recentAchievements: 'Recent Achievements'
      },

      modules: {
        title: 'Learning Modules',
        subtitle: 'Explore our courses',
        level: {
          basic: 'Basic',
          intermediate: 'Intermediate',
          advanced: 'Advanced'
        },
        progress: 'Progress',
        start: 'Start',
        continue: 'Continue',
        completed: 'Completed',
        lessons: 'lessons',
        points: 'points',
        duration: 'Estimated duration'
      },

      activities: {
        title: 'Interactive Activities',
        subtitle: 'Test your knowledge',
        types: {
          quiz: 'Quiz',
          game: 'Game',
          trivia: 'Trivia',
          simulator: 'Simulator'
        },
        difficulty: 'Difficulty',
        completedBy: 'Completed by',
        users: 'users',
        startActivity: 'Start activity',
        viewResults: 'View results'
      },

      library: {
        title: 'Resource Library',
        subtitle: 'Support materials',
        search: 'Search resources',
        filterBy: 'Filter by',
        all: 'All',
        videos: 'Videos',
        articles: 'Articles',
        infographics: 'Infographics',
        guides: 'Guides',
        download: 'Download',
        view: 'View',
    librarySearch: {
      placeholder: 'Search resources, authors, categories...'
    },
        author: 'Author',
        readTime: 'Read time'
      },

      profile: {
        title: 'My Profile',
        personalInfo: 'Personal Information',
        security: 'Security',
        preferences: 'Preferences',
        statistics: 'Statistics',
        achievements: 'Achievements',
        certificates: 'Certificates',
        account: 'Account',
        editPhoto: 'Change photo',
        saveChanges: 'Save changes',
        changePassword: 'Change password',
        currentPassword: 'Current password',
        newPassword: 'New password',
        language: 'Language',
        darkMode: 'Dark mode',
        fontSize: 'Font size',
        notifications: 'Notifications',
        emailNotifications: 'Email notifications',
        deleteAccount: 'Delete account',
        logoutAllDevices: 'Logout from all devices'
      },

      admin: {
        dashboard: 'Dashboard',
        users: 'Users',
        modules: 'Modules',
        activities: 'Activities',
        library: 'Library',
        statistics: 'Statistics',
        totalUsers: 'Total Users',
        activeModules: 'Active Modules',
        completedActivities: 'Completed Activities',
        addNew: 'Add New',
        edit: 'Edit',
        delete: 'Delete',
        save: 'Save',
        cancel: 'Cancel'
      },

      common: {
        loading: 'Loading',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        confirm: 'Confirm',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        viewAll: 'View all',
        viewMore: 'View more',
        noResults: 'No results found',
        comingSoon: 'Coming soon'
      },

      messages: {
        loginSuccess: 'Login successful',
        loginError: 'Login error',
        registerSuccess: 'Registration successful',
        saveSuccess: 'Saved successfully',
        deleteSuccess: 'Deleted successfully',
        updateSuccess: 'Updated successfully',
        errorOccurred: 'An error occurred',
        confirmDelete: 'Are you sure you want to delete?',
        unsavedChanges: 'You have unsaved changes'
      }
    },

    pt: {
      nav: {
        home: 'Início',
        modules: 'Módulos',
        library: 'Biblioteca',
        activities: 'Atividades',
        profile: 'Perfil',
        admin: 'Admin',
        logout: 'Sair'
      },
      
      home: {
        welcome: 'Bem-vindo ao HydroSave',
        subtitle: 'Aprenda sobre reutilização de água',
        getStarted: 'Começar',
        login: 'Entrar',
        register: 'Registrar',
        features: {
          title: 'Recursos',
          interactive: 'Aprendizagem Interativa',
          interactiveDesc: 'Aprenda com módulos dinâmicos e atividades práticas',
          certified: 'Certificações',
          certifiedDesc: 'Obtenha certificados ao concluir os cursos',
          community: 'Comunidade',
          communityDesc: 'Junte-se a milhares de estudantes comprometidos'
        }
      },

      auth: {
        login: 'Entrar',
        register: 'Registrar',
        email: 'E-mail',
        password: 'Senha',
        confirmPassword: 'Confirmar senha',
        name: 'Nome',
        forgotPassword: 'Esqueceu a senha?',
        rememberMe: 'Lembrar-me',
        noAccount: 'Não tem uma conta?',
        hasAccount: 'Já tem uma conta?',
        resetPassword: 'Redefinir senha',
        sendResetLink: 'Enviar link',
        backToLogin: 'Voltar ao login'
      },

      dashboard: {
        welcome: 'Bem-vindo de volta',
        myProgress: 'Meu Progresso',
        completedModules: 'Módulos Concluídos',
        totalPoints: 'Pontos Totais',
        currentStreak: 'Sequência Atual',
        days: 'dias',
        continueWhere: 'Continue de onde parou',
        recommendedActivities: 'Atividades Recomendadas',
        recentAchievements: 'Conquistas Recentes'
      },

      modules: {
        title: 'Módulos de Aprendizagem',
        subtitle: 'Explore nossos cursos',
        level: {
          basic: 'Básico',
          intermediate: 'Intermediário',
          advanced: 'Avançado'
        },
        progress: 'Progresso',
        start: 'Começar',
        continue: 'Continuar',
        completed: 'Concluído',
        lessons: 'lições',
        points: 'pontos',
        duration: 'Duração estimada'
      },

      activities: {
        title: 'Atividades Interativas',
        subtitle: 'Teste seus conhecimentos',
        types: {
          quiz: 'Quiz',
          game: 'Jogo',
          trivia: 'Trivia',
          simulator: 'Simulador'
        },
        difficulty: 'Dificuldade',
        completedBy: 'Concluído por',
        users: 'usuários',
        startActivity: 'Iniciar atividade',
        viewResults: 'Ver resultados'
      },

      library: {
        title: 'Biblioteca de Recursos',
        subtitle: 'Materiais de apoio',
        search: 'Buscar recursos',
        filterBy: 'Filtrar por',
        all: 'Todos',
        videos: 'Vídeos',
        articles: 'Artigos',
        infographics: 'Infográficos',
        guides: 'Guias',
        download: 'Baixar',
        view: 'Ver',
        author: 'Autor',
        readTime: 'Tempo de leitura'
      },

      profile: {
        title: 'Meu Perfil',
        personalInfo: 'Informações Pessoais',
        security: 'Segurança',
        preferences: 'Preferências',
        statistics: 'Estatísticas',
        achievements: 'Conquistas',
        certificates: 'Certificados',
        account: 'Conta',
        editPhoto: 'Alterar foto',
        saveChanges: 'Salvar alterações',
        changePassword: 'Alterar senha',
        currentPassword: 'Senha atual',
        newPassword: 'Nova senha',
        language: 'Idioma',
        darkMode: 'Modo escuro',
        fontSize: 'Tamanho da fonte',
        notifications: 'Notificações',
        emailNotifications: 'Notificações por e-mail',
        deleteAccount: 'Excluir conta',
        logoutAllDevices: 'Sair de todos os dispositivos'
      },

      admin: {
        dashboard: 'Painel de Controle',
        users: 'Usuários',
        modules: 'Módulos',
        activities: 'Atividades',
        library: 'Biblioteca',
        statistics: 'Estatísticas',
        totalUsers: 'Total de Usuários',
        activeModules: 'Módulos Ativos',
        completedActivities: 'Atividades Concluídas',
        addNew: 'Adicionar Novo',
        edit: 'Editar',
        delete: 'Excluir',
        save: 'Salvar',
        cancel: 'Cancelar'
      },

      common: {
        loading: 'Carregando',
        error: 'Erro',
        success: 'Sucesso',
        warning: 'Aviso',
        confirm: 'Confirmar',
        cancel: 'Cancelar',
        save: 'Salvar',
        delete: 'Excluir',
        edit: 'Editar',
        close: 'Fechar',
        back: 'Voltar',
        next: 'Próximo',
        previous: 'Anterior',
        search: 'Buscar',
        filter: 'Filtrar',
        sort: 'Ordenar',
        viewAll: 'Ver tudo',
        viewMore: 'Ver mais',
        noResults: 'Nenhum resultado encontrado',
        comingSoon: 'Em breve'
      },

      messages: {
        loginSuccess: 'Login bem-sucedido',
        loginError: 'Erro ao fazer login',
        registerSuccess: 'Registro bem-sucedido',
        saveSuccess: 'Salvo com sucesso',
        deleteSuccess: 'Excluído com sucesso',
        updateSuccess: 'Atualizado com sucesso',
        errorOccurred: 'Ocorreu um erro',
        confirmDelete: 'Tem certeza de que deseja excluir?',
        unsavedChanges: 'Você tem alterações não salvas'
      }
    }
  };

  constructor() {
    // Cargar idioma guardado
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang && ['es', 'en', 'pt'].includes(savedLang)) {
      this.currentLanguageSubject.next(savedLang);
      this.setHtmlLang(savedLang);
    }
  }

  getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  setLanguage(lang: Language): void {
    this.currentLanguageSubject.next(lang);
    localStorage.setItem('app_language', lang);
    this.setHtmlLang(lang);
  }

  private setHtmlLang(lang: Language): void {
    document.documentElement.lang = lang;
  }

  translate(key: string): string {
    const lang = this.getCurrentLanguage();
    const keys = key.split('.');
    let value: any = this.translations[lang];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key} for language: ${lang}`);
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  t(key: string): string {
    return this.translate(key);
  }
}