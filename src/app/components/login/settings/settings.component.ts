import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/UserService';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  activeTab: string = 'general';

  // Paramètres généraux
  language: string = 'fr';
  timezone: string = 'Europe/Paris';
  dateFormat: string = 'DD/MM/YYYY';

  // Notifications
  emailNotifications: boolean = true;
  pushNotifications: boolean = true;
  reminderNotifications: boolean = true;
  weeklyReport: boolean = false;

  // Apparence
  theme: string = 'auto';
  fontSize: number = 14;
  compactMode: boolean = false;
  animations: boolean = true;

  // Sécurité
  twoFactorAuth: boolean = false;
  sessionTimeout: number = 30;

  // Support
  supportRequest = {
    subject: '',
    message: '',
    priority: 'normal',
    attachment: null as File | null
  };

  faqs = [
    {
      question: 'Comment créer un cahier des charges ?',
      answer: 'Allez dans la section "Cahiers des charges", cliquez sur "Nouveau cahier", remplissez le formulaire et ajoutez les items.',
      open: false
    },
    {
      question: 'Comment valider un cahier ?',
      answer: 'Selon votre rôle (ING, PT, PP), vous verrez des boutons de validation dans la page de détail du cahier.',
      open: false
    },
    {
      question: 'Comment ajouter des items ?',
      answer: 'Dans le formulaire de création/modification, cliquez sur "Ajouter un item" et remplissez les informations du connecteur.',
      open: false
    },
    {
      question: 'Comment exporter les données ?',
      answer: 'Utilisez les boutons d\'export Excel disponibles dans les listes et les détails des cahiers.',
      open: false
    },
    {
      question: 'Que faire en cas d\'erreur ?',
      answer: 'Contactez le support technique via l\'onglet "Support" ou par email à support@leoni.com.',
      open: false
    }
  ];

  systemStatus = {
    api: { status: 'operational', uptime: '99.9%', lastIncident: null },
    database: { status: 'operational', uptime: '99.95%', lastIncident: null },
    email: { status: 'operational', uptime: '99.8%', lastIncident: null },
    storage: { status: 'operational', uptime: '99.99%', lastIncident: null }
  };

  lastUpdate: Date = new Date();
  userEmail: string = '';
  userRole: string = '';

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userEmail = this.authService.getUserEmail();
    this.userRole = this.authService.getUserRole();
    this.loadUserSettings();
  }

  loadUserSettings(): void {
    // Charger les paramètres sauvegardés dans localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      this.language = settings.language || 'fr';
      this.timezone = settings.timezone || 'Europe/Paris';
      this.dateFormat = settings.dateFormat || 'DD/MM/YYYY';
      this.emailNotifications = settings.emailNotifications ?? true;
      this.pushNotifications = settings.pushNotifications ?? true;
      this.reminderNotifications = settings.reminderNotifications ?? true;
      this.weeklyReport = settings.weeklyReport ?? false;
      this.theme = settings.theme || 'auto';
      this.fontSize = settings.fontSize || 14;
      this.compactMode = settings.compactMode || false;
      this.animations = settings.animations ?? true;
      this.twoFactorAuth = settings.twoFactorAuth || false;
      this.sessionTimeout = settings.sessionTimeout || 30;
      this.applyTheme();
      this.applyFontSize();
    }
  }

  saveSettings(): void {
    const settings = {
      language: this.language,
      timezone: this.timezone,
      dateFormat: this.dateFormat,
      emailNotifications: this.emailNotifications,
      pushNotifications: this.pushNotifications,
      reminderNotifications: this.reminderNotifications,
      weeklyReport: this.weeklyReport,
      theme: this.theme,
      fontSize: this.fontSize,
      compactMode: this.compactMode,
      animations: this.animations,
      twoFactorAuth: this.twoFactorAuth,
      sessionTimeout: this.sessionTimeout
    };

    localStorage.setItem('userSettings', JSON.stringify(settings));
    this.applyTheme();
    this.applyFontSize();
    alert('✅ Paramètres sauvegardés avec succès');
  }

  applyTheme(): void {
    if (this.theme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else if (this.theme === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.body.classList.remove('dark-theme', 'light-theme');
    }
  }

  applyFontSize(): void {
    document.documentElement.style.fontSize = `${this.fontSize}px`;
  }

  resetSettings(): void {
    this.language = 'fr';
    this.timezone = 'Europe/Paris';
    this.dateFormat = 'DD/MM/YYYY';
    this.emailNotifications = true;
    this.pushNotifications = true;
    this.reminderNotifications = true;
    this.weeklyReport = false;
    this.theme = 'auto';
    this.fontSize = 14;
    this.compactMode = false;
    this.animations = true;
    this.twoFactorAuth = false;
    this.sessionTimeout = 30;
    this.saveSettings();
    alert('🔄 Paramètres réinitialisés');
  }

  changePassword(): void {
    alert('🔐 Fonctionnalité à venir: Changement de mot de passe');
  }

  viewSessions(): void {
    alert('📱 Sessions actives: Vous êtes connecté sur 2 appareils');
  }

  exportData(): void {
    alert('📥 Export des données: Cette fonctionnalité sera disponible prochainement');
  }

  sendSupportRequest(): void {
    if (!this.supportRequest.subject || !this.supportRequest.message) {
      alert('❌ Veuillez remplir le sujet et le message');
      return;
    }

    console.log('Support request:', {
      subject: this.supportRequest.subject,
      message: this.supportRequest.message,
      priority: this.supportRequest.priority,
      userEmail: this.userEmail,
      userRole: this.userRole,
      date: new Date()
    });

    alert(`✅ Votre demande a été envoyée au support\n\nSujet: ${this.supportRequest.subject}\nPriorité: ${this.supportRequest.priority}\n\nVous recevrez une réponse sous 24h.`);

    this.supportRequest = {
      subject: '',
      message: '',
      priority: 'normal',
      attachment: null
    };
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.supportRequest.attachment = input.files[0];
    }
  }

  toggleFaq(index: number): void {
    this.faqs[index].open = !this.faqs[index].open;
  }

  getPriorityLabel(priority: string): string {
    switch(priority) {
      case 'urgent': return '🔴 Urgent';
      case 'high': return '🟠 Haute';
      case 'normal': return '🔵 Normale';
      case 'low': return '🟢 Basse';
      default: return 'Normale';
    }
  }

  getStatusIcon(status: string): string {
    return status === 'operational' ? '✅' : '⚠️';
  }

  getStatusClass(status: string): string {
    return status === 'operational' ? 'text-success' : 'text-warning';
  }
  // Ajoutez cette méthode dans la classe SettingsComponent
updateLastUpdate(): void {
  this.lastUpdate = new Date();
}
}
