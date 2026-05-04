import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/UserService';
import { ChargeSheetService } from '../../../../services/charge-sheet.service';
import { ComplianceService } from '../../../../services/compliance.service';
import { TechnicalFileService } from '../../../../services/technical-file.service';
import { ClaimService } from '../../../../services/claim.service';

Chart.register(...registerables);

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit {
  userEmail: string = '';
  userFirstName: string = '';
  userLastName: string = '';
  userRole: string = '';
  userSite: string = '';
  userProjects: string[] = [];
  memberSince: Date = new Date();
  lastLogin: Date = new Date();
  loading: boolean = true;
  activityFilter: string = 'all';

  @ViewChild('activityChart') activityChartCanvas!: ElementRef<HTMLCanvasElement>;

  // ✅ Statistiques industrielles (pas de gamification)
  stats = {
    chargeSheets: { created: 0, modified: 0, lastDate: null as Date | null, items: [] as any[] },
    compliances: { created: 0, lastDate: null as Date | null, items: [] as any[] },
    technicalFiles: { created: 0, lastDate: null as Date | null, items: [] as any[] },
    claims: { created: 0, received: 0, total: 0, lastDate: null as Date | null, items: [] as any[] }
  };

  hasMadeReception: boolean = false;
  lastReceptionDate: Date | null = null;
  allActivities: Activity[] = [];
  filteredActivities: Activity[] = [];

  private activityChart: Chart | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private chargeSheetService: ChargeSheetService,
    private complianceService: ComplianceService,
    private technicalFileService: TechnicalFileService,
    private claimService: ClaimService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadUserStats();
  }

  loadUserInfo(): void {
    this.userEmail = this.authService.getUserEmail();
    this.userRole = this.authService.getUserRole();
    this.userSite = this.authService.getUserSite();

    this.userService.getCurrentUserFromApi().subscribe({
      next: (response: any) => {
        const user = response.data || response;
        this.userFirstName = user.firstname;
        this.userLastName = user.lastname;
        this.userProjects = user.projets?.map((p: any) => p.name) || [];
        this.memberSince = user.createdAt ? new Date(user.createdAt) : new Date();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement profil:', err);
        this.userFirstName = this.userEmail.split('@')[0];
        this.loading = false;
      }
    });
  }

  loadUserStats(): void {
    // Charger les cahiers
    this.chargeSheetService.getAll().subscribe({
      next: (sheets) => {
        const userSheets = sheets.filter(s => s.createdBy === this.userEmail);
        this.stats.chargeSheets.created = userSheets.length;
        this.stats.chargeSheets.items = userSheets;

        const modifiedSheets = sheets.filter(s => s.updatedBy === this.userEmail);
        this.stats.chargeSheets.modified = modifiedSheets.length;

        if (userSheets.length > 0) {
          const dates = userSheets
            .map(s => s.createdAt || s.date)
            .filter(date => date)
            .map(date => new Date(date!))
            .filter(d => !isNaN(d.getTime()));
          this.stats.chargeSheets.lastDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
        }
        this.addActivities(userSheets, 'cahier', 'bi bi-files', 'Cahier des charges créé');
        this.addActivities(modifiedSheets, 'modification', 'bi bi-pencil-square', 'Cahier des charges modifié');
        this.buildActivityChart();
      }
    });

    // Charger les conformités
    this.complianceService.getAll2().subscribe({
      next: (compliances) => {
        const userCompliances = compliances.filter(c => c.createdBy === this.userEmail);
        this.stats.compliances.created = userCompliances.length;
        this.stats.compliances.items = userCompliances;
        if (userCompliances.length > 0) {
          const dates = userCompliances
            .map(c => c.createdAt)
            .filter(date => date)
            .map(date => new Date(date!))
            .filter(d => !isNaN(d.getTime()));
          this.stats.compliances.lastDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
        }
        this.addActivities(userCompliances, 'conformite', 'bi bi-check2-square', 'Fiche de conformité créée');
        this.buildActivityChart();
      }
    });

    // Charger les dossiers techniques
    this.technicalFileService.getAllDetailed().subscribe({
      next: (files) => {
        const userFiles = files.filter(f => f.createdBy === this.userEmail);
        this.stats.technicalFiles.created = userFiles.length;
        this.stats.technicalFiles.items = userFiles;
        if (userFiles.length > 0) {
          const dates = userFiles
            .map(f => f.createdAt)
            .filter(date => date)
            .map(date => new Date(date!))
            .filter(d => !isNaN(d.getTime()));
          this.stats.technicalFiles.lastDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
        }
        this.addActivities(userFiles, 'technique', 'bi bi-folder', 'Dossier technique créé');
        this.buildActivityChart();
      }
    });
// Charger les réclamations - VERSION CORRIGÉE (created_by pour créées, assigned_to pour reçues)
this.claimService.getAllClaims().subscribe({
  next: (claims) => {
    console.log('🔍 === DIAGNOSTIC RÉCLAMATIONS ===');
    console.log('👤 Email utilisateur:', this.userEmail);
    console.log('📋 Total réclamations:', claims.length);

    // ✅ CRÉÉES = l'utilisateur a CREÉ la réclamation
    const withCreatedBy = claims.filter(c => c.createdBy === this.userEmail);

    // ✅ REÇUES = l'utilisateur est ASSIGNÉ à la réclamation
    const withAssignedTo = claims.filter(c => c.assignedTo === this.userEmail);

    console.log('✅ created_by:', withCreatedBy.length);
    console.log('📌 assigned_to:', withAssignedTo.length);

    // Assigner les valeurs aux statistiques
    this.stats.claims.created = withCreatedBy.length;
    this.stats.claims.received = withAssignedTo.length;
    this.stats.claims.total = withCreatedBy.length + withAssignedTo.length;
    this.stats.claims.items = [...withCreatedBy, ...withAssignedTo];

    if (this.stats.claims.items.length > 0) {
      const dates = this.stats.claims.items
        .map(c => c.createdAt)
        .filter(date => date)
        .map(date => new Date(date))
        .filter(d => !isNaN(d.getTime()));
      this.stats.claims.lastDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
    }

    // Ajouter aux activités
    this.addActivities(withCreatedBy, 'reclamation', 'bi bi-chat-dots', 'Réclamation créée');
    this.addActivities(withAssignedTo, 'reclamation', 'bi bi-inbox', 'Réclamation assignée');

    this.buildActivityChart();
  }
});

    // Vérifier les réceptions
    this.chargeSheetService.getAll().subscribe({
      next: (sheets) => {
        let receptionFound = false;
        let latestReception: Date | null = null;

        sheets.forEach(sheet => {
          this.chargeSheetService.getReceptionHistory(sheet.id).subscribe({
            next: (histories) => {
              const userReceptions = histories.filter(h => h.receivedBy === this.userEmail);
              if (userReceptions.length > 0) {
                receptionFound = true;
                const receptionDates = userReceptions
                  .map(r => r.receptionDate)
                  .filter(date => date)
                  .map(date => new Date(date!))
                  .filter(d => !isNaN(d.getTime()));
                if (receptionDates.length > 0) {
                  const latest = new Date(Math.max(...receptionDates.map(d => d.getTime())));
                  if (!latestReception || latest > latestReception) {
                    latestReception = latest;
                  }
                }
              }
              this.addActivities(userReceptions, 'reception', 'bi bi-truck', 'Réception enregistrée');
            }
          });
        });

        this.hasMadeReception = receptionFound;
        this.lastReceptionDate = latestReception;
        this.buildActivityChart();
      }
    });
  }

  addActivities(items: any[], type: string, icon: string, prefix: string): void {
    items.forEach(item => {
      let date = item.updatedAt || item.createdAt || item.receptionDate || item.date;
      if (date) {
        this.allActivities.push({
          type: type,
          icon: icon,
          title: prefix,
          description: this.getDescription(item, type),
          date: new Date(date),
          rawData: item
        });
      }
    });
    this.sortActivities();
    this.filterActivities();
  }

  getDescription(item: any, type: string): string {
    switch(type) {
      case 'cahier':
        return `Cahier #${item.orderNumber || item.id} - Projet: ${item.project}`;
      case 'modification':
        return `Cahier #${item.orderNumber || item.id} modifié - Statut: ${item.status}`;
      case 'conformite':
        return `Conformité #${item.id} - Item: ${item.item?.itemNumber || 'N/A'}`;
      case 'technique':
        return `Dossier technique #${item.id} - Réf: ${item.reference || 'N/A'}`;
      case 'reclamation':
        return `Réclamation "${item.title}" - Statut: ${item.status || 'Nouvelle'}`;
      case 'reception':
        return `Réception - BL: ${item.deliveryNoteNumber} - ${item.quantityReceived} unités`;
      default:
        return '';
    }
  }

  sortActivities(): void {
    this.allActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  filterActivities(): void {
    if (this.activityFilter === 'all') {
      this.filteredActivities = this.allActivities.slice(0, 10);
    } else {
      const typeMap: { [key: string]: string } = {
        'cahier': 'cahier',
        'conformite': 'conformite',
        'technique': 'technique',
        'reclamation': 'reclamation'
      };
      this.filteredActivities = this.allActivities
        .filter(a => a.type === typeMap[this.activityFilter])
        .slice(0, 10);
    }
  }

  buildActivityChart(): void {
    setTimeout(() => {
      if (!this.activityChartCanvas?.nativeElement) return;
      if (this.activityChart) this.activityChart.destroy();

      const monthlyMap = new Map<string, { cahier: number; conformite: number; technique: number; reclamation: number }>();

      this.allActivities.forEach(activity => {
        const monthKey = `${activity.date.getFullYear()}-${String(activity.date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { cahier: 0, conformite: 0, technique: 0, reclamation: 0 });
        }
        const stats = monthlyMap.get(monthKey)!;
        switch(activity.type) {
          case 'cahier': stats.cahier++; break;
          case 'modification': stats.cahier++; break;
          case 'conformite': stats.conformite++; break;
          case 'technique': stats.technique++; break;
          case 'reclamation': stats.reclamation++; break;
        }
      });

      const months = Array.from(monthlyMap.keys()).sort().slice(-6);
      const cahierData = months.map(m => monthlyMap.get(m)?.cahier || 0);
      const conformiteData = months.map(m => monthlyMap.get(m)?.conformite || 0);
      const techniqueData = months.map(m => monthlyMap.get(m)?.technique || 0);
      const reclamationData = months.map(m => monthlyMap.get(m)?.reclamation || 0);

      const monthLabels = months.map(m => {
        const [year, month] = m.split('-');
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
      });

      const config: ChartConfiguration = {
        type: 'bar',
        data: {
          labels: monthLabels,
          datasets: [
            { label: 'Cahiers', data: cahierData, backgroundColor: '#0d6efd', borderRadius: 8 },
            { label: 'Conformités', data: conformiteData, backgroundColor: '#198754', borderRadius: 8 },
            { label: 'Dossiers techniques', data: techniqueData, backgroundColor: '#0dcaf0', borderRadius: 8 },
            { label: 'Réclamations', data: reclamationData, backgroundColor: '#ffc107', borderRadius: 8 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 },
              title: { display: true, text: 'Nombre d\'activités' }
            }
          }
        }
      };
      this.activityChart = new Chart(this.activityChartCanvas.nativeElement, config);
    }, 200);
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

  onActivityFilterChange(): void {
    this.filterActivities();
  }
}

interface Activity {
  type: string;
  icon: string;
  title: string;
  description: string;
  date: Date;
  rawData: any;
}
