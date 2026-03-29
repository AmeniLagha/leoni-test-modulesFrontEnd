import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { PermissionService } from '../../services/permission.service';

export const permissionGuard = (requiredPermissions: string[]): CanActivateFn => {
  return () => {
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    const hasPermission = permissionService.hasAnyPermission(requiredPermissions);

    if (hasPermission) {
      return true;
    }

    router.navigate(['/dashboard']);
    return false;
  };
};
