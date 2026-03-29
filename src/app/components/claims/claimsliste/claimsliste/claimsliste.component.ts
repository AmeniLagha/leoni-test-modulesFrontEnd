import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ClaimService } from '../../../../../services/claim.service';
import { Claim } from '../../../../../models/claim.model';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-claimsliste',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './claimsliste.component.html',
  styleUrls: ['./claimsliste.component.css']
})
export class ClaimslisteComponent implements OnInit, OnDestroy {

  claims: Claim[] = [];
  filteredClaims: Claim[] = [];
  loading = true;

  // Filtres
  searchTerm: string = '';
  monthFilter: string = '';      // Nouveau: filtre par mois
  yearFilter: string = '';       // Nouveau: filtre par année
  priorityFilter: string = '';
  availableYears: number[] = [];  // Liste des années disponibles

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  Math = Math;

  editingClaim: Claim | null = null;
  editingType: 'assign' | 'resolve' | null = null;
  editForm!: FormGroup;

  // Propriétés pour la gestion des images
  imageUrls: Map<number, SafeUrl> = new Map();
  imageLoading: Map<number, boolean> = new Map();
  showImageModal = false;
  modalImageUrl: SafeUrl | null = null;

  constructor(
    private claimService: ClaimService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadClaims();
    this.initEditForm();
  }

  initEditForm(): void {
    this.editForm = this.fb.group({
      assignedTo: [''],
      estimatedResolutionDate: [''],
      actionTaken: [''],
      resolution: [''],
      actualResolutionDate: ['']
    });
  }

