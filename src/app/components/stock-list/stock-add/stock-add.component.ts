// stock-add.component.ts - Ajouter la liste des sites
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StockService } from '../../../../services/stock.service';
import { SiteService } from '../../../../services/Site';
import { Site } from '../../../../models/site.model';

@Component({
  selector: 'app-stock-add',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './stock-add.component.html',
  styleUrls: ['./stock-add.component.css']
})
export class StockAddComponent implements OnInit {

  stockForm: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  // ✅ Liste des sites
  sites: Site[] = [];

  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
    private siteService: SiteService,
    private router: Router
  ) {
    this.stockForm = this.fb.group({
      // ✅ Ajouter siteId
      siteId: [null, Validators.required],
      // Informations de base
      casier: [''],
      stuffNumr: [''],
      leoniNumr: [''],
      indexValue: [''],
      quantite: [null, [Validators.min(0)]],
      fournisseur: [''],
      etat: ['OK'],
      caisse: [''],
      // Spécifications
      specifications: [''],
      dernierMaj: [new Date().toISOString().split('T')[0]],
      infoSurModules: [''],
      demandeurExplication: [''],
      dateDemande: [new Date().toISOString().split('T')[0]],
      newQuantite: [null, [Validators.min(0)]],
      // Valeurs techniques
      finalDisplacement: [null],
      finalProgrammedSealing: [null],
      finalDetection: ['']
    });
  }

  ngOnInit(): void {
    this.loadSites();
  }

  loadSites(): void {
    this.siteService.getAll().subscribe({
      next: (sites) => {
        this.sites = sites.filter(site => site.active === true);
      },
      error: (err) => {
        console.error('Erreur chargement sites', err);
        this.error = 'Erreur lors du chargement des sites';
      }
    });
  }

  onSubmit(): void {
    if (this.stockForm.invalid) {
      Object.keys(this.stockForm.controls).forEach(key => {
        this.stockForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    const formValue = this.stockForm.value;

    this.stockService.createStockModule(formValue).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = '✅ Module ajouté au stock avec succès !';
        setTimeout(() => {
          this.router.navigate(['/stock']);
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || '❌ Erreur lors de l\'ajout du module';
        console.error(err);
      }
    });
  }

  resetForm(): void {
    this.stockForm.reset({
      siteId: null,
      casier: '',
      stuffNumr: '',
      leoniNumr: '',
      indexValue: '',
      quantite: null,
      fournisseur: '',
      etat: 'OK',
      caisse: '',
      specifications: '',
      dernierMaj: new Date().toISOString().split('T')[0],
      infoSurModules: '',
      demandeurExplication: '',
      dateDemande: new Date().toISOString().split('T')[0],
      newQuantite: null,
      finalDisplacement: null,
      finalProgrammedSealing: null,
      finalDetection: ''
    });
  }
}
