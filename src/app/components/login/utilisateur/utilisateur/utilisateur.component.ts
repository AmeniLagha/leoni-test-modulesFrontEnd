import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../../../services/UserService';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  exportUser(user: any) {
    const csv = this.convertToCSV([user]);
    this.downloadCSV(csv, `user_${user.id}.csv`);
  }

  exportAllUsers() {
    const csv = this.convertToCSV(this.filteredUsers);
    this.downloadCSV(csv, 'users.csv');
  }

  convertToCSV(data: any[]) {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(u =>
      headers.map(h => `"${u[h] || ''}"`).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
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
