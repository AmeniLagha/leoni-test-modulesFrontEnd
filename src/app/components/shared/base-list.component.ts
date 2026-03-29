import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PermissionService } from '../../../services/permission.service';

@Component({
  selector: 'app-base-list',
  standalone: true,
  imports: [CommonModule],
  template: '',
  styles: []
})
export class BaseListComponent {
  protected permissionService = inject(PermissionService);
  protected router = inject(Router);

  canCreate(): boolean {
    return false;
  }

  canEdit(): boolean {
    return false;
  }

  canDelete(): boolean {
    return false;
  }

  canView(): boolean {
    return true;
  }

  navigateToCreate(): void {
    this.router.navigate(['./create'], { relativeTo: this.router.routerState.root });
  }

  navigateToEdit(id: number): void {
    this.router.navigate(['./edit', id], { relativeTo: this.router.routerState.root });
  }

  navigateToView(id: number): void {
    this.router.navigate(['./', id], { relativeTo: this.router.routerState.root });
  }

  navigateBack(): void {
    this.router.navigate(['../'], { relativeTo: this.router.routerState.root });
  }
}