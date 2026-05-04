import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../../../services/UserService';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Site } from '../../../../../models/site.model';
import { SiteService } from '../../../../../services/Site';
import { Projet, ProjetService } from '../../../../../services/projet.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-utilisateur',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule,RouterLink],
  templateUrl: './utilisateur.component.html',
  styleUrls: ['./utilisateur.component.css']
})
export class UtilisateurComponent implements OnInit {

  users: any[] = [];
  filteredUsers: any[] = [];
  loading = true;
  error = '';
  searchTerm = '';
 filterRole: string = '';     // Filtre par rôle
  filterSite: string = '';
   sites: Site[] = [];
  loadingSites = false;
   projets: Projet[] = [];
   loadingProjets = false;
  // Modal
  editForm!: FormGroup;
  selectedUserId!: number;
  showModal = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;

  constructor(
    private userService: UserService,
    private fb: FormBuilder,private siteService: SiteService, private projetService: ProjetService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadSites();
    this.initPasswordForm();
     this.loadProjets();
    this.initForm();
  }

   // utilisateur.component.ts - Modifier loadProjets()

loadProjets(): void {
  this.loadingProjets = true;
  this.projetService.getActive().subscribe({
    next: (response: any) => {  // ← Changer le type pour accepter ApiResponse
      // ✅ Extraire le tableau de response.data
      const projetsData = response.data || response;
      this.projets = Array.isArray(projetsData) ? projetsData : [];
      this.loadingProjets = false;
      console.log('✅ Projets chargés:', this.projets);
    },
    error: (err) => {
      console.error('❌ Erreur chargement projets:', err);
      this.loadingProjets = false;
    }
  });
}
// ✅ Charger la liste des sites
 loadSites(): void {
  this.loadingSites = true;
  this.siteService.getAll().subscribe({
    next: (response: any) => {  // ← Changer le type
      // ✅ Extraire le tableau de response.data
      const sitesData = response.data || response;
      this.sites = Array.isArray(sitesData) ? sitesData : [];
      this.loadingSites = false;
      console.log('✅ Sites chargés:', this.sites);
    },
    error: (err) => {
      console.error('❌ Erreur chargement sites:', err);
      this.loadingSites = false;
    }
  });
}
  initForm() {
    this.editForm = this.fb.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      matricule: ['', Validators.required],
    projets: [[], Validators.required],
     siteName: ['', Validators.required],
      role: ['', Validators.required]
    });
  }

// utilisateur.component.ts - Modifier uniquement cette méthode

