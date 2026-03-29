import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private authService = inject(AuthService);

  // Récupérer les permissions depuis localStorage
  getUserPermissions(): string[] {
    return this.authService.getUserPermissions();
  }

  // Vérifier une permission spécifique
  hasPermission(permission: string): boolean {
    const permissions = this.getUserPermissions();
    console.log(`Checking permission "${permission}" in:`, permissions); // Debug
    return permissions.includes(permission);
  }

  // Vérifier plusieurs permissions (logique OU)
  hasAnyPermission(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) return true;
    return permissions.some(permission => this.hasPermission(permission));
  }

  // Vérifier toutes les permissions (logique ET)
  hasAllPermissions(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) return true;
    return permissions.every(permission => this.hasPermission(permission));
  }

  // Vérifier le rôle depuis localStorage
  getUserRole(): string {
    const role = this.authService.getUserRole();
    console.log('Current role:', role); // Debug
    return role;
  }

  // Vérifications spécifiques par rôle
  isING(): boolean {
    return this.getUserRole() === 'ING';
  }

  isPT(): boolean {
    return this.getUserRole() === 'PT';
  }

  isPP(): boolean {
    return this.getUserRole() === 'PP';
  }

  isMC(): boolean {
    return this.getUserRole() === 'MC';
  }

  isMP(): boolean {
    return this.getUserRole() === 'MP';
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'ADMIN';
  }
}
