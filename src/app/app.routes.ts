// app.routes.ts
import { CreateConformeComponent } from './components/compliance/create/create-conforme/create-conforme.component';
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard/dashboard.component';
import { ChargeSheetListComponent } from './components/cahierdecharge/charge-sheet-list/charge-sheet-list/charge-sheet-list.component';
import { ComplianceListComponent } from './components/compliance/compliance-list/compliance-list/compliance-list.component';
import { ChargeSheetTechComponent } from './components/cahierdecharge/charge-sheet-tech/charge-sheet-tech/charge-sheet-tech.component';
import { CahierdechargeComponent } from './components/cahierdecharge/cahierdecharge/cahierdecharge.component';
import { TechnicalFileListComponent } from './components/technicalFile/technical-file-list/technical-file-list/technical-file-list.component';
import { MaintenanceCorrectiveComponent } from './components/maintenance/maintenance-corrective/maintenance-corrective/maintenance-corrective.component';
import { MaintenancePreventiveComponent } from './components/maintenance-preventive/maintenance-preventive/maintenance-preventive.component';
import { ClaimsComponent } from './components/claims/claims/claims.component';
import { RegisterComponent } from './components/login/register/register/register.component';
import { permissionGuard } from './guards/permission.guard';
import { UtilisateurComponent } from './components/login/utilisateur/utilisateur/utilisateur.component';
import { ChargeSheetDetailComponent } from './components/cahierdecharge/charge-sheet-detail/charge-sheet-detail/charge-sheet-detail.component';
import { ChargeSheetItemsViewComponent } from './components/cahierdecharge/charge-sheet-items-view/charge-sheet-items-view/charge-sheet-items-view.component';
import { ComplianceDetailComponent } from './components/compliance/ComplianceDetail/compliance-detail/compliance-detail.component';
import { ComplianceEditComponent } from './components/compliance/ComplianceEdit/compliance-edit/compliance-edit.component';
import { ClaimslisteComponent } from './components/claims/claimsliste/claimsliste/claimsliste.component';
import { CreatetechniquefileComponent } from './components/technicalFile/create/createtechniquefile/createtechniquefile.component';
import { EdittechniquefileComponent } from './components/technicalFile/edittechniquefile/edittechniquefile/edittechniquefile.component';
import { HistoryComponent } from './components/technicalFile/history/history/history.component';
import { StatistiquesComponent } from './components/statistiques/statistiques.component';
import { DetailstechfileComponent } from './components/technicalFile/detailstechfile/detailstechfile/detailstechfile.component';
import { HistoryAuditedComponent } from './components/technicalFile/HistoryAudited/history-audited/history-audited.component';
import { StockListComponent } from './components/stock-list/stock-list.component';
import { ReceptionComponent } from './components/cahierdecharge/reception/reception.component';
import { ReceptionListComponent } from './components/cahierdecharge/reception-list/reception-list.component';
import { ReceptionlistglobalComponent } from './components/cahierdecharge/receptionlistglobal/receptionlistglobal.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { ResetPasswordComponent } from './components/login/reset-password/reset-password.component.component';
import { NotificationsComponent } from './components/notifications/notifications.component';

