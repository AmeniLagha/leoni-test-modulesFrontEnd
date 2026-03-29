import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/UserService';
import { ChargeSheetService } from '../../../../services/charge-sheet.service';
import { ComplianceService } from '../../../../services/compliance.service';
import { ClaimService } from '../../../../services/claim.service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
// ✅ Définition de l'interface Message
interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterModule,FormsModule, NgbDropdownModule],
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
  activeUsers: number = 0;  // ⚡ Changé de 24 à 0
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
  ]
   // Pour le navbar responsive
  isNavbarOpen = false;
  
  // Pour les dropdowns de la sidebar
  isUserDropdownOpen = false;
  isMaintenanceDropdownOpen = false;

  constructor(private http: HttpClient,
    private authService: AuthService,
    private userService: UserService,
    private chargeSheetService: ChargeSheetService,
    private complianceService: ComplianceService,
    private claimService: ClaimService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadStats();
    this.loadActiveUsers(); // ⚡ NOUVEAU: charger les utilisateurs actifs
      this.loadToken();
    
    this.messages.push({
      text: 'Bonjour ! Je suis l\'assistant IA LEONI. Comment puis-je vous aider ?',
      isUser: false,
      timestamp: new Date()
    });
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
    // Charger le nombre de cahiers des charges
    this.chargeSheetService.getAll().subscribe({
      next: (data) => {
        this.chargeSheetCount = data.length;
      },
      error: (err) => console.error('Erreur chargement cahiers:', err)
    });

    // Charger le nombre de conformités
    this.complianceService.getAll2().subscribe({
      next: (data) => {
        this.complianceCount = data.length;
      },
      error: (err) => console.error('Erreur chargement conformités:', err)
    });

    // Charger le nombre de réclamations
    this.claimService.getAllClaims().subscribe({
      next: (data) => {
        this.claimsCount = data.length;
      },
      error: (err) => console.error('Erreur chargement réclamations:', err)
    });
  }

  // ⚡ NOUVELLE MÉTHODE: Charger les utilisateurs actifs
  loadActiveUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        // Compter tous les utilisateurs
        this.activeUsers = users.length;

        // Optionnel: filtrer seulement les utilisateurs actifs (si vous avez un champ 'active')
        // const activeUsersList = users.filter(user => user.active === true);
        // this.activeUsers = activeUsersList.length;
      },
      error: (err) => {
        console.error('Erreur chargement utilisateurs:', err);
        // Valeur par défaut en cas d'erreur
        this.activeUsers = 0;
      }
    });
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
   @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
   loadToken(): void {
    const token = this.authService.getAccessToken();
    if (token) {
      this.currentToken = token;
      console.log('✅ Token chargé');
    } else {
      console.warn('⚠️ Aucun token trouvé');
      this.messages.push({
        text: '⚠️ Session expirée. Veuillez vous reconnecter pour utiliser l\'assistant.',
        isUser: false,
        timestamp: new Date()
      });
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

    // Vérifier le token
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

    // 🔥 Envoyer la question ET le token
    this.http.post<{ response: string }>('http://localhost:5000/ask', { 
      question, 
      token: this.currentToken  // Envoi du token
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
        
        // Si erreur 401, token expiré
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
  // Dans chatbot.component.ts, ajoutez cette méthode

formatMessage(text: string): string {
  if (!text) return '';
  
  // Remplacer les retours à la ligne \n par <br>
  let formatted = text.replace(/\n/g, '<br>');
  
  // Remplacer les émojis de nombres par du HTML stylisé
  formatted = formatted.replace(/\*\*(\d+️⃣)\*\*/g, '<strong style="font-size: 1.1rem;">$1</strong>');
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Remplacer les puces
  formatted = formatted.replace(/•/g, '•');
  
  // Ajouter des classes pour les listes
  formatted = formatted.replace(/(\d+️⃣)/g, '<span class="step-number">$1</span>');
  
  return formatted;
}
toggleNavbar(): void {
    this.isNavbarOpen = !this.isNavbarOpen;
  }

  toggleUserDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
    // Fermer les autres dropdowns
    this.isMaintenanceDropdownOpen = false;
  }

  toggleMaintenanceDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isMaintenanceDropdownOpen = !this.isMaintenanceDropdownOpen;
    // Fermer les autres dropdowns
    this.isUserDropdownOpen = false;
  }

  // Modifier la méthode logout pour arrêter la propagation
 isUserMenuOpen = false;

  // ... autres propriétés

  // Méthode pour le dropdown utilisateur
  toggleUserMenuDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  // Méthode pour fermer le dropdown quand on clique ailleurs
  @HostListener('document:click', ['$event'])
  closeUserMenuOnOutsideClick(event: Event): void {
    const target = event.target as HTMLElement;
    const dropdown = document.querySelector('.nav-item.dropdown');
    if (dropdown && !dropdown.contains(target)) {
      this.isUserMenuOpen = false;
    }
  }

  // Modifier la méthode logout
  logout(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