loadUsers() {
  this.loading = true;
  this.userService.getUsers().subscribe({
    next: (res: any) => {
      // ✅ Vérifier si res a une propriété data (ApiResponse)
      if (res && res.data && Array.isArray(res.data)) {
        this.users = res.data;
      }
      // ✅ Si c'est déjà un tableau
      else if (Array.isArray(res)) {
        this.users = res;
      }
      // ✅ Sinon, log pour debug
      else {
        console.error('Format inattendu:', res);
        this.users = [];
      }

      this.filteredUsers = [...this.users];
      this.loading = false;
    },
    error: () => {
      this.error = 'Impossible de récupérer les utilisateurs';
      this.loading = false;
    }
  });
}

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  applyFilter() {
  const term = this.searchTerm.toLowerCase();

  this.filteredUsers = this.users.filter(u => {
    // Filtre par recherche textuelle
    const matchesSearch =
      u.firstname?.toLowerCase().includes(term) ||
      u.lastname?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      ('' + u.matricule).includes(term) ||
      (u.site?.toLowerCase() || '').includes(term);

    // Filtre par rôle
    const matchesRole = !this.filterRole || u.role === this.filterRole;

    // Filtre par site
    const matchesSite = !this.filterSite || u.site === this.filterSite;

    return matchesSearch && matchesRole && matchesSite;
  });

  this.currentPage = 1;
}

  paginatedUsers() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  totalPages() {
    return Math.ceil(this.filteredUsers.length / this.pageSize);
  }

  pagesArray() {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  previousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) this.currentPage++;
  }

  goToPage(page: number) {
    this.currentPage = page;
  }

  // ===== MODAL =====
  editUser(user: any) {
    this.selectedUserId = user.id;
    this.editForm.patchValue({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      matricule: user.matricule,
     projets: user.projets || [],
      siteName: user.site,
      role: user.role
    });
    this.showModal = true;
  }

  saveUpdate() {
    if (this.editForm.invalid) return;

    const updatedUser = {
     id: this.selectedUserId,
      firstname: this.editForm.value.firstname,
      lastname: this.editForm.value.lastname,
      email: this.editForm.value.email,
      matricule: this.editForm.value.matricule,
      projets: this.editForm.value.projets,
      siteName: this.editForm.value.siteName,  // ✅ AJOUTER
      role: this.editForm.value.role
    };

    this.userService.updateUser(this.selectedUserId, updatedUser).subscribe({
      next: () => {
        this.showModal = false;
        this.loadUsers();
      },
      error: () => {
        alert('Erreur lors de la mise à jour');
      }
    });
  }

  closeModal() {
    this.showModal = false;
  }

  deleteUser(user: any) {
    if (confirm(`Supprimer ${user.firstname} ${user.lastname} ?`)) {
      this.userService.deleteUser(user.id).subscribe(() => {
        this.loadUsers();
      });
    }
  }


  // ==================== EXPORT EXCEL AVEC STYLES ====================

  /**
   * Export un utilisateur spécifique vers Excel avec mise en forme
   */
  exportUser(user: any) {
    const data = [this.formatUserForExport(user)];
    this.exportToExcel(data, `Utilisateur_${user.firstname}_${user.lastname}.xlsx`, 'Liste des Utilisateurs');
  }

  /**
   * Export tous les utilisateurs filtrés vers Excel avec mise en forme
   */
  exportAllUsers() {
    const data = this.filteredUsers.map(user => this.formatUserForExport(user));
    this.exportToExcel(data, 'Liste_Utilisateurs.xlsx', 'Liste des Utilisateurs');
  }

  /**
   * Formate un utilisateur pour l'export
   */
  private formatUserForExport(user: any): any {
    return {
      'ID': user.id,
      'Prénom': user.firstname || '-',
      'Nom': user.lastname || '-',
      'Email': user.email || '-',
      'Matricule': user.matricule || '-',
      'Projet': user.projet || '-',
      'Site': user.site || '-',
      'Rôle': this.getRoleLabel(user.role || '')
    };
  }

  /**
   * Export les données vers Excel avec styles
   */
   private exportToExcel(data: any[], fileName: string, sheetName: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);

    // ✅ Mettre à jour les largeurs des colonnes (ajouter Site)
    const colWidths = [
      { wch: 8 },   // ID
      { wch: 15 },  // Prénom
      { wch: 15 },  // Nom
      { wch: 25 },  // Email
      { wch: 12 },  // Matricule
      { wch: 15 },  // Projet
      { wch: 20 },  // Site
      { wch: 20 }   // Rôle
    ];
    worksheet['!cols'] = colWidths;

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:H1');

    // Style pour l'en-tête
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellAddress]) continue;

      worksheet[cellAddress].s = {
        fill: { fgColor: { rgb: "2E86C1" } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "FFFFFF" } },
          bottom: { style: "thin", color: { rgb: "FFFFFF" } },
          left: { style: "thin", color: { rgb: "FFFFFF" } },
          right: { style: "thin", color: { rgb: "FFFFFF" } }
        }
      };
    }

    // Style pour les lignes de données
    for (let R = 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellAddress]) continue;

        const isEvenRow = R % 2 === 0;

        worksheet[cellAddress].s = {
          fill: { fgColor: { rgb: isEvenRow ? "F8F9F9" : "FFFFFF" } },
          font: { sz: 11 },
          alignment: { vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "E0E0E0" } },
            bottom: { style: "thin", color: { rgb: "E0E0E0" } },
            left: { style: "thin", color: { rgb: "E0E0E0" } },
            right: { style: "thin", color: { rgb: "E0E0E0" } }
          }
        };

        const colLetter = XLSX.utils.encode_col(C);

        // Style pour la colonne Rôle (colonne H)
        if (colLetter === 'H') {
          const roleValue = worksheet[cellAddress].v;
          if (roleValue === 'Administrateur') {
            worksheet[cellAddress].s.font = { color: { rgb: "C0392B" }, bold: true };
          } else if (roleValue === 'Ingénieur') {
            worksheet[cellAddress].s.font = { color: { rgb: "2980B9" }, bold: true };
          } else if (roleValue === 'Technologie Production') {
            worksheet[cellAddress].s.font = { color: { rgb: "16A085" }, bold: true };
          } else if (roleValue === 'Préparation Production') {
            worksheet[cellAddress].s.font = { color: { rgb: "F39C12" }, bold: true };
          }
        }

        // Style pour la colonne Site (colonne G)
        if (colLetter === 'G') {
          worksheet[cellAddress].s.font = { color: { rgb: "8E44AD" }, italic: true };
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  }

  getRoleLabel(role: string): string {
    const roleLabels: { [key: string]: string } = {
      'ADMIN': 'Administrateur',
      'ING': 'Ingénieur',
      'PT': 'Technologie Production',
      'PP': 'Préparation Production',
      'MC': 'Maintenance Corrective',
      'MP': 'Maintenance Préventive'
    };
    return roleLabels[role] || role;
  }

  getRoleBadgeClass(role: string): string {
    const classes: { [key: string]: string } = {
      'ADMIN': 'bg-danger bg-opacity-10 text-danger',
      'ING': 'bg-primary bg-opacity-10 text-primary',
      'PT': 'bg-info bg-opacity-10 text-info',
      'PP': 'bg-warning bg-opacity-10 text-warning',
      'MC': 'bg-secondary bg-opacity-10 text-secondary',
      'MP': 'bg-success bg-opacity-10 text-success'
    };
    return classes[role] || 'bg-secondary bg-opacity-10 text-secondary';
  }

  getRoleIcon(role: string): string {
    const icons: { [key: string]: string } = {
      'ADMIN': 'bi-shield-lock',
      'ING': 'bi-gear',
      'PT': 'bi-wrench',
      'PP': 'bi-diagram-3',
      'MC': 'bi-tools',
      'MP': 'bi-calendar-check'
    };
    return icons[role] || 'bi-person';
  }
   getSiteName(site: any): string {
    if (typeof site === 'string') return site;
    return site?.name || '-';
  }
  // Ajoutez ces propriétés dans la classe UtilisateurComponent
