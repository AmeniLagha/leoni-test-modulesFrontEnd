// claimsliste.component.ts
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
  monthFilter: string = '';
  yearFilter: string = '';
  priorityFilter: string = '';
  statusFilter: string = '';
  availableYears: number[] = [];

  availableMonths = [
    { value: '1', label: 'Janvier' }, { value: '2', label: 'Février' },
    { value: '3', label: 'Mars' }, { value: '4', label: 'Avril' },
    { value: '5', label: 'Mai' }, { value: '6', label: 'Juin' },
    { value: '7', label: 'Juillet' }, { value: '8', label: 'Août' },
    { value: '9', label: 'Septembre' }, { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' }, { value: '12', label: 'Décembre' }
  ];

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  Math = Math;

  editingClaim: Claim | null = null;
  editingType: 'assign' | 'resolve' | null = null;
  editForm!: FormGroup;

  // Images
  imageUrls: Map<number, SafeUrl> = new Map();
  imageLoading: Map<number, boolean> = new Map();
  showImageModal = false;
  modalImageUrl: SafeUrl | null = null;

  // ✅ NOUVEAUX ONGLETS
  activeTab: 'all' | 'compliance' | 'chargeSheet' = 'all';

  allClaims: Claim[] = [];
  complianceClaims: Claim[] = [];
  chargeSheetClaims: Claim[] = [];

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
   loadClaims() {
    this.loading = true;
    this.claimService.getAllClaims().subscribe({
      next: (res: Claim[]) => {
        this.allClaims = res;

        // ✅ Séparer les réclamations par type
        this.complianceClaims = res.filter(claim => claim.relatedTo === 'COMPLIANCE');
        this.chargeSheetClaims = res.filter(claim => claim.relatedTo === 'CHARGE_SHEET');

        this.extractAvailableYears();
        this.applyFilters();
        this.loadImagesForClaims();
        this.loading = false;
      },
      error: () => this.loading = false
    });
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



  extractAvailableYears(): void {
    const years = new Set<number>();
    this.claims.forEach(claim => {
      if (claim.reportedDate) years.add(new Date(claim.reportedDate).getFullYear());
    });
    this.availableYears = Array.from(years).sort((a, b) => b - a);
  }

    applyFilters(): void {
    let sourceClaims: Claim[] = [];

    switch (this.activeTab) {
      case 'all':
        sourceClaims = this.allClaims;
        break;
      case 'compliance':
        sourceClaims = this.complianceClaims;
        break;
      case 'chargeSheet':
        sourceClaims = this.chargeSheetClaims;
        break;
    }

    this.filteredClaims = sourceClaims.filter(claim => {
      // Recherche
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        if (!claim.id?.toString().includes(term) &&
            !claim.title?.toLowerCase().includes(term) &&
            !claim.reportedBy?.toLowerCase().includes(term)) {
          return false;
        }
      }

      // Date
      if (claim.reportedDate) {
        const date = new Date(claim.reportedDate);
        if (this.monthFilter && (date.getMonth() + 1).toString() !== this.monthFilter) return false;
        if (this.yearFilter && date.getFullYear().toString() !== this.yearFilter) return false;
      }

      // Priorité
      if (this.priorityFilter && claim.priority !== this.priorityFilter) return false;

      // Statut
      if (this.statusFilter && claim.status !== this.statusFilter) return false;

      return true;
    });

    this.totalPages = Math.ceil(this.filteredClaims.length / this.pageSize);
    this.currentPage = 1;
  }

  // ✅ Mettre à jour resetFilters
  resetFilters(): void {
    this.searchTerm = '';
    this.monthFilter = '';
    this.yearFilter = '';
    this.priorityFilter = '';
    this.statusFilter = '';
    this.applyFilters();
  }

  // ✅ Méthode pour obtenir le badge de type de réclamation
 // ✅ Accepter string | undefined
getRelatedToLabel(relatedTo: string | undefined): string {
  if (!relatedTo) return 'Autre';
  switch (relatedTo) {
    case 'COMPLIANCE':
      return 'Conformité';
    case 'CHARGE_SHEET':
      return 'Cahier de charge';
    default:
      return 'Autre';
  }
}

// ✅ Accepter string | undefined
getRelatedToBadgeClass(relatedTo: string | undefined): string {
  if (!relatedTo) return 'bg-secondary bg-opacity-10 text-secondary';
  switch (relatedTo) {
    case 'COMPLIANCE':
      return 'bg-primary bg-opacity-10 text-primary';
    case 'CHARGE_SHEET':
      return 'bg-success bg-opacity-10 text-success';
    default:
      return 'bg-secondary bg-opacity-10 text-secondary';
  }
}

// ✅ Accepter string | undefined
getRelatedToIcon(relatedTo: string | undefined): string {
  if (!relatedTo) return 'bi-question-circle';
  switch (relatedTo) {
    case 'COMPLIANCE':
      return 'bi-file-earmark-check';
    case 'CHARGE_SHEET':
      return 'bi-files';
    default:
      return 'bi-question-circle';
  }
}

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.monthFilter || this.yearFilter || this.priorityFilter || this.statusFilter);
  }



  get paginatedClaims(): Claim[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredClaims.slice(start, start + this.pageSize);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.filteredClaims.length / this.pageSize);
  }

  // ========== IMAGES ==========
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
        if (oldUrl) URL.revokeObjectURL(oldUrl.toString());
        this.imageUrls.set(claimId, this.sanitizer.bypassSecurityTrustUrl(url));
        this.imageLoading.set(claimId, false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.imageLoading.set(claimId, false);
      }
    });
  }

  getImageUrl(claimId: number): SafeUrl | null {
    return this.imageUrls.get(claimId) || null;
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
      next: () => this.loadClaims(),
      error: (err) => console.error(err)
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
      this.claimService.resolve(id, { ...this.editForm.value, status: 'RESOLVED' }).subscribe(() => this.afterEdit());
    }
  }

  afterEdit() {
    this.cancelEdit();
    this.loadClaims();
  }

  formatDateInput(date: string | Date): string {
    return new Date(date).toISOString().substring(0, 10);
  }

  formatDate(value: string | Date | undefined): string {
    return value ? new Date(value).toLocaleDateString() : '-';
  }

  // ========== LABELS ==========
  getPriorityLabel(p: string): string {
    return { 'LOW': 'Basse', 'MEDIUM': 'Moyenne', 'HIGH': 'Haute', 'CRITICAL': 'Critique' }[p] || p;
  }

  getPriorityBadgeClass(p: string): string {
    return { 'LOW': 'bg-success', 'MEDIUM': 'bg-warning', 'HIGH': 'bg-danger', 'CRITICAL': 'bg-dark' }[p] || 'bg-secondary';
  }

  getStatusLabel(s: string): string {
    return { 'ASSIGNED': 'Assigné', 'IN_PROGRESS': 'En cours', 'RESOLVED': 'Résolu', 'CLOSED': 'Fermé' }[s] || s;
  }

  getStatusBadgeClass(s: string): string {
    return { 'ASSIGNED': 'bg-info', 'IN_PROGRESS': 'bg-warning', 'RESOLVED': 'bg-success', 'CLOSED': 'bg-secondary' }[s] || 'bg-secondary';
  }

  // ========== EXPORT PDF COMPLET ==========
  exportClaimPDF(claim: Claim) {
    const doc = new jsPDF();

    // Logo
    doc.addImage("assets/leonilogo.png", 'PNG', 15, 8, 30, 15);

    // Titre
    doc.setFontSize(18);
    doc.text("RAPPORT DE RÉCLAMATION", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Réclamation #${claim.id}`, 14, 38);

    // Section 1: Informations générales
    doc.setFontSize(12);
    doc.text("1. INFORMATIONS GÉNÉRALES", 14, 50);

    autoTable(doc, {
      startY: 55,
      head: [['Champ', 'Valeur']],
      body: [
        ['ID', claim.id?.toString() || '-'],
        ['Plant', claim.plant || '-'],
        ['Customer', claim.customer || '-'],
        ['Contact Person', claim.contactPerson || '-'],
        ['Customer Email', claim.customerEmail || '-'],
        ['Customer Phone', claim.customerPhone || '-'],
        ['Supplier', claim.supplier || '-'],
        ['Supplier Contact', claim.supplierContactPerson || '-'],
        ['Order Number', claim.orderNumber || '-'],
        ['Test Module Number', claim.testModuleNumber || '-'],
        ['Test Module Quantity', claim.testModuleQuantity?.toString() || '-'],
        ['PPO Signature', claim.ppoSignature || '-'],
        ['Claim Date', this.formatDate(claim.claimDate)],
        ['Date de création', this.formatDate(claim.createdAt)],
        ['Créé par', claim.createdBy || '-']
      ],
      headStyles: { fillColor: [30, 60, 114] },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
    });

    // Section 2: Description du problème
    let y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text("2. DESCRIPTION DU PROBLÈME", 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Question', 'Réponse']],
      body: [
        ['What happened?', claim.problemWhatHappened || '-'],
        ['Why is it a problem?', claim.problemWhy || '-'],
        ['When detected?', claim.problemWhenDetected || '-'],
        ['Who detected?', claim.problemWhoDetected || '-'],
        ['Where detected?', claim.problemWhereDetected || '-'],
        ['How detected?', claim.problemHowDetected || '-']
      ],
      headStyles: { fillColor: [30, 60, 114] },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
    });

    // Section 3: Suivi de la réclamation
    y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text("3. SUIVI DE LA RÉCLAMATION", 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Champ', 'Valeur']],
      body: [
        ['Titre', claim.title || '-'],
        ['Description', claim.description || '-'],
        ['Priorité', this.getPriorityLabel(claim.priority || '')],
        ['Statut', this.getStatusLabel(claim.status || '')],
        ['Reporté par', claim.reportedBy || '-'],
        ['Date report', this.formatDate(claim.reportedDate)],
        ['Assigné à', claim.assignedTo || '-'],
        ['Date assignation', this.formatDate(claim.assignedDate)],
        ['Action prise', claim.actionTaken || '-'],
        ['Résolution', claim.resolution || '-'],
        ['Résolu par', claim.resolvedBy || '-'],
        ['Date résolution', this.formatDate(claim.resolvedDate)],
        ['Date estimée', this.formatDate(claim.estimatedResolutionDate)],
        ['Date réelle', this.formatDate(claim.actualResolutionDate)]
      ],
      headStyles: { fillColor: [30, 60, 114] },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
    });

    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text("Système de Gestion Qualité Leoni", 14, doc.internal.pageSize.height - 10);
      doc.text(`Page ${i}/${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
    }

    doc.save(`reclamation_${claim.id}.pdf`);
  }

  exportAllClaimsPDF() {
    const doc = new jsPDF();

    doc.addImage("assets/leonilogo.png", 'PNG', 15, 8, 30, 15);
    doc.setFontSize(18);
    doc.text("RAPPORT GLOBAL DES RÉCLAMATIONS", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 32);
    doc.text(`Total: ${this.filteredClaims.length} réclamation(s)`, 14, 40);

    // Résumé
    const byStatus = {
      ASSIGNED: this.filteredClaims.filter(c => c.status === 'ASSIGNED').length,
      IN_PROGRESS: this.filteredClaims.filter(c => c.status === 'IN_PROGRESS').length,
      RESOLVED: this.filteredClaims.filter(c => c.status === 'RESOLVED').length,
      CLOSED: this.filteredClaims.filter(c => c.status === 'CLOSED').length
    };

    autoTable(doc, {
      startY: 48,
      head: [['Statut', 'Nombre']],
      body: [
        ['Assigné', byStatus.ASSIGNED],
        ['En cours', byStatus.IN_PROGRESS],
        ['Résolu', byStatus.RESOLVED],
        ['Fermé', byStatus.CLOSED]
      ],
      headStyles: { fillColor: [30, 60, 114] }
    });

    // Liste des réclamations
    let y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text("Liste détaillée des réclamations", 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['ID', 'Titre', 'Priorité', 'Statut', 'Reporté par', 'Date']],
      body: this.filteredClaims.map(c => [
        c.id,
        c.title,
        this.getPriorityLabel(c.priority || ''),
        this.getStatusLabel(c.status || ''),
        c.reportedBy,
        this.formatDate(c.reportedDate)
      ]),
      headStyles: { fillColor: [30, 60, 114] },
      styles: { fontSize: 8 }
    });

    doc.save(`reclamations_global_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  ngOnDestroy(): void {
    this.imageUrls.forEach(url => URL.revokeObjectURL(url.toString()));
  }
}
