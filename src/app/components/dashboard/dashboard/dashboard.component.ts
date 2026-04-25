// dashboard.component.ts - Version complète corrigée

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
import { SiteService } from '../../../../services/Site';
import { HttpClient } from '@angular/common/http';
import { TechnicalFileNotificationService, TechnicalNotification } from '../../../../services/TechnicalNotification';
import { NotificationsComponent } from '../../notifications/notifications.component';
import { TechnicalFileService } from '../../../../services/technical-file.service';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface Site {
  id: number;
  name: string;
  description: string;
  active: boolean;
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

  // ==================== SITES (pour ADMIN) ====================
  sites: Site[] = [];
  selectedSite: Site | null = null;
  loadingSites: boolean = false;
  showSiteSelector: boolean = false;

  // Onglet actif
  activeDashboardTab: string = 'charge-sheets';

  // Statistiques
  chargeSheetCount: number = 0;
  complianceCount: number = 0;
  claimsCount: number = 0;
  technicalFilesCount: number = 0;
  activeUsers: number = 0;
  stockCount: number = 0;
  receptionCount: number = 0;

  // Variations
  monthlyVariation: any = null;
  complianceVariation: any = null;
  claimVariation: any = null;
  isLoadingVariation: boolean = false;
  isLoadingComplianceVariation: boolean = false;
  isLoadingClaimVariation: boolean = false;
  showVariationDetails = false;

  // Sélecteurs
  selectedMonth1: string = '';
  selectedMonth2: string = '';
  customVariationResult: any = null;

  selectedProject: string = 'ALL';
  selectedComplianceProject: string = 'ALL';
  selectedClaimProject: string = 'ALL';
  availableProjects: string[] = ['ALL', 'BMW', 'Mercedes', 'Audi', 'Porsche', 'Volkswagen'];

  // Chatbot
  isOpen = false;
  isLoading = false;
  userInput = '';
  messages: Message[] = [];
  currentToken: string = '';
  suggestions = ['Combien de cahiers des charges ?', 'Comment créer un cahier ?', 'Comment valider un cahier ?', 'Quels sont les statuts ?'];

  // UI States
  isNavbarOpen = false;
  isUserMenuOpen = false;
  isSidebarCollapsed = false;
  openSubmenu: string | null = null;
  technicalNotifications: TechnicalNotification[] = [];
  isLoadingNotifications: boolean = false;
  notificationCount: number = 0;
  private notificationRefreshInterval: any;
  Math = Math;

  selectedSiteData: {
    chargeSheets: any[];
    compliances: any[];
    claims: any[];
    technicalFiles: any[];
  } | null = null;
  loadingSiteData: boolean = false;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService,
    private chargeSheetService: ChargeSheetService,
    private complianceService: ComplianceService,
    private claimService: ClaimService,
    private siteService: SiteService,
    private technicalFileService: TechnicalFileService,
    private router: Router,
    private technicalFileNotificationService: TechnicalFileNotificationService,
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadActiveUsers();
    this.loadToken();

     this.loadMonthlyVariation();
  this.loadComplianceVariation();
  this.loadClaimVariation();

    if (this.userRole === 'ADMIN') {
      this.loadSites();
      this.loadStats();
      this.loadTechnicalNotifications();
    } else {
      this.loadStats();
    this.loadTechnicalNotifications();
    }

    this.messages.push({
      text: 'Bonjour ! Je suis l\'assistant IA LEONI. Comment puis-je vous aider ?',
      isUser: false,
      timestamp: new Date()
    });

    this.loadNotificationCount();
    this.notificationRefreshInterval = setInterval(() => {
      this.loadNotificationCount();
    }, 60000);
     // ✅ AJOUTER DES LOGS POUR DEBUG
  setTimeout(() => {
    console.log('📊 monthlyVariation:', this.monthlyVariation);
    console.log('📊 complianceVariation:', this.complianceVariation);
    console.log('📊 claimVariation:', this.claimVariation);
  }, 3000);
  }
goToProfile(): void {
  this.router.navigate(['/profile']);
  this.isUserMenuOpen = false;
}

goToSettings(): void {
  this.router.navigate(['/settings']);
  this.isUserMenuOpen = false;
}
isAdmin(): boolean {
  return this.authService.getUserRole() === 'ADMIN';
}
isMC(): boolean{
  return this.authService.getUserRole() ==='MC'
}
isMP(): boolean{
  return this.authService.getUserRole() ==='MP'
}
goToHelp(): void {
  this.router.navigate(['/help']);
  this.isUserMenuOpen = false;
}
  ngOnDestroy(): void {
    if (this.notificationRefreshInterval) {
      clearInterval(this.notificationRefreshInterval);
    }
  }
