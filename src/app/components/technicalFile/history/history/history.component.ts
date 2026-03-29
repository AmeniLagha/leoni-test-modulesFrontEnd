import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TechnicalFileService } from '../../../../../services/technical-file.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit {

  history: any[] = [];
  id!: number;

  constructor(
    private route: ActivatedRoute,
    private service: TechnicalFileService
  ) {}

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadHistory();
  }

  loadHistory() {
    this.service.getItemAuditedHistory(this.id).subscribe({
      next: res => this.history = res,
      error: err => console.error(err)
    });
  }
}
