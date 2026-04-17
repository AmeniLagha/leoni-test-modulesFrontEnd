// detailstechfile.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TechnicalFileService } from '../../../../../services/technical-file.service';
import { StockService } from '../../../../../services/stock.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-detailstechfile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detailstechfile.component.html',
  styleUrls: ['./detailstechfile.component.css']
})
export class DetailstechfileComponent implements OnInit {

  item: any = null;
  parentFile: any = null;
  loading: boolean = true;
  error: string | null = null;
  itemId!: number;

  // Pour le formulaire de stock
  showStockForm: boolean = false;
  stockForm: any = {
    casier: '',
    stuffNumr: '',
    leoniNumr: '',
    indexValue: '',
    quantite: 1,
    fournisseur: '',
    etat: 'OK',
    caisse: '',
    specifications: '',
    infoSurModules: '',
    demandeurExplication: '',
    dateDemande: new Date().toISOString().split('T')[0],
    newQuantite: null
  };

  preStockInfo: any = null;
  submitting: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: TechnicalFileService,
    private stockService: StockService
  ) {}

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('itemId');

    console.log('itemId récupéré:', idParam);

    if (idParam) {
      this.itemId = +idParam;
      this.loadItemDetails(this.itemId);
    } else {
      this.error = 'ID de l\'item (itemId) non trouvé dans l\'URL';
      this.loading = false;
    }
  }

  loadItemDetails(itemId: number) {
    this.loading = true;

    this.service.getItemById(itemId).subscribe({
      next: (data: any) => {
        console.log('✅ Item reçu:', data);
        this.item = data;

        if (data.technicalFileId) {
          this.service.getById(data.technicalFileId).subscribe({
            next: (fileData: any) => {
              this.parentFile = fileData;
              this.loading = false;
            },
            error: (err: HttpErrorResponse) => {
              console.error('Erreur chargement dossier parent:', err);
              this.loading = false;
            }
          });
        } else {
          this.loading = false;
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Erreur:', err);
        this.error = `Erreur ${err.status}: ${err.statusText || 'Impossible de charger l\'item'}`;
        this.loading = false;
      }
    });
  }

  // Ouvrir le formulaire de stock
  openStockForm() {
    // Récupérer les informations pré-remplies
    this.stockService.getPreStockInfo(this.itemId).subscribe({
      next: (info: any) => {
        this.preStockInfo = info;

        // Pré-remplir le formulaire avec les dernières valeurs
        this.stockForm = {
          casier: '',
          stuffNumr: '',
          leoniNumr: '',
          indexValue: info.indexValue || '',
          quantite: 1,
          fournisseur: '',
          etat: 'OK',
          caisse: '',
          specifications: '',
          infoSurModules: '',
          demandeurExplication: '',
          dateDemande: new Date().toISOString().split('T')[0],
          newQuantite: null,
          // Valeurs techniques (non modifiables)
          finalDisplacement: info.finalDisplacement,
          finalProgrammedSealing: info.finalProgrammedSealing,
          finalDetection: info.finalDetection
        };

        this.showStockForm = true;
      },
      error: (err) => {
        console.error('Erreur chargement infos pré-stock:', err);
        alert('Impossible de charger les informations de l\'item');
      }
    });
  }

  // Fermer le formulaire
  closeStockForm() {
    this.showStockForm = false;
    this.stockForm = {};
  }

  // Soumettre le formulaire et déplacer en stock
  submitMoveToStock() {
    if (!this.item?.id) {
      alert('Aucun item à déplacer');
      return;
    }

    // Validation des champs obligatoires
    if (!this.stockForm.casier && !this.stockForm.stuffNumr && !this.stockForm.leoniNumr) {
      if (!confirm('Aucun emplacement renseigné (casier, stuff numr ou leoni numr). Voulez-vous continuer ?')) {
        return;
      }
    }

    this.submitting = true;

    // Préparer les données pour l'API
    const stockData = {
      casier: this.stockForm.casier,
      stuffNumr: this.stockForm.stuffNumr,
      leoniNumr: this.stockForm.leoniNumr,
      indexValue: this.stockForm.indexValue,
      quantite: this.stockForm.quantite,
      fournisseur: this.stockForm.fournisseur,
      etat: this.stockForm.etat,
      caisse: this.stockForm.caisse,
      specifications: this.stockForm.specifications,
      infoSurModules: this.stockForm.infoSurModules,
      demandeurExplication: this.stockForm.demandeurExplication,
      dateDemande: this.stockForm.dateDemande,
      newQuantite: this.stockForm.newQuantite,
      finalDisplacement: this.preStockInfo?.finalDisplacement,
      finalProgrammedSealing: this.preStockInfo?.finalProgrammedSealing,
      finalDetection: this.preStockInfo?.finalDetection
    };

    this.stockService.moveItemToStockWithInfo(this.itemId, stockData).subscribe({
      next: (response: any) => {
        console.log('Stock créé:', response);
        this.submitting = false;
        alert('✅ Item déplacé en stock avec succès !');
        this.router.navigate(['/stock/list']);
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.submitting = false;
        alert(`❌ Erreur lors du déplacement en stock: ${err.error?.message || err.message}`);
      }
    });
  }
// detailstechfile.component.ts - Ajoutez ces méthodes dans la classe

// Méthodes pour calculer les valeurs finales
getFinalDisplacement(): string {
  if (!this.item) return '-';

  // Récupérer toutes les valeurs non nulles
  const values = [];
  if (this.item.displacementPathM1) values.push(parseFloat(this.item.displacementPathM1));
  if (this.item.displacementPathM2) values.push(parseFloat(this.item.displacementPathM2));
  if (this.item.displacementPathM3) values.push(parseFloat(this.item.displacementPathM3));

  if (values.length === 0) return '-';

  // Retourner la valeur maximale
  const maxValue = Math.max(...values);
  return maxValue.toString();
}

getFinalProgrammedSealing(): string {
  if (!this.item) return '-';

  // Récupérer toutes les valeurs non nulles
  const values = [];
  if (this.item.programmedSealingValueM1) values.push(parseFloat(this.item.programmedSealingValueM1));
  if (this.item.programmedSealingValueM2) values.push(parseFloat(this.item.programmedSealingValueM2));
  if (this.item.programmedSealingValueM3) values.push(parseFloat(this.item.programmedSealingValueM3));

  if (values.length === 0) return '-';

  // Retourner la valeur maximale
  const maxValue = Math.max(...values);
  return maxValue.toString();
}

getFinalDetection(): string {
  if (!this.item) return '-';

  // Priorité à M3, puis M2, puis M1
  if (this.item.detectionsM3 && this.item.detectionsM3.trim() !== '') {
    return this.item.detectionsM3;
  }
  if (this.item.detectionsM2 && this.item.detectionsM2.trim() !== '') {
    return this.item.detectionsM2;
  }
  if (this.item.detectionsM1 && this.item.detectionsM1.trim() !== '') {
    return this.item.detectionsM1;
  }

  return '-';
}
  goBack() {
    this.router.navigate(['/technical-files/list']);
  }
}
