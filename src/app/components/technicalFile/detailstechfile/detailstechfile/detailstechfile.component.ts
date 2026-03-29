import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TechnicalFileService } from '../../../../../services/technical-file.service';
import { StockService } from '../../../../../services/stock.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-detailstechfile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detailstechfile.component.html',
  styleUrls: ['./detailstechfile.component.css']
})
export class DetailstechfileComponent implements OnInit {

  item: any = null;
  parentFile: any = null;
  loading: boolean = true;
  error: string | null = null;
  itemId!: number;

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

  // detailstechfile.component.ts
moveToStock() {
  if (!this.item?.id) {
    alert('Aucun item à déplacer');
    return;
  }

  const itemNumber = this.item.itemNumber || this.item.id;
  
  let confirmMessage = `📦 DÉPLACEMENT EN STOCK\n\n`;
  confirmMessage += `Item #${itemNumber}\n`;
  confirmMessage += `Position: ${this.item.position || '-'}\n`;
  confirmMessage += `Raideur: ${this.item.pinRigidityM1 || '-'}/${this.item.pinRigidityM2 || '-'}/${this.item.pinRigidityM3 || '-'}\n`;
  
  if (this.parentFile) {
    confirmMessage += `\n📁 Dossier parent #${this.parentFile.id}`;
  }
  
  confirmMessage += `\n\nConfirmez-vous le déplacement en stock ?`;

  if (!confirm(confirmMessage)) return;

  // ⚠️ Utiliser l'ID de l'item, pas l'ID du dossier
  this.stockService.moveItemToStock(this.itemId).subscribe({
    next: (response: any) => {
      console.log('Stock créé:', response);
      alert('✅ Item déplacé en stock avec succès !');
      this.goBack();
    },
    error: (err) => {
      console.error('❌ Erreur:', err);
      alert(`❌ Erreur lors du déplacement en stock: ${err.error?.message || err.message}`);
    }
  });
}

  goBack() {
    this.router.navigate(['/technical-files/list']);
  }
}