export const routes: Routes = [
  // Public routes
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // Protected routes
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [authGuard, permissionGuard(['admin:createuser'])]
  },
  {
    path: 'reset-password',
    component:ResetPasswordComponent
  },
  {
    path:'chat',
    component: ChatbotComponent,
    canActivate:[authGuard]
  },
  {
    path: 'listeuser',
    component: UtilisateurComponent,
    canActivate: [authGuard, permissionGuard(['admin:readuser'])]
  },

  // === CAHIER DES CHARGES ===
  {
    path: 'charge-sheets',
    children: [
      {
        path: 'list',
        component: ChargeSheetListComponent,
        canActivate: [authGuard, permissionGuard(['charge_sheet:all:read'])]
      },
      {
        path: 'create',
        component: CahierdechargeComponent,
        canActivate: [authGuard, permissionGuard(['charge_sheet:basic:create'])]
      },
      {
        path: ':id',
        component: ChargeSheetDetailComponent,
        canActivate: [authGuard, permissionGuard(['charge_sheet:basic:read'])]
      },
      {
        path: ':id/edit',
        component: CahierdechargeComponent,
        canActivate: [authGuard, permissionGuard(['charge_sheet:basic:write'])]
      },
      {
        path: ':id/tech',
        component: ChargeSheetTechComponent,
        canActivate: [authGuard, permissionGuard(['charge_sheet:tech:write'])]
      },
      {
        path: ':id/items/view',
        component: ChargeSheetItemsViewComponent,
        canActivate: [authGuard, permissionGuard(['charge_sheet:all:read'])]
      }
    ]
  },

  // === CONFORMITÉ (PP) ===
  {
    path: 'compliance',
    children: [
      {
        path: 'list',
        component: ComplianceListComponent,
        canActivate: [authGuard, permissionGuard(['compliance:read'])]
      },
      {
        path: 'charge-sheets/:chargeSheetId/items/:itemId/create-conforme',
        component: CreateConformeComponent,
        canActivate: [authGuard, permissionGuard(['compliance:create'])]
      },
      {
        path: ':id/detail',
        component: ComplianceDetailComponent,
        canActivate: [authGuard, permissionGuard(['compliance:read'])]
      },

      {
        path: ':id/edit',
        component: ComplianceEditComponent,
        canActivate: [authGuard, permissionGuard(['compliance:write'])]
      }
    ]
  },

  // === DOSSIER TECHNIQUE (PP, MC, MP) ===
  {
    path: 'technical-files',
    children: [
      {
        path: 'list',
        component: TechnicalFileListComponent,
        canActivate: [authGuard, permissionGuard(['technical_file:read'])]
      },
      {
        path: 'charge-sheets/:chargeSheetId/items/:itemId/create-fichietechnique',
        component: CreatetechniquefileComponent,
        canActivate: [authGuard, permissionGuard(['technical_file:create'])]
      },
      // Routes pour les dossiers
      {
        path: ':id/edit',
        component: EdittechniquefileComponent,
        canActivate: [authGuard, permissionGuard(['technical_file:write'])]
      },
      {
        path: ':id/history',
        component: HistoryComponent,
        canActivate: [authGuard, permissionGuard(['technical_file:read'])]
      },
      {
        path: ':id/history-audited',
        component: HistoryAuditedComponent,
        canActivate: [authGuard, permissionGuard(['technical_file:read'])]
      },
      {
        path: ':id/detail',
        component: DetailstechfileComponent,
        canActivate: [authGuard, permissionGuard(['technical_file:read'])]
      },
      // Routes pour les items
      {
        path: 'items/:itemId/edit',
        component: EdittechniquefileComponent,
        canActivate: [authGuard, permissionGuard(['technical_file:write'])]
      },
      {
        path: 'items/:itemId/history',
        component: HistoryComponent,
        canActivate: [authGuard, permissionGuard(['technical_file:read'])]
      },
      {
        path: 'items/:itemId/history-audited',
        component: HistoryAuditedComponent,
        canActivate: [authGuard, permissionGuard(['technical_file:read'])]
      },
      {
        path: 'items/:itemId/detail',
        component: DetailstechfileComponent,
        canActivate: [authGuard, permissionGuard(['technical_file:read'])]
      }
    ]
  },

  // === MAINTENANCE ===
  {
    path: 'maintenance/corrective',
    component: MaintenanceCorrectiveComponent,
    canActivate: [authGuard, permissionGuard(['maintenance_corrective:read'])]
  },
  {
    path: 'maintenance/preventive',
    component: MaintenancePreventiveComponent,
    canActivate: [authGuard, permissionGuard(['maintenance_preventive:read'])]
  },

  // === RÉCLAMATIONS ===
  {
    path: 'claims',
    children: [
      {
        path: 'list',
        component: ClaimslisteComponent,
        canActivate: [authGuard, permissionGuard(['claim:read'])]
      },
      {
        path: 'create',
        component: ClaimsComponent,
        canActivate: [authGuard, permissionGuard(['claim:create'])]
      },
      {
        path: ':id',
        component: ComplianceDetailComponent,
        canActivate: [authGuard, permissionGuard(['compliance:read'])]
      },
      {
        path: ':id/edit',
        component: ComplianceEditComponent,
        canActivate: [authGuard, permissionGuard(['compliance:write'])]
      }
    ]
  },

  // === STATISTIQUES & STOCK ===
  {
    path: 'statistique',
    component: StatistiquesComponent,
    canActivate: [authGuard]
  },
  {
    path: 'stock',
    component: StockListComponent,
    canActivate: [authGuard, permissionGuard(['claim:read','claim:write','claim:create'])]
  },
  {
    path:'reception',
    component:ReceptionlistglobalComponent,
    canActivate:[authGuard, permissionGuard(['reception:read'])]
  },
  // Ajoutez cette route dans votre configuration
{
  path: 'charge-sheets/:id/reception',
 component: ReceptionComponent,
  canActivate: [authGuard]
},
{
  path: 'charge-sheets/:id/receptions',
  component:ReceptionListComponent,
  canActivate: [authGuard]
},
{
  path:'notifications',
  component:NotificationsComponent,
  canActivate:[authGuard]
},

  // Catch-all route
  { path: '**', redirectTo: 'login' }
];
