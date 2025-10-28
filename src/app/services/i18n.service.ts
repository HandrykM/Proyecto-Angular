// src/app/services/i18n.service.ts - VERSIÓN COMPLETA
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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

      // Perfil - NUEVAS TRADUCCIONES
      profile: {
        title: 'Mi Perfil',
        personalInfo: 'Información Personal',
        security: 'Seguridad',
        preferences: 'Preferencias',
        statistics: 'Estadísticas',
        achievements: 'Logros',
        certificates: 'Certificados',
        account: 'Cuenta',
        
        // Información Personal
        name: 'Nombre de usuario',
        fullName: 'Nombre completo',
        email: 'Correo electrónico',
        phone: 'Teléfono',
        username: 'Nombre de usuario',
        editPhoto: 'Cambiar foto',
        saveChanges: 'Guardar cambios',
        
        // Seguridad
        changePassword: 'Cambiar contraseña',
        currentPassword: 'Contraseña actual',
        newPassword: 'Nueva contraseña',
        confirmPassword: 'Confirmar contraseña',
        sessionHistory: 'Historial de sesiones',
        activeSessions: 'Sesiones activas',
        currentSession: 'Actual',
        closeSession: 'Cerrar',
        
        // Preferencias
        language: 'Idioma',
        darkMode: 'Modo oscuro',
        fontSize: 'Tamaño de fuente',
        notifications: 'Notificaciones',
        emailNotifications: 'Notificaciones por email',
        smsNotifications: 'Notificaciones por SMS',
        pushNotifications: 'Notificaciones push',
        reminders: 'Recordatorios de estudio',
        achievementNotifs: 'Notificaciones de logros',
        
        // Estadísticas
        totalStudyTime: 'Tiempo total de estudio',
        completedModules: 'Módulos completados',
        completedActivities: 'Actividades completadas',
        totalPoints: 'Puntos totales',
        currentStreak: 'Racha actual',
        lastActivity: 'Última actividad',
        days: 'días',
        activityHistory: 'Historial de Actividad',
        
        // Filtros
        all: 'Todos',
        module: 'Módulo',
        activity: 'Actividad',
        library: 'Biblioteca',
        
        // Logros
        achievementsObtained: 'Logros obtenidos',
        noAchievements: 'Aún no tienes logros. ¡Sigue estudiando para conseguir tus primeros logros!',
        
        // Certificados
        certificatesObtained: 'Certificados obtenidos',
        certificateLocked: 'Certificado Bloqueado',
        completeAllModules: 'Completa todos los módulos del programa para desbloquear tu certificado de finalización',
        modulesCompleted: 'Módulos completados',
        download: 'Descargar',
        verified: 'Verificado',
        notVerified: 'No verificado',
        checkEligibility: 'Verificar Elegibilidad',
        checking: 'Verificando...',
        
        // Cuenta
        accountManagement: 'Gestión de Cuenta',
        logoutDescription: 'Cierra tu sesión actual en este dispositivo',
        deleteAccount: 'Eliminar cuenta',
        deleteAccountDescription: 'Elimina permanentemente tu cuenta y todos tus datos. Esta acción no se puede deshacer.',
        deleteWarning: '¡Advertencia! Se perderán todos tus datos, progreso y certificados.',
        confirmDelete: 'Para eliminar tu cuenta, escribe "ELIMINAR" en mayúsculas:'
      },

      // Módulos
      modules: {
        title: 'Módulos',
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
        duration: 'Duración estimada',
        materials: 'Materiales',
        readingNotes: 'Mis Notas',
        notesPlaceholder: 'Escribe tus notas aquí...',
        saveNote: 'Guardar nota',
        notesSaved: 'Nota guardada correctamente',
        markAsRead: 'Marcar como leída'
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
        viewResults: 'Ver resultados',
        score: 'Puntuación',
        timeSpent: 'Tiempo empleado',
        attempts: 'Intentos'
      },

      // Biblioteca
      library: {
        title: 'Biblioteca de Recursos',
        subtitle: 'Materiales de apoyo',
        search: 'Buscar recursos',
        searchPlaceholder: 'Buscar recursos, autores, categorías...',
        filterBy: 'Filtrar por',
        all: 'Todos',
        videos: 'Videos',
        articles: 'Artículos',
        infographics: 'Infografías',
        guides: 'Guías',
        download: 'Descargar',
        view: 'Ver',
        author: 'Autor',
        readTime: 'Tiempo de lectura',
        category: 'Categoría',
        level: 'Nivel'
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
        comingSoon: 'Próximamente',
        yes: 'Sí',
        no: 'No'
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
        unsavedChanges: 'Tienes cambios sin guardar',
        required: 'Este campo es obligatorio',
        invalidEmail: 'Email inválido',
        passwordMismatch: 'Las contraseñas no coinciden',
        minLength: 'Mínimo {0} caracteres',
        invalidFormat: 'Formato inválido'
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

      profile: {
        title: 'My Profile',
        personalInfo: 'Personal Information',
        security: 'Security',
        preferences: 'Preferences',
        statistics: 'Statistics',
        achievements: 'Achievements',
        certificates: 'Certificates',
        account: 'Account',
        
        name: 'Username',
        fullName: 'Full name',
        email: 'Email',
        phone: 'Phone',
        username: 'Username',
        editPhoto: 'Change photo',
        saveChanges: 'Save changes',
        
        changePassword: 'Change password',
        currentPassword: 'Current password',
        newPassword: 'New password',
        confirmPassword: 'Confirm password',
        sessionHistory: 'Session history',
        activeSessions: 'Active sessions',
        currentSession: 'Current',
        closeSession: 'Close',
        
        language: 'Language',
        darkMode: 'Dark mode',
        fontSize: 'Font size',
        notifications: 'Notifications',
        emailNotifications: 'Email notifications',
        smsNotifications: 'SMS notifications',
        pushNotifications: 'Push notifications',
        reminders: 'Study reminders',
        achievementNotifs: 'Achievement notifications',
        
        totalStudyTime: 'Total study time',
        completedModules: 'Completed modules',
        completedActivities: 'Completed activities',
        totalPoints: 'Total points',
        currentStreak: 'Current streak',
        lastActivity: 'Last activity',
        days: 'days',
        activityHistory: 'Activity History',
        
        all: 'All',
        module: 'Module',
        activity: 'Activity',
        library: 'Library',
        
        achievementsObtained: 'Achievements obtained',
        noAchievements: "You don't have achievements yet. Keep studying to earn your first achievements!",
        
        certificatesObtained: 'Certificates obtained',
        certificateLocked: 'Certificate Locked',
        completeAllModules: 'Complete all program modules to unlock your completion certificate',
        modulesCompleted: 'Modules completed',
        download: 'Download',
        verified: 'Verified',
        notVerified: 'Not verified',
        checkEligibility: 'Check Eligibility',
        checking: 'Checking...',
        
        accountManagement: 'Account Management',
        logoutDescription: 'Close your current session on this device',
        deleteAccount: 'Delete account',
        deleteAccountDescription: 'Permanently delete your account and all your data. This action cannot be undone.',
        deleteWarning: 'Warning! All your data, progress and certificates will be lost.',
        confirmDelete: 'To delete your account, type "DELETE" in capital letters:'
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
        duration: 'Estimated duration',
        materials: 'Materials',
        readingNotes: 'My Notes',
        notesPlaceholder: 'Write your notes here...',
        saveNote: 'Save note',
        notesSaved: 'Note saved successfully',
        markAsRead: 'Mark as read'
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
        viewResults: 'View results',
        score: 'Score',
        timeSpent: 'Time spent',
        attempts: 'Attempts'
      },

      library: {
        title: 'Resource Library',
        subtitle: 'Support materials',
        search: 'Search resources',
        searchPlaceholder: 'Search resources, authors, categories...',
        filterBy: 'Filter by',
        all: 'All',
        videos: 'Videos',
        articles: 'Articles',
        infographics: 'Infographics',
        guides: 'Guides',
        download: 'Download',
        view: 'View',
        author: 'Author',
        readTime: 'Read time',
        category: 'Category',
        level: 'Level'
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
        comingSoon: 'Coming soon',
        yes: 'Yes',
        no: 'No'
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
        unsavedChanges: 'You have unsaved changes',
        required: 'This field is required',
        invalidEmail: 'Invalid email',
        passwordMismatch: 'Passwords do not match',
        minLength: 'Minimum {0} characters',
        invalidFormat: 'Invalid format'
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

      profile: {
        title: 'Meu Perfil',
        personalInfo: 'Informações Pessoais',
        security: 'Segurança',
        preferences: 'Preferências',
        statistics: 'Estatísticas',
        achievements: 'Conquistas',
        certificates: 'Certificados',
        account: 'Conta',
        
        name: 'Nome de usuário',
        fullName: 'Nome completo',
        email: 'E-mail',
        phone: 'Telefone',
        username: 'Nome de usuário',
        editPhoto: 'Alterar foto',
        saveChanges: 'Salvar alterações',
        
        changePassword: 'Alterar senha',
        currentPassword: 'Senha atual',
        newPassword: 'Nova senha',
        confirmPassword: 'Confirmar senha',
        sessionHistory: 'Histórico de sessões',
        activeSessions: 'Sessões ativas',
        currentSession: 'Atual',
        closeSession: 'Fechar',
        
        language: 'Idioma',
        darkMode: 'Modo escuro',
        fontSize: 'Tamanho da fonte',
        notifications: 'Notificações',
        emailNotifications: 'Notificações por e-mail',
        smsNotifications: 'Notificações por SMS',
        pushNotifications: 'Notificações push',
        reminders: 'Lembretes de estudo',
        achievementNotifs: 'Notificações de conquistas',
        
        totalStudyTime: 'Tempo total de estudo',
        completedModules: 'Módulos concluídos',
        completedActivities: 'Atividades concluídas',
        totalPoints: 'Pontos totais',
        currentStreak: 'Sequência atual',
        lastActivity: 'Última atividade',
        days: 'dias',
        activityHistory: 'Histórico de Atividades',
        
        all: 'Todos',
        module: 'Módulo',
        activity: 'Atividade',
        library: 'Biblioteca',
        
        achievementsObtained: 'Conquistas obtidas',
        noAchievements: 'Você ainda não tem conquistas. Continue estudando para conseguir suas primeiras conquistas!',
        
        certificatesObtained: 'Certificados obtidos',
        certificateLocked: 'Certificado Bloqueado',
        completeAllModules: 'Complete todos os módulos do programa para desbloquear seu certificado de conclusão',
        modulesCompleted: 'Módulos concluídos',
        download: 'Baixar',
        verified: 'Verificado',
        notVerified: 'Não verificado',
        checkEligibility: 'Verificar Elegibilidade',
        checking: 'Verificando...',
        
        accountManagement: 'Gerenciamento de Conta',
        logoutDescription: 'Feche sua sessão atual neste dispositivo',
        deleteAccount: 'Excluir conta',
        deleteAccountDescription: 'Exclua permanentemente sua conta e todos os seus dados. Esta ação não pode ser desfeita.',
        deleteWarning: 'Aviso! Todos os seus dados, progresso e certificados serão perdidos.',
        confirmDelete: 'Para excluir sua conta, digite "EXCLUIR" em letras maiúsculas:'
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
        duration: 'Duração estimada',
        materials: 'Materiais',
        readingNotes: 'Minhas Notas',
        notesPlaceholder: 'Escreva suas notas aqui...',
        saveNote: 'Salvar nota',
        notesSaved: 'Nota salva com sucesso',
        markAsRead: 'Marcar como lida'
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
        viewResults: 'Ver resultados',
        score: 'Pontuação',
        timeSpent: 'Tempo gasto',
        attempts: 'Tentativas'
      },

      library: {
        title: 'Biblioteca de Recursos',
        subtitle: 'Materiais de apoio',
        search: 'Buscar recursos',
        searchPlaceholder: 'Buscar recursos, autores, categorias...',
        filterBy: 'Filtrar por',
        all: 'Todos',
        videos: 'Vídeos',
        articles: 'Artigos',
        infographics: 'Infográficos',
        guides: 'Guias',
        download: 'Baixar',
        view: 'Ver',
        author: 'Autor',
        readTime: 'Tempo de leitura',
        category: 'Categoria',
        level: 'Nível'
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
        comingSoon: 'Em breve',
        yes: 'Sim',
        no: 'Não'
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
        unsavedChanges: 'Você tem alterações não salvas',
        required: 'Este campo é obrigatório',
        invalidEmail: 'E-mail inválido',
        passwordMismatch: 'As senhas não coincidem',
        minLength: 'Mínimo {0} caracteres',
        invalidFormat: 'Formato inválido'
      }
    }
  };

  constructor() {
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
    console.log('🌍 I18nService - Cambiando idioma a:', lang);
    this.currentLanguageSubject.next(lang);
    localStorage.setItem('app_language', lang);
    this.setHtmlLang(lang);
  }

  private setHtmlLang(lang: Language): void {
    document.documentElement.lang = lang;
  }

  translate(key: string, params?: any[]): string {
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

    // Reemplazar parámetros si existen
    if (typeof value === 'string' && params) {
      return this.replaceParams(value, params);
    }

    return typeof value === 'string' ? value : key;
  }

  private replaceParams(text: string, params: any[]): string {
    return text.replace(/\{(\d+)\}/g, (match, index) => {
      return params[index] !== undefined ? params[index] : match;
    });
  }

  t(key: string, params?: any[]): string {
    return this.translate(key, params);
  }
}