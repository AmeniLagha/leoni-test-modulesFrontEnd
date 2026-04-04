// dashboard.component.ts - Version complète avec sélecteur de projet

import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/UserService';
import { ChargeSheetService } from '../../../../services/charge-sheet.service';
import { ComplianceService } from '../../../../services/compliance.service';
import { ClaimService } from '../../../../services/claim.service';
import { HttpClient } from '@angular/common/http';
import { TechnicalFileNotificationService, TechnicalNotification } from '../../../../services/TechnicalNotification';
import { NotificationsComponent } from '../../notifications/notifications.component';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterModule, FormsModule, NgbDropdownModule, NotificationsComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit {
  userEmail: string = '';
  userRole: string = '';
  userFirstName: string = '';
  userPermissions: string[] = [];
  today: Date = new Date();

  // Statistiques
  chargeSheetCount: number = 0;
  complianceCount: number = 0;
  claimsCount: number = 0;
  activeUsers: number = 0;

  // Variation mensuelle
  monthlyVariation: any = null;
  showVariationDetails = false;
  selectedMonth1: string = '';
  selectedMonth2: string = '';
  customVariationResult: any = null;
  isLoadingVariation: boolean = false;
  availableMonths: string[] = [];

  // Sélecteur de projet pour admin
  selectedProject: string = 'ALL';
  availableProjects: string[] = ['ALL', 'FORD', 'Mercedes', 'BMW', 'Audi', 'Porsche'];

  // Chatbot
  isOpen = false;
  isLoading = false;
  userInput = '';
  messages: Message[] = [];
  currentToken: string = '';
  suggestions = [
    'Combien de cahiers des charges ?',
    'Comment créer un cahier ?',
    'Comment valider un cahier ?',
    'Quels sont les statuts ?'
  ];

  // UI States
  isNavbarOpen = false;
  isUserMenuOpen = false;
  isSidebarCollapsed = false;
  openSubmenu: string | null = null;
  technicalNotifications: TechnicalNotification[] = [];
  isLoadingNotifications: boolean = false;
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService,
    private chargeSheetService: ChargeSheetService,
    private complianceService: ComplianceService,
    private claimService: ClaimService,
    private router: Router,
     private technicalFileNotificationService: TechnicalFileNotificationService,
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadStats();
    this.loadActiveUsers();
    this.loadMonthlyVariation(); // Charger la variation
     this.loadComplianceVariation();
     // Dans ngOnInit(), ajoutez :
this.loadClaimVariation();
 this.loadTechnicalNotifications();
    this.loadToken();

    this.messages.push({
      text: 'Bonjour ! Je suis l\'assistant IA LEONI. Comment puis-je vous aider ?',
      isUser: false,
      timestamp: new Date()
    });
     this.loadNotificationCount();

    // Rafraîchir le compteur toutes les minutes
    this.notificationRefreshInterval = setInterval(() => {
      this.loadNotificationCount();
    }, 60000);
  }

  loadUserInfo(): void {
    this.userEmail = this.authService.getUserEmail();
    this.userRole = this.authService.getUserRole();
    this.userPermissions = this.authService.getUserPermissions();

    this.userService.getCurrentUserFromApi().subscribe({
      next: (user) => {
        this.userFirstName = user.firstname;
      },
      error: () => {
        this.userFirstName = this.userEmail.split('@')[0];
      }
    });
  }

  loadStats(): void {
    this.chargeSheetService.getAll().subscribe({
      next: (data) => {
        this.chargeSheetCount = data.length;
      },
      error: (err) => console.error('Erreur chargement cahiers:', err)
    });

    this.complianceService.getAll2().subscribe({
      next: (data) => {
        this.complianceCount = data.length;
      },
      error: (err) => console.error('Erreur chargement conformités:', err)
    });

    this.claimService.getAllClaims().subscribe({
      next: (data) => {
        this.claimsCount = data.length;
      },
      error: (err) => console.error('Erreur chargement réclamations:', err)
    });
  }

  loadActiveUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.activeUsers = users.length;
      },
      error: (err) => {
        console.error('Erreur chargement utilisateurs:', err);
        this.activeUsers = 0;
      }
    });
  }

  // Charger la variation mensuelle depuis l'API
  loadMonthlyVariation(): void {
    this.isLoadingVariation = true;
    console.log('Chargement de la variation mensuelle pour:', this.selectedProject);

    let projectParam = this.selectedProject === 'ALL' ? undefined : this.selectedProject;

    this.chargeSheetService.getLastTwoMonthsVariation(projectParam).subscribe({
      next: (data) => {
        console.log('Variation reçue:', data);
        this.monthlyVariation = data;
        this.isLoadingVariation = false;
      },
      error: (err) => {
        console.error('Erreur chargement variation:', err);
        this.isLoadingVariation = false;
        // Données mockées pour le test si l'API n'est pas prête
        this.monthlyVariation = {
          currentMonth: 'Mars 2026',
          currentMonthCount: 4,
          previousMonth: 'Février 2026',
          previousMonthCount: 13,
          variation: -69.2,
          trend: 'baisse',
          formula: '((4 - 13) / 13) × 100 = -69.2%',
          interpretation: '📉 Forte baisse de 69.2% (4 cahiers en Mars vs 13 en Février)'
        };
      }
    });
  }

  // Changement de projet pour l'admin
  onProjectChange(): void {
    console.log('Changement de projet:', this.selectedProject);
    this.loadMonthlyVariation();
    // Recharger aussi la comparaison personnalisée si des mois sont sélectionnés
    if (this.selectedMonth1 && this.selectedMonth2) {
      this.loadCustomVariation();
    }
  }

  // Charger la comparaison personnalisée
  loadCustomVariation(): void {
    if (this.selectedMonth1 && this.selectedMonth2) {
      this.isLoadingVariation = true;
      console.log(`Comparaison entre ${this.selectedMonth1} et ${this.selectedMonth2} pour projet: ${this.selectedProject}`);

      let projectParam = this.selectedProject === 'ALL' ? undefined : this.selectedProject;

      this.chargeSheetService.getVariationBetweenMonths(
        this.selectedMonth1,
        this.selectedMonth2,
        projectParam
      ).subscribe({
        next: (data) => {
          console.log('Résultat comparaison:', data);
          this.customVariationResult = data;
          this.isLoadingVariation = false;
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.customVariationResult = { error: 'Erreur lors du calcul' };
          this.isLoadingVariation = false;
        }
      });
    }
  }

  // Utilitaires pour l'affichage
  getVariationIcon(trend: string): string {
    switch(trend) {
      case 'hausse': return 'bi bi-arrow-up';
      case 'baisse': return 'bi bi-arrow-down';
      default: return 'bi bi-dash';
    }
  }

  getVariationSign(variation: number): string {
    return variation > 0 ? '+' : '';
  }

  hasPermission(permissions: string[]): boolean {
    return permissions.some(p => this.userPermissions.includes(p));
  }

  getUserRoleLabel(role: string): string {
    const labels: { [key: string]: string } = {
      'ADMIN': 'Administrateur',
      'ING': 'Ingénieur',
      'PT': 'Technologie Production',
      'PP': 'Préparation Production',
      'MC': 'Maintenance Corrective',
      'MP': 'Maintenance Préventive'
    };
    return labels[role] || role;
  }

  formatPermissionName(permission: string): string {
    const parts = permission.split(':');
    const action = parts[parts.length - 1];
    const resource = parts[0].replace(/_/g, ' ');

    const actionLabels: { [key: string]: string } = {
      'create': 'Création',
      'read': 'Lecture',
      'write': 'Modification',
      'delete': 'Suppression'
    };

    const resourceLabels: { [key: string]: string } = {
      'charge sheet': 'Cahier',
      'compliance': 'Conformité',
      'technical file': 'DT',
      'maintenance corrective': 'MC',
      'maintenance preventive': 'MP',
      'claim': 'Réclamation',
      'stock': 'Stock'
    };

    const actionLabel = actionLabels[action] || action;
    const resourceLabel = resourceLabels[resource] || resource;

    return `${actionLabel} ${resourceLabel}`.trim();
  }

  isDashboardRoute(): boolean {
    return this.router.url === '/dashboard';
  }

  loadToken(): void {
    const token = this.authService.getAccessToken();
    if (token) {
      this.currentToken = token;
      console.log('✅ Token chargé');
    } else {
      console.warn('⚠️ Aucun token trouvé');
    }
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  closeChat(): void {
    this.isOpen = false;
  }

  sendMessage(): void {
    if (!this.userInput.trim()) return;

    if (!this.currentToken) {
      this.messages.push({
        text: '❌ Session expirée. Veuillez vous reconnecter.',
        isUser: false,
        timestamp: new Date()
      });
      return;
    }

    this.messages.push({
      text: this.userInput,
      isUser: true,
      timestamp: new Date()
    });

    const question = this.userInput;
    this.userInput = '';
    this.isLoading = true;
    this.scrollToBottom();

    this.http.post<{ response: string }>('http://localhost:5000/ask', {
      question,
      token: this.currentToken
    }).subscribe({
      next: (res) => {
        this.messages.push({
          text: res.response,
          isUser: false,
          timestamp: new Date()
        });
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Erreur chatbot:', err);
        if (err.status === 401) {
          this.messages.push({
            text: '❌ Session expirée. Veuillez vous reconnecter.',
            isUser: false,
            timestamp: new Date()
          });
          this.currentToken = '';
        } else {
          this.messages.push({
            text: '❌ Désolé, une erreur est survenue. Veuillez réessayer plus tard.',
            isUser: false,
            timestamp: new Date()
          });
        }
        this.isLoading = false;
        this.scrollToBottom();
      }
    });
  }

  askSuggestion(suggestion: string): void {
    this.userInput = suggestion;
    this.sendMessage();
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  formatMessage(text: string): string {
    if (!text) return '';
    let formatted = text.replace(/\n/g, '<br>');
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return formatted;
  }

  toggleNavbar(): void {
    this.isNavbarOpen = !this.isNavbarOpen;
  }

  toggleUserMenuDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  toggleSubMenu(menu: string): void {
    this.openSubmenu = this.openSubmenu === menu ? null : menu;
  }

  @HostListener('document:click', ['$event'])
  closeUserMenuOnOutsideClick(event: Event): void {
    const target = event.target as HTMLElement;
    const dropdown = document.querySelector('.user-menu');
    if (dropdown && !dropdown.contains(target)) {
      this.isUserMenuOpen = false;
    }
  }

  logout(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  // dashboard.component.ts - Ajoutez ces propriétés

// Conformités
complianceVariation: any = null;
isLoadingComplianceVariation: boolean = false;
selectedComplianceProject: string = 'ALL';

// Méthode pour charger la variation des conformités
loadComplianceVariation(): void {
  this.isLoadingComplianceVariation = true;

  let projectParam = this.selectedComplianceProject === 'ALL' ? undefined : this.selectedComplianceProject;

  this.complianceService.getLastTwoMonthsVariation(projectParam).subscribe({
    next: (data) => {
      this.complianceVariation = data;
      this.isLoadingComplianceVariation = false;
    },
    error: (err) => {
      console.error('Erreur chargement variation conformités:', err);
      this.isLoadingComplianceVariation = false;
      this.complianceVariation = {
        currentMonth: 'Mars 2026',
        currentMonthCount: 8,
        previousMonth: 'Février 2026',
        previousMonthCount: 12,
        variation: -33.3,
        trend: 'baisse',
        formula: '((8 - 12) / 12) × 100 = -33.3%',
        interpretation: '📉 Baisse de 33.3% (8 fiches en Mars vs 12 en Février)'
      };
    }
  });
}
// dashboard.component.ts - Ajoutez cette méthode

// Méthode appelée quand l'admin change de projet pour les conformités
onComplianceProjectChange(): void {
  console.log('Changement projet conformités:', this.selectedComplianceProject);
  this.loadComplianceVariation();
}
// dashboard.component.ts - Ajoutez ces propriétés et méthodes

// Réclamations
claimVariation: any = null;
isLoadingClaimVariation: boolean = false;
selectedClaimProject: string = 'ALL';



// Méthode pour charger la variation des réclamations
loadClaimVariation(): void {
  this.isLoadingClaimVariation = true;

  let projectParam = this.selectedClaimProject === 'ALL' ? undefined : this.selectedClaimProject;

  this.claimService.getLastTwoMonthsVariation(projectParam).subscribe({
    next: (data) => {
      this.claimVariation = data;
      this.isLoadingClaimVariation = false;
    },
    error: (err) => {
      console.error('Erreur chargement variation réclamations:', err);
      this.isLoadingClaimVariation = false;
      this.claimVariation = {
        currentMonth: 'Mars 2026',
        currentMonthCount: 5,
        previousMonth: 'Février 2026',
        previousMonthCount: 3,
        variation: 66.7,
        trend: 'hausse',
        formula: '((5 - 3) / 3) × 100 = 66.7%',
        interpretation: '📈 Forte augmentation de 66.7% (5 vs 3 réclamations)'
      };
    }
  });
}

// Méthode appelée quand l'admin change de projet pour les réclamations
onClaimProjectChange(): void {
  console.log('Changement projet réclamations:', this.selectedClaimProject);
  this.loadClaimVariation();
}
// dashboard.component.ts - Ajoutez ces méthodes

/**
 * Charge les notifications techniques depuis l'API
 */
loadTechnicalNotifications(): void {
  this.isLoadingNotifications = true;
  this.technicalFileNotificationService.getPendingNotifications().subscribe({
    next: (data) => {
      this.technicalNotifications = data;
      this.isLoadingNotifications = false;
      console.log('📢 Notifications techniques chargées:', this.technicalNotifications.length);
    },
    error: (err) => {
      console.error('❌ Erreur chargement notifications techniques:', err);
      this.isLoadingNotifications = false;
      // Données mockées pour le test si l'API n'est pas prête
      this.technicalNotifications = [];
    }
  });
}

/**
 * Marque toutes les notifications comme lues
 */
clearNotifications(): void {
  // Sauvegarder la date de dernière visualisation
  localStorage.setItem('lastNotifView', new Date().toISOString());

  // Animation de disparition
  const notifSection = document.querySelector('.notifications-section');
  if (notifSection) {
    notifSection.classList.add('fade-out');
    setTimeout(() => {
      this.technicalNotifications = [];
      notifSection.classList.remove('fade-out');
    }, 300);
  } else {
    this.technicalNotifications = [];
  }

  // Optionnel: Appeler une API pour marquer comme lues
  // this.technicalFileNotificationService.markAllAsRead().subscribe();
}

/**
 * Affiche les détails d'un item technique
 */
viewTechnicalItem(itemId: number): void {
  this.router.navigate(['/technical-files/item', itemId]);
}

/**
 * Ignore/ferme une notification spécifique
 */
dismissNotification(notificationId: number): void {
  // Filtrer la notification
  const index = this.technicalNotifications.findIndex(n => n.id === notificationId);
  if (index !== -1) {
    this.technicalNotifications.splice(index, 1);
  }


}
 notificationCount: number = 0;
  private notificationRefreshInterval: any;
  ngOnDestroy(): void {
    if (this.notificationRefreshInterval) {
      clearInterval(this.notificationRefreshInterval);
    }
  }

  /**
   * Charge le nombre de notifications non lues
   */
  loadNotificationCount(): void {
    this.technicalFileNotificationService.getPendingNotifications().subscribe({
      next: (notifications) => {
        const lastView = localStorage.getItem('lastNotifView');
        if (lastView) {
          const lastViewDate = new Date(lastView);
          this.notificationCount = notifications.filter(n => new Date(n.createdAt) > lastViewDate).length;
        } else {
          this.notificationCount = notifications.length;
        }
      },
      error: (err) => {
        console.error('Erreur chargement compteur notifications:', err);
        this.notificationCount = 0;
      }
    });
  }

  /**
   * Redirige vers la page des notifications
   */
  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }
}
