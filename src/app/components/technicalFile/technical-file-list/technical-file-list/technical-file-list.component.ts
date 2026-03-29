// technical-file-list.component.ts
import { Component, OnInit } from '@angular/core';
import { TechnicalFileService } from '../../../../../services/technical-file.service';
import { TechnicalFileDetail } from '../../../../../models/technical-file.model';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-technical-file-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './technical-file-list.component.html',
  styleUrls: ['./technical-file-list.component.css']
})
export class TechnicalFileListComponent implements OnInit {

  technicalFiles: TechnicalFileDetail[] = [];
  filteredFiles: TechnicalFileDetail[] = [];
  loading = false;
  error: string | null = null;
  currentUserRole: string = '';
 // ==================== RECHERCHE ====================
  searchTerm: string = '';
  // ==================== ÉTAT DES DOSSIERS PLIABLES ====================
  expandedFolders: { [key: number]: boolean } = {};

  // ==================== ÉDITION INLINE DE LA RÉFÉRENCE ====================
  editingRefId: number | null = null;
  editRefValue: string = '';

  constructor(
    private service: TechnicalFileService,
    private router: Router
  ) {}

  ngOnInit() {
     this.currentUserRole = localStorage.getItem('userRole') || '';
  console.log('Rôle utilisateur:', this.currentUserRole); // ✅ AJOUTER
    this.loadAllTechnicalFiles();
  }

  loadAllTechnicalFiles() {
    this.loading = true;
    this.service.getAllDetailed().subscribe({
      next: (files) => {
        this.technicalFiles = files;
        this.loading = false;

        // Initialiser tous les dossiers comme fermés
        files.forEach(file => {
          this.expandedFolders[file.id] = false;
        });
      },
      error: (err) => {
        console.error('Erreur chargement:', err);
        this.error = 'Impossible de charger les dossiers techniques';
        this.loading = false;
      }
    });
  }
 // ==================== FONCTIONS DE RECHERCHE ====================
  applyFilter() {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredFiles = this.technicalFiles;
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredFiles = this.technicalFiles.filter(file =>
        (file.reference && file.reference.toLowerCase().includes(term)) ||
        (file.createdBy && file.createdBy.toLowerCase().includes(term))
      );
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredFiles = this.technicalFiles;
  }

  // Fonction pour surligner le texte recherché
  highlightText(text: string): string {
    if (!this.searchTerm || !text) return text;

    const term = this.searchTerm.toLowerCase().trim();
    const textLower = text.toLowerCase();

    if (!textLower.includes(term)) return text;

    const index = textLower.indexOf(term);
    const before = text.substring(0, index);
    const match = text.substring(index, index + term.length);
    const after = text.substring(index + term.length);

    return `${before}<span style="background-color: #fef3c7; color: #92400e; font-weight: 600; padding: 2px 0;">${match}</span>${after}`;
  }

  // ==================== GESTION DES DOSSIERS PLIABLES ====================
  toggleFolder(fileId: number) {
    this.expandedFolders[fileId] = !this.expandedFolders[fileId];
  }

  // ==================== ACTIONS SUR LES DOSSIERS ====================

  // ✅ Édition inline de la référence
  startEditReference(file: any) {
    this.editingRefId = file.id;
    this.editRefValue = file.reference || '';
  }

  cancelEditReference() {
    this.editingRefId = null;
    this.editRefValue = '';
  }

  saveReferenceInline(fileId: number) {
    if (!this.editRefValue || this.editRefValue.trim() === '') {
      alert('La référence ne peut pas être vide');
      return;
    }

    const updateDto = {
      reference: this.editRefValue.trim()
    };

    this.service.update(fileId, updateDto).subscribe({
      next: () => {
        this.editingRefId = null;
        this.editRefValue = '';
        this.loadAllTechnicalFiles(); // Recharger la liste
      },
      error: (err) => {
        console.error('Erreur mise à jour:', err);
        alert('❌ Erreur lors de la mise à jour: ' + (err.error?.message || err.message));
      }
    });
  }

  delete(id: number) {
    if (confirm('Voulez-vous vraiment supprimer ce dossier technique ?')) {
      this.service.delete(id).subscribe({
        next: () => {
          alert('✅ Dossier supprimé');
          this.loadAllTechnicalFiles();
        },
        error: err => console.error('Erreur suppression', err)
      });
    }
  }

  historyAuditedFile(fileId: number) {
    this.service.getFullHistoryAudited(fileId).subscribe({
      next: (history) => {
        console.log('Historique complet du dossier', history);
        this.router.navigate(['/technical-files', fileId, 'history-audited']);
      },
      error: (err) => {
        console.error('Erreur récupération historique:', err);
        alert('Impossible de charger l\'historique complet du dossier.');
      }
    });
  }

  // ==================== ACTIONS SUR LES ITEMS ====================

