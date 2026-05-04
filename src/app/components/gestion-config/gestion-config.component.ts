// gestion-config.component.ts - Version corrigée
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjetService } from '../../../services/projet.service';
import { SiteService } from '../../../services/Site';
import { Site } from '../../../models/site.model';
import { Projet } from '../../../services/projet.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-gestion-config',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,RouterLink],
  templateUrl: './gestion-config.component.html',
  styleUrls: ['./gestion-config.component.css']
})
export class GestionConfigComponent implements OnInit {

  activeTab: number = 0;

  // Projets
  projets: Projet[] = [];
  projetForm: FormGroup;
  editingProjet: Projet | null = null;
  showProjetModal = false;

  // Sites
  sites: Site[] = [];
  siteForm: FormGroup;
  editingSite: Site | null = null;
  showSiteModal = false;

  // Association
  showAssociationModal = false;
  selectedSiteForAssociation: Site | null = null;
  availableProjets: Projet[] = [];
  selectedProjetIds: number[] = [];
  siteProjets: Projet[] = [];

  loading = false;

  constructor(
    private projetService: ProjetService,
    private siteService: SiteService,
    private fb: FormBuilder
  ) {
    this.projetForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      active: [true]
    });

    this.siteForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.loadProjets();
    this.loadSites();
  }

  setActiveTab(tab: number): void {
    this.activeTab = tab;
  }

  // ============ PROJETS ============
  loadProjets(): void {
    this.loading = true;
    this.projetService.getAll().subscribe({
      next: (data) => {
        this.projets = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  openCreateProjet(): void {
    this.editingProjet = null;
    this.projetForm.reset({ name: '', description: '', active: true });
    this.showProjetModal = true;
  }

  openEditProjet(projet: Projet): void {
    this.editingProjet = projet;
    this.projetForm.patchValue({
      name: projet.name,
      description: projet.description,
      active: projet.active
    });
    this.showProjetModal = true;
  }

  saveProjet(): void {
    if (this.projetForm.invalid) return;

    const projetData = this.projetForm.value;

    if (this.editingProjet) {
      this.projetService.update(this.editingProjet.id, projetData).subscribe({
        next: () => {
          this.loadProjets();
          this.showProjetModal = false;
          alert('✅ Projet modifié avec succès');
        },
        error: (err) => alert('❌ Erreur: ' + (err.error?.message || err.message))
      });
    } else {
      this.projetService.create(projetData).subscribe({
        next: () => {
          this.loadProjets();
          this.showProjetModal = false;
          alert('✅ Projet créé avec succès');
        },
        error: (err) => alert('❌ Erreur: ' + (err.error?.message || err.message))
      });
    }
  }

  deleteProjet(id: number, name: string): void {
    if (confirm(`⚠️ Supprimer le projet "${name}" ?`)) {
      this.projetService.delete(id).subscribe({
        next: () => {
          this.loadProjets();
          alert('✅ Projet supprimé');
        },
        error: (err) => alert('❌ Erreur: ' + (err.error?.message || err.message))
      });
    }
  }

  // ============ SITES ============
  // gestion-config.component.ts - Corriger loadSites()

loadSites(): void {
  this.loading = true;
  this.siteService.getAll().subscribe({
    next: (sites) => {  // ✅ sites est déjà un tableau de Site[]
      console.log('📋 Sites reçus:', sites);

      this.sites = sites.map((site: any) => {
        const projetIds = site.projetIds || [];
        const projetNames = site.projetNames || [];

        console.log(`🏢 Site ${site.name} - Projets reçus:`, projetNames);

        const projets = projetIds.map((id: number, index: number) => ({
          id: id,
          name: projetNames[index] || `Projet ${id}`,
          description: '',
          active: true
        }));

        return {
          ...site,
          projets: projets
        };
      });

      console.log('📋 Tous les sites chargés:', this.sites);
      this.loading = false;
    },
    error: (err) => {
      console.error(err);
      this.loading = false;
    }
  });
}

 refreshSite(siteId: number): void {
  this.siteService.getById(siteId).subscribe({
    next: (site) => {  // ✅ site est déjà un objet Site
      console.log('🔄 Rafraîchissement du site:', site);
      console.log('📋 ProjetIds reçus:', site.projetIds);
      console.log('📋 ProjetNames reçus:', site.projetNames);

      const projetIds = (site as any).projetIds || [];
      const projetNames = (site as any).projetNames || [];

      const projets = projetIds.map((id: number, index: number) => ({
        id: id,
        name: projetNames[index] || `Projet ${id}`,
        description: '',
        active: true
      }));

      const siteAvecProjets = { ...site, projets };

      const index = this.sites.findIndex(s => s.id === siteId);
      if (index !== -1) {
        this.sites[index] = siteAvecProjets;
      }

      console.log('✅ Site après mise à jour:', this.sites[index]);
      this.sites = [...this.sites];
    },
    error: (err) => console.error('Erreur refresh:', err)
  });
}

  openCreateSite(): void {
    this.editingSite = null;
    this.siteForm.reset({ name: '', description: '', active: true });
    this.showSiteModal = true;
  }

  openEditSite(site: Site): void {
    this.editingSite = site;
    this.siteForm.patchValue({
      name: site.name,
      description: site.description,
      active: site.active
    });
    this.showSiteModal = true;
  }

  saveSite(): void {
    if (this.siteForm.invalid) return;

    const siteData = this.siteForm.value;

    if (this.editingSite) {
      this.siteService.update(this.editingSite.id, siteData).subscribe({
        next: () => {
          this.loadSites();
          this.showSiteModal = false;
          alert('✅ Site modifié avec succès');
        },
        error: (err) => alert('❌ Erreur: ' + (err.error?.message || err.message))
      });
    } else {
      this.siteService.create(siteData).subscribe({
        next: () => {
          this.loadSites();
          this.showSiteModal = false;
          alert('✅ Site créé avec succès');
        },
        error: (err) => alert('❌ Erreur: ' + (err.error?.message || err.message))
      });
    }
  }

  deleteSite(id: number, name: string): void {
    if (confirm(`⚠️ Supprimer le site "${name}" ?`)) {
      this.siteService.delete(id).subscribe({
        next: () => {
          this.loadSites();
          alert('✅ Site supprimé');
        },
        error: (err) => alert('❌ Erreur: ' + (err.error?.message || err.message))
      });
    }
  }

  // ============ ASSOCIATION ============
  openAssociationModal(site: Site): void {
    this.selectedSiteForAssociation = site;
    this.selectedProjetIds = [];

    // Charger les projets déjà associés
    this.siteService.getProjetsBySite(site.id).subscribe({
      next: (projets) => {
        this.siteProjets = projets;
        this.selectedProjetIds = projets.map(p => p.id);

        // Charger tous les projets disponibles
        this.projetService.getAll().subscribe({
          next: (allProjets) => {
            this.availableProjets = allProjets;
            this.showAssociationModal = true;
          },
          error: (err) => console.error(err)
        });
      },
      error: (err) => console.error(err)
    });
  }

  isProjetSelected(projetId: number): boolean {
    return this.selectedProjetIds.includes(projetId);
  }

  toggleProjetSelection(projetId: number, event: any): void {
    if (event.target.checked) {
      if (!this.selectedProjetIds.includes(projetId)) {
        this.selectedProjetIds.push(projetId);
      }
    } else {
      this.selectedProjetIds = this.selectedProjetIds.filter(id => id !== projetId);
    }
  }

 saveAssociation(): void {
  if (!this.selectedSiteForAssociation) return;

  this.siteService.updateSiteProjets(this.selectedSiteForAssociation.id, this.selectedProjetIds).subscribe({
    next: (updatedSite) => {
      // ✅ Mettre à jour uniquement le site modifié
      const index = this.sites.findIndex(s => s.id === updatedSite.id);
      if (index !== -1) {
        const projetIds = (updatedSite as any).projetIds || [];
        const projetNames = (updatedSite as any).projetNames || [];

        const projets = projetIds.map((id: number, idx: number) => ({
          id: id,
          name: projetNames[idx] || `Projet ${id}`,
          description: '',
          active: true
        }));

        this.sites[index] = { ...updatedSite, projets };
        this.sites = [...this.sites]; // Forcer le refresh
      }

      this.showAssociationModal = false;
      alert(`✅ Projets associés au site "${this.selectedSiteForAssociation?.name}" avec succès`);
    },
    error: (err) => {
      alert('❌ Erreur lors de l\'association: ' + (err.error?.message || err.message));
    }
  });
}

  getSiteProjetsNames(site: Site): string {
    if (site.projets && site.projets.length > 0) {
      return site.projets.map(p => p.name).join(', ');
    }
    return 'Aucun projet associé';
  }

  closeModals(): void {
    this.showProjetModal = false;
    this.showSiteModal = false;
    this.showAssociationModal = false;
    this.selectedSiteForAssociation = null;
    this.selectedProjetIds = [];
  }
}
