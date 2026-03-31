import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../../../services/UserService';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-utilisateur',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './utilisateur.component.html',
  styleUrls: ['./utilisateur.component.css']
})
export class UtilisateurComponent implements OnInit {

  users: any[] = [];
  filteredUsers: any[] = [];
  loading = true;
  error = '';
  searchTerm = '';

  // Modal
  editForm!: FormGroup;
  selectedUserId!: number;
  showModal = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;

  constructor(
    private userService: UserService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.initForm();
  }

  initForm() {
    this.editForm = this.fb.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      matricule: ['', Validators.required],
      projet: ['', Validators.required],
      role: ['', Validators.required]
    });
  }

  loadUsers() {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (res) => {
        this.users = res;
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
    this.filteredUsers = this.users.filter(u =>
      u.firstname?.toLowerCase().includes(term) ||
      u.lastname?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      ('' + u.matricule).includes(term)
    );
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
      projet: user.projet,
      role: user.role
    });
    this.showModal = true;
  }

  saveUpdate() {
    if (this.editForm.invalid) return;

    const updatedUser = {
      id: this.selectedUserId,
      ...this.editForm.value
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
      'Rôle': this.getRoleLabel(user.role || '')
    };
  }

  /**
   * Export les données vers Excel avec styles
   */
  private exportToExcel(data: any[], fileName: string, sheetName: string) {
    // Créer une feuille de calcul à partir des données
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Définir la largeur des colonnes
    const colWidths = [
      { wch: 8 },   // ID
      { wch: 15 },  // Prénom
      { wch: 15 },  // Nom
      { wch: 25 },  // Email
      { wch: 12 },  // Matricule
      { wch: 15 },  // Projet
      { wch: 20 } // Rôle
       
    ];
    worksheet['!cols'] = colWidths;
    
    // Appliquer les styles
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:I1');
    
    // Style pour l'en-tête (première ligne)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        fill: {
          fgColor: { rgb: "2E86C1" }  // Fond bleu
        },
        font: {
          bold: true,
          color: { rgb: "FFFFFF" },   // Texte blanc
          sz: 12
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        },
        border: {
          top: { style: "thin", color: { rgb: "FFFFFF" } },
          bottom: { style: "thin", color: { rgb: "FFFFFF" } },
          left: { style: "thin", color: { rgb: "FFFFFF" } },
          right: { style: "thin", color: { rgb: "FFFFFF" } }
        }
      };
    }
    
    // Appliquer les styles pour les lignes de données
    for (let R = 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellAddress]) continue;
        
        // Alterner les couleurs des lignes
        const isEvenRow = R % 2 === 0;
        
        worksheet[cellAddress].s = {
          fill: {
            fgColor: { rgb: isEvenRow ? "F8F9F9" : "FFFFFF" }  // Lignes gris clair alternées
          },
          font: {
            sz: 11
          },
          alignment: {
            vertical: "center"
          },
          border: {
            top: { style: "thin", color: { rgb: "E0E0E0" } },
            bottom: { style: "thin", color: { rgb: "E0E0E0" } },
            left: { style: "thin", color: { rgb: "E0E0E0" } },
            right: { style: "thin", color: { rgb: "E0E0E0" } }
          }
        };
        
        // Style spécial pour la colonne Rôle
        const colLetter = XLSX.utils.encode_col(C);
        if (colLetter === 'G') { // Colonne Rôle (index 6)
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
        
        // Style spécial pour la colonne Statut
        if (colLetter === 'H') { // Colonne Statut (index 7)
          const statusValue = worksheet[cellAddress].v;
          if (statusValue === 'Actif') {
            worksheet[cellAddress].s.font = { color: { rgb: "27AE60" }, bold: true };
          } else {
            worksheet[cellAddress].s.font = { color: { rgb: "E74C3C" }, bold: true };
          }
        }
      }
    }
    
    // Créer un classeur et ajouter la feuille
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Générer le fichier Excel
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
}