  editItem(itemId: number) {
    this.router.navigate(['/technical-files/items', itemId, 'edit']);
  }

  deleteItem(itemId: number) {
    const item = this.findItemById(itemId);
    const itemInfo = item ? `Item #${item.itemNumber}` : `Item ID ${itemId}`;

    const message = `⚠️ Voulez-vous vraiment supprimer ${itemInfo} ?\n\n` +
                    `Cette action est irréversible.`;

    if (confirm(message)) {
      this.service.deleteItem(itemId).subscribe({
        next: () => {
          alert('✅ Item supprimé avec succès');
          this.loadAllTechnicalFiles();
        },
        error: (err) => {
          console.error('Erreur suppression item:', err);
          alert('❌ Erreur lors de la suppression: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  historyAuditedItem(itemId: number) {
    this.router.navigate(['/technical-files/items', itemId, 'history-audited']);
  }

  detailItem(itemId: number) {
    this.router.navigate(['/technical-files/items', itemId, 'detail']);
  }

  // ==================== UTILITAIRES ====================

  private findItemById(itemId: number): any {
    for (const file of this.technicalFiles) {
      const item = file.items?.find(i => i.id === itemId);
      if (item) return item;
    }
    return null;
  }
 // technical-file-list.component.ts

// ==================== GESTION DES STATUTS ====================


// ✅ CORRECTION : Accepter string | undefined
getStatusClass(status: string | undefined): string {
  if (!status) return 'status-default';
  switch (status) {
    case 'DRAFT': return 'status-draft';
    case 'VALIDATED_PP': return 'status-pp';
    case 'VALIDATED_MC': return 'status-mc';
    case 'VALIDATED_MP': return 'status-mp';
    default: return 'status-default';
  }
}

// ✅ CORRECTION : Accepter string | undefined
getStatusLabel(status: string | undefined): string {
  if (!status) return '⚪ Non défini';
  switch (status) {
    case 'DRAFT': return '📝 Brouillon';
    case 'VALIDATED_PP': return '✅ Validé PP';
    case 'VALIDATED_MC': return '✅ Validé MC';
    case 'VALIDATED_MP': return '🏁 Validé MP';
    default: return status;
  }
}

validateItem(itemId: number) {
  console.log('validateItem appelé pour ID:', itemId); // ✅ AJOUTER

  const confirmMsg = `Voulez-vous valider cet item en tant que ${this.currentUserRole} ?`;
  if (confirm(confirmMsg)) {
    this.service.validateItem(itemId).subscribe({
      next: () => {
        alert(`✅ Item validé par ${this.currentUserRole}`);
        this.loadAllTechnicalFiles();
      },
      error: (err) => {
        console.error('Erreur validation:', err);
        alert('❌ ' + (err.error?.message || 'Erreur lors de la validation'));
      }
    });
  }
}
// technical-file-list.component.ts

// ==================== GESTION DES DROITS ====================

// Vérifier si l'utilisateur peut valider l'item
canValidateItem(item: any): boolean {
  const status = item.validationStatus;
  switch (this.currentUserRole) {
    case 'PP': return status === 'DRAFT';
    case 'MC': return status === 'VALIDATED_PP';
    case 'MP': return status === 'VALIDATED_PP';
    default: return false;
  }
}

// ✅ Vérifier si l'utilisateur peut modifier l'item
canEditItem(item: any): boolean {
  const status = item.validationStatus;

  switch (this.currentUserRole) {
     case 'ADMIN':
      // PP peut TOUJOURS modifier (pour ajouter des items)
      return true;
    case 'PP':
      // PP peut TOUJOURS modifier (pour ajouter des items)
      return true;
    case 'MC':
      // MC peut modifier seulement si statut = VALIDATED_PP
      return status === 'VALIDATED_PP';
    case 'MP':
      // MP peut modifier seulement si statut = VALIDATED_MC
      return status === 'VALIDATED_PP';
    default:
      return false;
  }
}

// ✅ Vérifier si l'utilisateur peut supprimer l'item
canDeleteItem(item: any): boolean {
  const status = item.validationStatus;

  switch (this.currentUserRole) {
    case 'ADMIN':
      return true;
    case 'PP':
      // PP peut supprimer seulement si DRAFT (ou toujours ? à définir)
      return status === 'DRAFT';
    case 'MC':
      // MC peut supprimer seulement si VALIDATED_PP
      return status === 'VALIDATED_PP';
    case 'MP':
      // MP peut supprimer seulement si VALIDATED_MC
      return status === 'VALIDATED_MC';
    default:
      return false;
  }
}

// Vérifier si l'utilisateur peut voir l'historique (toujours)
canViewHistory(item: any): boolean {
  return true;
}

// Vérifier si l'utilisateur peut voir les détails (toujours)
canViewDetail(item: any): boolean {
  return true;
}
}
