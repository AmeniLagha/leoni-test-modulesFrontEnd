import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ComplianceService } from '../../../../../services/compliance.service';
import { ComplianceDto } from '../../../../../models/compliance.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-compliance-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './compliance-edit.component.html',
  styleUrls: ['./compliance-edit.component.css']
})
export class ComplianceEditComponent implements OnInit {

  compliance!: ComplianceDto;
  id!: number;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: ComplianceService
  ) {}

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('id');

    if (!param) {
      alert('ID introuvable dans URL');
      this.router.navigate(['/compliance/list']);
      return;
    }

    this.id = Number(param);

    this.loadCompliance();
  }

  loadCompliance(): void {
    this.isLoading = true;
    this.service.getComplianceById(this.id).subscribe({
      next: res => {
        this.compliance = res;
        this.isLoading = false;
      },
      error: err => {
        console.error('Erreur chargement:', err);
        alert('Erreur chargement de la conformité');
        this.router.navigate(['/compliance/list']);
      }
    });
  }

  submitForm(): void {
    console.log("ID envoyé :", this.id);
    console.log("DATA envoyée :", this.compliance);

    this.service.updateCompliance(this.id, this.compliance).subscribe({
      next: () => {
        alert('✅ Fiche modifiée avec succès');
        this.router.navigate(['/compliance/list']);
      },
      error: (err) => {
        console.error('Erreur modification:', err);
        alert('❌ Erreur lors de la modification');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/compliance/list']);
  }
}