// dashboard.component.ts - Ajouter cette méthode

// Formater un mois (ex: "2026-03" -> "Mars 2026")
formatMonth(monthStr: string): string {
  if (!monthStr) return 'Mois inconnu';

  // Si c'est déjà une date au format "YYYY-MM"
  if (monthStr.match(/^\d{4}-\d{2}$/)) {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  // Si c'est déjà une date complète
  const date = new Date(monthStr);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  return monthStr;
}
  // ==================== GESTION DES SITES ====================
  loadSites(): void {
    this.loadingSites = true;
    console.log('🔄 Chargement des sites pour ADMIN...');

    this.siteService.getAll().subscribe({
      next: (sites) => {
        console.log('✅ Sites reçus:', sites);
        this.sites = sites;
        this.loadingSites = false;
        this.showSiteSelector = true;
      },
      error: (err) => {
        console.error('❌ Erreur chargement sites:', err);
        this.loadingSites = false;
        this.sites = [];
      }
    });
  }

  selectSite(site: Site): void {
    this.selectedSite = site;
    this.showSiteSelector = false;
    this.activeDashboardTab = 'charge-sheets';

    this.loadSiteData(site);
  }

  backToSiteSelection(): void {
    this.selectedSite = null;
    this.selectedSiteData = null;
    this.showSiteSelector = true;
  }

  // ✅ Charger les données du site sélectionné
 // dashboard.component.ts - Modifier loadSiteData()
// Ajoute ces méthodes
loadMonthlyVariationForSite(siteId: number): void {
  this.isLoadingVariation = true;
  // Passe le nom du site comme projet pour filtrer
  let projectParam = this.selectedSite?.name;
  this.chargeSheetService.getLastTwoMonthsVariation(projectParam).subscribe({
    next: (data) => {
      this.monthlyVariation = data;
      this.isLoadingVariation = false;
      console.log('✅ Variation cahiers pour le site:', data);
    },
    error: (err) => {
      console.error('Erreur chargement variation:', err);
      this.isLoadingVariation = false;
    }
  });
}
loadComplianceVariationForSite(siteId: number): void {
  this.isLoadingComplianceVariation = true;
  let projectParam = this.selectedSite?.name;
  this.complianceService.getLastTwoMonthsVariation(projectParam).subscribe({
    next: (data) => {
      this.complianceVariation = data;
      this.isLoadingComplianceVariation = false;
      console.log('✅ Variation conformités pour le site:', data);
    },
    error: (err) => {
      console.error('Erreur chargement variation conformités:', err);
      this.isLoadingComplianceVariation = false;
    }
  });
}
loadClaimVariationForSite(siteId: number): void {
  this.isLoadingClaimVariation = true;
  let projectParam = this.selectedSite?.name;
  this.claimService.getLastTwoMonthsVariation(projectParam).subscribe({
    next: (data) => {
      this.claimVariation = data;
      this.isLoadingClaimVariation = false;
      console.log('✅ Variation réclamations pour le site:', data);
    },
    error: (err) => {
      console.error('Erreur chargement variation réclamations:', err);
      this.isLoadingClaimVariation = false;
    }
  });
}
loadSiteData(site: Site): void {
  this.loadingSiteData = true;
  console.log('🔄 Chargement des données pour le site:', site.name, 'ID:', site.id);

  // 1. Charger les cahiers du site
  this.chargeSheetService.getAll().subscribe({
    next: (allChargeSheets) => {
      const siteSheets = allChargeSheets.filter(s => s.plant === site.name);
      this.chargeSheetCount = siteSheets.length;
      const sheetIds = siteSheets.map(s => s.id);

      // ✅ CALCULER LA VARIATION À PARTIR DES CAHIERS DU SITE
      this.calculateMonthlyVariationForSite(siteSheets);

      console.log(`📋 Cahiers trouvés pour ${site.name}: ${this.chargeSheetCount}`);
      console.log('📊 Détail des cahiers:', siteSheets.map(s => ({ id: s.id, plant: s.plant, createdAt: s.createdAt })));

      // 2. Charger les conformités
      this.complianceService.getAll2().subscribe({
        next: (allCompliances) => {
          const siteCompliances = allCompliances.filter(c => sheetIds.includes(c.chargeSheetId));
          this.complianceCount = siteCompliances.length;
          console.log(`✅ Conformités pour ${site.name}: ${this.complianceCount}`);
        },
        error: (err) => console.error('Erreur chargement conformités:', err)
      });

      // 3. Charger les réclamations
      this.claimService.getAllClaims().subscribe({
        next: (allClaims) => {
          const siteClaims = allClaims.filter(c => sheetIds.includes(c.chargeSheetId));
          this.claimsCount = siteClaims.length;
          console.log(`✅ Réclamations pour ${site.name}: ${this.claimsCount}`);
        },
        error: (err) => console.error('Erreur chargement réclamations:', err)
      });

      // 4. Charger les dossiers techniques
      this.technicalFileService.getAllDetailed().subscribe({
        next: (allTechFiles) => {
          let totalTechFiles = 0;
          if (allTechFiles && allTechFiles.length) {
            allTechFiles.forEach(tf => {
              if (tf.items && tf.items.length) {
                tf.items.forEach(item => {
                  if (sheetIds.includes(item.chargeSheetItemId)) {
                    totalTechFiles++;
                  }
                });
              }
            });
          }
          this.technicalFilesCount = totalTechFiles;
          console.log(`✅ Dossiers techniques pour ${site.name}: ${this.technicalFilesCount}`);
        },
        error: (err) => console.error('Erreur chargement dossiers techniques:', err)
      });

      // 5. Charger les utilisateurs
      this.userService.getUsers().subscribe({
        next: (allUsers) => {
          let siteUsers = allUsers.filter(u => u.site === site.name);
          this.activeUsers = siteUsers.length;
          console.log(`✅ Utilisateurs pour ${site.name}: ${this.activeUsers}`);
        },
        error: (err) => console.error('Erreur chargement utilisateurs:', err)
      });

      this.loadingSiteData = false;
    },
    error: (err) => {
      console.error('Erreur chargement cahiers:', err);
      this.loadingSiteData = false;
    }
  });
}
calculateMonthlyVariationForSite(siteSheets: any[]): void {
  console.log('📊 Calcul de variation pour', siteSheets.length, 'cahiers');

  if (!siteSheets || siteSheets.length === 0) {
    this.monthlyVariation = {
      currentMonth: 'Aucune donnée',
      currentMonthKey: '',
      currentMonthCount: 0,
      previousMonth: 'Aucune donnée',
      previousMonthKey: '',
      previousMonthCount: 0,
      variation: 0,
      trend: 'stable',
      formula: 'Aucun cahier trouvé pour ce site',
      interpretation: '📊 Aucun cahier des charges trouvé pour ce site'
    };
    return;
  }

  // Grouper les cahiers par mois (YYYY-MM)
  const monthlyCounts: { [key: string]: number } = {};

  siteSheets.forEach(sheet => {
    // ✅ Utiliser 'date' en priorité
    let dateStr = sheet.date || sheet.createdAt;

    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
        console.log(`📅 Cahier ${sheet.id} - Date: ${dateStr} -> Mois: ${monthKey}`);
      }
    }
  });

  console.log('📊 Comptes mensuels:', monthlyCounts);

  // ✅ TRI CHRONOLOGIQUE (du plus récent au plus ancien) - sur les clés YYYY-MM
  const sortedMonths = Object.keys(monthlyCounts).sort((a, b) => {
    // Comparer les dates (format YYYY-MM)
    if (a > b) return -1;  // Plus récent d'abord
    if (a < b) return 1;
    return 0;
  });

  console.log('📊 Mois triés (clés):', sortedMonths);

  if (sortedMonths.length >= 2) {
    const currentMonthKey = sortedMonths[0];
    const previousMonthKey = sortedMonths[1];
    const currentCount = monthlyCounts[currentMonthKey];
    const previousCount = monthlyCounts[previousMonthKey];

    let variation = 0;
    let trend = 'stable';

    if (previousCount > 0) {
      variation = ((currentCount - previousCount) / previousCount) * 100;
      variation = Math.round(variation * 10) / 10;
      trend = variation > 0 ? 'hausse' : variation < 0 ? 'baisse' : 'stable';
    } else if (currentCount > 0) {
      variation = 100;
      trend = 'hausse';
    }

    this.monthlyVariation = {
      currentMonth: this.formatMonthDisplay(currentMonthKey),
      currentMonthKey: currentMonthKey,
      currentMonthCount: currentCount,
      previousMonth: this.formatMonthDisplay(previousMonthKey),
      previousMonthKey: previousMonthKey,
      previousMonthCount: previousCount,
      variation: variation,
      trend: trend,
      formula: `((${currentCount} - ${previousCount}) / ${previousCount}) × 100 = ${variation}%`,
      interpretation: this.getVariationInterpretation(trend, variation, currentCount, previousCount, 'cahier(s)')
    };

    console.log('✅ Variation calculée:', this.monthlyVariation);

  } else if (sortedMonths.length === 1) {
    const currentMonthKey = sortedMonths[0];
    const currentCount = monthlyCounts[currentMonthKey];

    this.monthlyVariation = {
      currentMonth: this.formatMonthDisplay(currentMonthKey),
      currentMonthKey: currentMonthKey,
      currentMonthCount: currentCount,
      previousMonth: 'Aucun mois précédent',
      previousMonthKey: '',
      previousMonthCount: 0,
      variation: 0,
      trend: 'stable',
      formula: 'Premier mois avec des données',
      interpretation: `📊 Premier mois d'activité: ${currentCount} cahier(s) créé(s) en ${this.formatMonthDisplay(currentMonthKey)}`
    };

  } else {
    this.monthlyVariation = {
      currentMonth: 'Aucune donnée',
      currentMonthKey: '',
      currentMonthCount: 0,
      previousMonth: 'Aucune donnée',
      previousMonthKey: '',
      previousMonthCount: 0,
      variation: 0,
      trend: 'stable',
      formula: 'Aucune donnée disponible',
      interpretation: '📊 Aucun cahier des charges trouvé pour ce site'
    };
  }
}