  // ========== CHARGEMENT DES DONNÉES ==========
  loadClaims() {
    this.loading = true;
    this.claimService.getAllClaims().subscribe({
      next: (res: Claim[]) => {
        this.claims = res;
        this.extractAvailableYears();
        this.applyFilters();
        this.loadImagesForClaims();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // Extraire les années disponibles à partir des dates des réclamations
  extractAvailableYears(): void {
    const years = new Set<number>();
    this.claims.forEach(claim => {
      if (claim.reportedDate) {
        const year = new Date(claim.reportedDate).getFullYear();
        years.add(year);
      }
    });
    this.availableYears = Array.from(years).sort((a, b) => b - a);
  }

  // Obtenir le nom du mois
  getMonthName(month: string): string {
    const months: { [key: string]: string } = {
      '1': 'Janvier', '2': 'Février', '3': 'Mars', '4': 'Avril',
      '5': 'Mai', '6': 'Juin', '7': 'Juillet', '8': 'Août',
      '9': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
    };
    return months[month] || '';
  }

  // ========== FILTRES ==========
  applyFilters(): void {
    this.filteredClaims = this.claims.filter(claim => {
      // Filtre par recherche textuelle
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        const matchId = claim.id?.toString().includes(term) || false;
        const matchTitle = claim.title?.toLowerCase().includes(term) || false;
        const matchReporter = claim.reportedBy?.toLowerCase().includes(term) || false;
        if (!matchId && !matchTitle && !matchReporter) {
          return false;
        }
      }

      // Filtre par mois et année
      if (claim.reportedDate) {
        const claimDate = new Date(claim.reportedDate);
        const claimMonth = (claimDate.getMonth() + 1).toString();
        const claimYear = claimDate.getFullYear().toString();

        if (this.monthFilter && claimMonth !== this.monthFilter) {
          return false;
        }
        if (this.yearFilter && claimYear !== this.yearFilter) {
          return false;
        }
      } else if (this.monthFilter || this.yearFilter) {
        return false;
      }

      // Filtre par priorité
      if (this.priorityFilter && claim.priority !== this.priorityFilter) {
        return false;
      }

      return true;
    });

    this.totalPages = Math.ceil(this.filteredClaims.length / this.pageSize);
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.monthFilter || this.yearFilter || this.priorityFilter);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.monthFilter = '';
    this.yearFilter = '';
    this.priorityFilter = '';
    this.applyFilters();
  }

  // ========== PAGINATION ==========
  get paginatedClaims(): Claim[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredClaims.slice(start, end);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.filteredClaims.length / this.pageSize);
  }

  // ========== GESTION DES IMAGES ==========
  loadImagesForClaims(): void {
    this.claims.forEach(claim => {
      if (claim.id && claim.imagePath) {
        this.imageLoading.set(claim.id, true);
        this.loadClaimImage(claim.id);
      }
    });
  }

  loadClaimImage(claimId: number): void {
    this.claimService.getClaimImageUrl(claimId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const oldUrl = this.imageUrls.get(claimId);
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl.toString());
        }
        const safeUrl = this.sanitizer.bypassSecurityTrustUrl(url);
        this.imageUrls.set(claimId, safeUrl);
        this.imageLoading.set(claimId, false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(`Erreur chargement image pour claim ${claimId}:`, err);
        this.imageLoading.set(claimId, false);
        this.cdr.detectChanges();
      }
    });
  }

  getImageUrl(claimId: number): SafeUrl | null {
    return this.imageUrls.get(claimId) || null;
  }

  isImageLoading(claimId: number): boolean {
    return this.imageLoading.get(claimId) || false;
  }

  handleImageError(event: any, claimId: number): void {
    console.error(`Erreur affichage image pour claim ${claimId}`);
    event.target.style.display = 'none';
    this.imageLoading.set(claimId, false);
  }

  openImageModal(claimId: number): void {
    this.modalImageUrl = this.getImageUrl(claimId);
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.modalImageUrl = null;
  }

  // ========== ACTIONS ==========
  startClaim(claim: Claim) {
    if (!claim.id) return;
    this.claimService.start(claim.id).subscribe({
      next: () => {
        claim.status = 'IN_PROGRESS';
        this.loadClaims();
      },
      error: (err) => console.error('Erreur lors de la mise à jour du statut', err)
    });
  }

  openForm(c: Claim, type: 'assign'|'resolve') {
    this.editingClaim = c;
    this.editingType = type;

    if (type === 'assign') {
      this.editForm.patchValue({
        assignedTo: c.assignedTo || '',
        estimatedResolutionDate: c.estimatedResolutionDate ? this.formatDateInput(c.estimatedResolutionDate) : ''
      });
    } else {
      this.editForm.patchValue({
        actionTaken: c.actionTaken || '',
        resolution: c.resolution || '',
        actualResolutionDate: c.actualResolutionDate ? this.formatDateInput(c.actualResolutionDate) : ''
      });
    }
  }

  cancelEdit() {
    this.editingClaim = null;
    this.editingType = null;
  }

  submitEdit() {
    if (!this.editingClaim) return;
    const id = this.editingClaim.id!;

    if (this.editingType === 'assign') {
      this.claimService.assign(id, this.editForm.value).subscribe(() => this.afterEdit());
    } else if (this.editingType === 'resolve') {
      const resolvePayload = {
        ...this.editForm.value,
        status: 'RESOLVED'
      };
      this.claimService.resolve(id, resolvePayload).subscribe(() => this.afterEdit());
    }
  }

  afterEdit() {
    this.cancelEdit();
    this.loadClaims();
  }

  formatDateInput(date: string | Date) {
    const d = new Date(date);
    return d.toISOString().substring(0,10);
  }

  formatDate(value: string | Date | undefined): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString();
  }

  getStatusClass(status: string) {
    switch(status) {
      case 'NEW': return 'badge bg-primary';
      case 'ASSIGNED': return 'badge bg-info';
      case 'IN_PROGRESS': return 'badge bg-warning';
      case 'RESOLVED': return 'badge bg-success';
      default: return '';
    }
  }

  // ========== LABELS ET BADGES ==========
  getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      'LOW': 'Basse',
      'MEDIUM': 'Moyenne',
      'HIGH': 'Haute',
      'CRITICAL': 'Critique'
    };
    return labels[priority] || priority;
  }

  getPriorityBadgeClass(priority: string): string {
    const classes: { [key: string]: string } = {
      'LOW': 'priority-low',
      'MEDIUM': 'priority-medium',
      'HIGH': 'priority-high',
      'CRITICAL': 'priority-critical'
    };
    return classes[priority] || 'bg-secondary';
  }

  getPriorityIcon(priority: string): string {
    const icons: { [key: string]: string } = {
      'LOW': 'bi-arrow-down-circle',
      'MEDIUM': 'bi-dash-circle',
      'HIGH': 'bi-arrow-up-circle',
      'CRITICAL': 'bi-exclamation-triangle'
    };
    return icons[priority] || 'bi-question-circle';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'NEW': 'Nouveau',
      'ASSIGNED': 'Assigné',
      'IN_PROGRESS': 'En cours',
      'RESOLVED': 'Résolu',
      'CLOSED': 'Fermé'
    };
    return labels[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'NEW': 'status-new',
      'ASSIGNED': 'status-assigned',
      'IN_PROGRESS': 'status-in-progress',
      'RESOLVED': 'status-resolved',
      'CLOSED': 'status-closed'
    };
    return classes[status] || 'bg-secondary';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'NEW': 'bi-plus-circle',
      'ASSIGNED': 'bi-person-check',
      'IN_PROGRESS': 'bi-arrow-repeat',
      'RESOLVED': 'bi-check2-circle',
      'CLOSED': 'bi-check-all'
    };
    return icons[status] || 'bi-question-circle';
  }

  // ========== EXPORT PDF ==========
  exportClaimPDF(claim: Claim) {
    const doc = new jsPDF();

    const logo = "assets/leonilogo.png";
    doc.addImage(logo, 'PNG', 15, 8, 30, 15);

    doc.setFontSize(20);
    doc.text("CLAIM REPORT", 105, 15, { align: "center" });

    doc.setFontSize(10);
    doc.text("Generated: " + new Date().toLocaleDateString(), 14, 30);

    autoTable(doc,{
      startY: 40,
      head: [['Field','Value']],
      body: [
        ['ID', String(claim.id)],
        ['Title', claim.title || '-'],
        ['Priority', this.getPriorityLabel(claim.priority || '')],
        ['Status', this.getStatusLabel(claim.status || '')],
        ['Reported By', claim.reportedBy || '-'],
        ['Reported Date', this.formatDate(claim.reportedDate)],
        ['Assigned To', claim.assignedTo || '-'],
        ['Estimated Resolution', this.formatDate(claim.estimatedResolutionDate)],
        ['Action Taken', claim.actionTaken || '-'],
        ['Resolution', claim.resolution || '-'],
        ['Actual Resolution', this.formatDate(claim.actualResolutionDate)]
      ],

      headStyles:{
        fillColor:[52,58,64]
      },

      styles:{
        fontSize:10
      },

      didParseCell: (data) => {
        const row = data.row.raw as any[];

        if(row && row[0] === 'Priority') {
          const priority = data.cell.raw;

          if(priority === 'CRITICAL'){
            data.cell.styles.textColor = [220,53,69];
            data.cell.styles.fontStyle = 'bold';
          }

          if(priority === 'MEDIUM'){
            data.cell.styles.textColor = [255,193,7];
            data.cell.styles.fontStyle = 'bold';
          }

          if(priority === 'LOW'){
            data.cell.styles.textColor = [40,167,69];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    const pageHeight = doc.internal.pageSize.height;

    doc.setFontSize(10);
    doc.text("Quality Claim Management System", 14, pageHeight - 20);
    doc.text("Signature: ____________________", 140, pageHeight - 20);

    doc.save(`claim-report-${claim.id}.pdf`);
  }

  exportAllClaimsPDF() {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("QUALITY CLAIM REPORT", 105, 15, { align: "center" });

    doc.setFontSize(10);
    doc.text("Generated: " + new Date().toLocaleDateString(), 14, 25);

    const newCount = this.claims.filter(c => c.status === 'NEW').length;
    const assignedCount = this.claims.filter(c => c.status === 'ASSIGNED').length;
    const progressCount = this.claims.filter(c => c.status === 'IN_PROGRESS').length;
    const resolvedCount = this.claims.filter(c => c.status === 'RESOLVED').length;

    doc.setFontSize(12);
    doc.text("Claims Summary:", 14, 40);

    doc.setFontSize(10);
    doc.text(`NEW: ${newCount}`, 14, 48);
    doc.text(`ASSIGNED: ${assignedCount}`, 60, 48);
    doc.text(`IN_PROGRESS: ${progressCount}`, 120, 48);
    doc.text(`RESOLVED: ${resolvedCount}`, 170, 48);

    const tableData = this.claims.map(c => [
      c.id,
      c.title,
      this.getPriorityLabel(c.priority || ''),
      this.getStatusLabel(c.status || ''),
      c.reportedBy,
      new Date(c.reportedDate).toLocaleDateString()
    ]);

    autoTable(doc,{
      startY: 60,
      head: [['ID','Title','Priority','Status','Reporter','Date']],
      body: tableData,
      headStyles:{
        fillColor:[52,58,64]
      },
      styles:{
        fontSize:9
      },
      didDrawPage: function(data) {
        const pageCount = doc.getNumberOfPages();
        const pageSize = doc.internal.pageSize.height;

        doc.setFontSize(9);
        doc.text("Quality Claim Management System", 14, pageSize - 10);
        doc.text("Page " + pageCount, 190, pageSize - 10);
      }
    });

    doc.save("quality-claims-report.pdf");
  }

  ngOnDestroy(): void {
    this.imageUrls.forEach((url) => {
      URL.revokeObjectURL(url.toString());
    });
  }
}
