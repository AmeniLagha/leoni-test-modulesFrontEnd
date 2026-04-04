// components/notifications-page/notifications-page.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { TechnicalFileNotificationService, TechnicalNotification } from '../../../services/TechnicalNotification';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {

  notifications: TechnicalNotification[] = [];
  isLoading: boolean = false;
  filterType: string = 'all';
  private refreshSubscription: Subscription | null = null;

  constructor(
    private notificationService: TechnicalFileNotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();

    // Rafraîchir toutes les 30 secondes
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadNotifications();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.notificationService.getPendingNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.isLoading = false;
        // Marquer comme lues quand on est sur la page
        this.markAllAsRead();
      },
      error: (err) => {
        console.error('Erreur chargement notifications:', err);
        this.isLoading = false;
      }
    });
  }

  markAllAsRead(): void {
    localStorage.setItem('lastNotifView', new Date().toISOString());
  }

  dismissNotification(notificationId: number): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
  }

  clearAllNotifications(): void {
    this.notifications = [];
    localStorage.setItem('lastNotifView', new Date().toISOString());
  }

 viewTechnicalItem(itemId: number): void {
    // Utiliser la route existante pour le détail d'un item
   // this.router.navigate(['/technical-files/items', itemId, 'detail']);
    // Alternative: voir l'historique
    // this.router.navigate(['/technical-files/items', itemId, 'history']);

    this.router.navigate(['/technical-files/items', itemId, 'edit']);
  }


  getFilteredNotifications(): TechnicalNotification[] {
    if (this.filterType === 'all') {
      return this.notifications;
    }
    return this.notifications.filter(n =>
      n.priority.toLowerCase() === this.filterType.toLowerCase()
    );
  }

  getPriorityIcon(priority: string): string {
    switch(priority) {
      case 'CRITICAL': return 'bi bi-exclamation-triangle-fill';
      case 'HIGH': return 'bi bi-exclamation-circle-fill';
      default: return 'bi bi-info-circle-fill';
    }
  }

  getPriorityColor(priority: string): string {
    switch(priority) {
      case 'CRITICAL': return '#FF4444';
      case 'HIGH': return '#FFA500';
      default: return '#00D4FF';
    }
  }

  getTotalCount(): number {
    return this.notifications.length;
  }

  getCriticalCount(): number {
    return this.notifications.filter(n => n.priority === 'CRITICAL').length;
  }

  getHighCount(): number {
    return this.notifications.filter(n => n.priority === 'HIGH').length;
  }

  getMediumCount(): number {
    return this.notifications.filter(n => n.priority === 'MEDIUM').length;
  }

}