// ✅ Méthode pour l'affichage uniquement (ne pas utiliser pour le tri)
formatMonthDisplay(monthKey: string): string {
  if (!monthKey) return 'Mois inconnu';

  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

// Formater une clé de mois (2026-03 -> Mars 2026)
formatMonthKey(monthKey: string): string {
  if (!monthKey) return 'Mois inconnu';

  // Format: "2026-04"
  if (monthKey.match(/^\d{4}-\d{2}$/)) {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  return monthKey;
}
// Obtenir l'interprétation de la variation
getVariationInterpretation(trend: string, variation: number, currentCount: number, previousCount: number, unit: string): string {
  if (trend === 'hausse') {
    if (variation > 50) {
      return `📈 Forte augmentation de ${variation}% (${currentCount} vs ${previousCount} ${unit})`;
    } else {
      return `📈 Augmentation de ${variation}% (${currentCount} vs ${previousCount} ${unit})`;
    }
  } else if (trend === 'baisse') {
    if (variation < -50) {
      return `📉 Forte baisse de ${Math.abs(variation)}% (${currentCount} vs ${previousCount} ${unit})`;
    } else {
      return `📉 Baisse de ${Math.abs(variation)}% (${currentCount} vs ${previousCount} ${unit})`;
    }
  } else {
    return `➡️ Stable (${currentCount} ${unit} pour les deux mois)`;
  }
}
  // ==================== NAVIGATION ====================
  goToChargeSheetsList(): void {
    if (this.selectedSite) {
      this.router.navigate(['/charge-sheets/list'], { queryParams: { site: this.selectedSite.name } });
    } else {
      this.router.navigate(['/charge-sheets/list']);
    }
  }

  goToComplianceList(): void {
    if (this.selectedSite) {
      this.router.navigate(['/compliance/list'], { queryParams: { site: this.selectedSite.name } });
    } else {
      this.router.navigate(['/compliance/list']);
    }
  }

  goToTechnicalFilesList(): void {
    if (this.selectedSite) {
      this.router.navigate(['/technical-files/list'], { queryParams: { site: this.selectedSite.name } });
    } else {
      this.router.navigate(['/technical-files/list']);
    }
  }

  goToClaimsList(): void {
    if (this.selectedSite) {
      this.router.navigate(['/claims/list'], { queryParams: { site: this.selectedSite.name } });
    } else {
      this.router.navigate(['/claims/list']);
    }
  }

  goToUsersList(): void {
    this.router.navigate(['/listeuser']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToClaimsCreate(): void {
    this.router.navigate(['/claims/create']);
  }

  goToStock(): void {
    this.router.navigate(['/stock']);
  }

  goToReception(): void {
    this.router.navigate(['/reception']);
  }

  // ==================== MÉTHODES EXISTANTES ====================
  loadUserInfo(): void {
    this.userEmail = this.authService.getUserEmail();
    this.userRole = this.authService.getUserRole();
    this.userPermissions = this.authService.getUserPermissions();

    this.userService.getCurrentUserFromApi().subscribe({
      next: (user) => { this.userFirstName = user.firstname; },
      error: () => { this.userFirstName = this.userEmail.split('@')[0]; }
    });
  }

  loadStats(): void {
    this.chargeSheetService.getAll().subscribe({
      next: (data) => { this.chargeSheetCount = data.length; },
      error: (err) => console.error('Erreur chargement cahiers:', err)
    });
    this.complianceService.getAll2().subscribe({
      next: (data) => { this.complianceCount = data.length; },
      error: (err) => console.error('Erreur chargement conformités:', err)
    });
    this.claimService.getAllClaims().subscribe({
      next: (data) => { this.claimsCount = data.length; },
      error: (err) => console.error('Erreur chargement réclamations:', err)
    });
    this.technicalFilesCount = 0;
  }

  loadActiveUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => { this.activeUsers = users.length; },
      error: (err) => { console.error('Erreur chargement utilisateurs:', err); this.activeUsers = 0; }
    });
  }

  loadMonthlyVariation(): void {
    this.isLoadingVariation = true;
    let projectParam = this.selectedProject === 'ALL' ? undefined : this.selectedProject;
    this.chargeSheetService.getLastTwoMonthsVariation(projectParam).subscribe({
      next: (data) => { this.monthlyVariation = data; this.isLoadingVariation = false; },
      error: (err) => { console.error('Erreur chargement variation:', err); this.isLoadingVariation = false; }
    });
  }

  loadComplianceVariation(): void {
    this.isLoadingComplianceVariation = true;
    let projectParam = this.selectedComplianceProject === 'ALL' ? undefined : this.selectedComplianceProject;
    this.complianceService.getLastTwoMonthsVariation(projectParam).subscribe({
      next: (data) => { this.complianceVariation = data; this.isLoadingComplianceVariation = false; },
      error: (err) => { console.error('Erreur chargement variation conformités:', err); this.isLoadingComplianceVariation = false; }
    });
  }

  loadClaimVariation(): void {
    this.isLoadingClaimVariation = true;
    let projectParam = this.selectedClaimProject === 'ALL' ? undefined : this.selectedClaimProject;
    this.claimService.getLastTwoMonthsVariation(projectParam).subscribe({
      next: (data) => { this.claimVariation = data; this.isLoadingClaimVariation = false; },
      error: (err) => { console.error('Erreur chargement variation réclamations:', err); this.isLoadingClaimVariation = false; }
    });
  }

  loadTechnicalNotifications(): void {
    this.isLoadingNotifications = true;
    this.technicalFileNotificationService.getPendingNotifications().subscribe({
      next: (data) => { this.technicalNotifications = data; this.isLoadingNotifications = false; },
      error: (err) => { console.error('Erreur chargement notifications:', err); this.isLoadingNotifications = false; this.technicalNotifications = []; }
    });
  }

  loadToken(): void {
    const token = this.authService.getAccessToken();
    if (token) { this.currentToken = token; }
  }

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
      error: (err) => { console.error('Erreur chargement compteur notifications:', err); this.notificationCount = 0; }
    });
  }

  setActiveTab(tab: string): void {
    this.activeDashboardTab = tab;
  }

  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  onProjectChange(): void {
    this.loadMonthlyVariation();
  }

  onComplianceProjectChange(): void {
    this.loadComplianceVariation();
  }

  onClaimProjectChange(): void {
    this.loadClaimVariation();
  }

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
      'claim': 'Réclamation',
      'stock': 'Stock'
    };
    return `${actionLabels[action] || action} ${resourceLabels[resource] || resource}`.trim();
  }

  isDashboardRoute(): boolean {
    return this.router.url === '/dashboard';
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
      this.messages.push({ text: '❌ Session expirée. Veuillez vous reconnecter.', isUser: false, timestamp: new Date() });
      return;
    }
    this.messages.push({ text: this.userInput, isUser: true, timestamp: new Date() });
    const question = this.userInput;
    this.userInput = '';
    this.isLoading = true;
    this.scrollToBottom();
    this.http.post<{ response: string }>('http://localhost:5000/ask', { question, token: this.currentToken }).subscribe({
      next: (res) => {
        this.messages.push({ text: res.response, isUser: false, timestamp: new Date() });
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Erreur chatbot:', err);
        if (err.status === 401) {
          this.messages.push({ text: '❌ Session expirée. Veuillez vous reconnecter.', isUser: false, timestamp: new Date() });
          this.currentToken = '';
        } else {
          this.messages.push({ text: '❌ Désolé, une erreur est survenue. Veuillez réessayer plus tard.', isUser: false, timestamp: new Date() });
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

  clearNotifications(): void {
    localStorage.setItem('lastNotifView', new Date().toISOString());
    this.technicalNotifications = [];
  }

  viewTechnicalItem(itemId: number): void {
    this.router.navigate(['/technical-files/items', itemId, 'detail']);
  }

  dismissNotification(notificationId: number): void {
    const index = this.technicalNotifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.technicalNotifications.splice(index, 1);
    }
  }
}