showPasswordModal = false;
selectedUserForPassword: any = null;
passwordForm!: FormGroup;
showNewPassword = false;
showConfirmPassword = false;

// Ajoutez cette méthode dans ngOnInit
initPasswordForm() {
  this.passwordForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });
}

// Validateur personnalisé pour vérifier que les mots de passe correspondent
passwordMatchValidator(group: FormGroup): any {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return newPassword === confirmPassword ? null : { passwordMismatch: true };
}

// Ouvrir la modal de changement de mot de passe
openChangePasswordModal(user: any) {
  this.selectedUserForPassword = user;
  this.passwordForm.reset();
  this.showPasswordModal = true;
}

// Fermer la modal
// Fermer la modal
closePasswordModal() {
  this.showPasswordModal = false;
  this.selectedUserForPassword = null;
  this.passwordForm.reset();
  this.showNewPassword = false;
  this.showConfirmPassword = false;
}

// Sauvegarder le nouveau mot de passe
savePassword() {
  if (this.passwordForm.invalid) return;

  const newPassword = this.passwordForm.get('newPassword')?.value;

  this.userService.changeUserPassword(this.selectedUserForPassword.id, newPassword).subscribe({
    next: (response) => {
      alert('✅ ' + response.message);
      this.closePasswordModal();
      // Optionnel: recharger la liste des utilisateurs
      this.loadUsers();
    },
    error: (err) => {
      alert('❌ ' + (err.error?.error || 'Erreur lors du changement de mot de passe'));
    }
  });
}

// Toggle password visibility
toggleNewPasswordVisibility() {
  this.showNewPassword = !this.showNewPassword;
}

toggleConfirmPasswordVisibility() {
  this.showConfirmPassword = !this.showConfirmPassword;
}
// Ajoutez ces propriétés et méthodes
Math = Math;

// Statistiques
get totalUsers(): number {
  return this.users.length;
}

get adminCount(): number {
  return this.users.filter(u => u.role === 'ADMIN').length;
}

get ingCount(): number {
  return this.users.filter(u => u.role === 'ING').length;
}

get uniqueSites(): number {
  return new Set(this.users.map(u => u.site).filter(s => s)).size;
}

get siteList(): string[] {
  return [...new Set(this.users.map(u => u.site).filter(s => s))];
}

// Initiales
getInitials(firstname: string, lastname: string): string {
  return `${firstname?.charAt(0) || ''}${lastname?.charAt(0) || ''}`.toUpperCase();
}

// Réinitialiser tous les filtres
resetFilters(): void {
  this.searchTerm = '';
  this.filterRole = '';
  this.filterSite = '';
  this.applyFilter();
}

// Ouvrir modal avec Bootstrap
openEditModal(): void {
  const modalElement = document.getElementById('editModal');
  if (modalElement) {
    const modal = new (window as any).bootstrap.Modal(modalElement);
    modal.show();
  }
}

closeEditModal(): void {
  const modalElement = document.getElementById('editModal');
  if (modalElement) {
    const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
    modal?.hide();
  }
}
}
