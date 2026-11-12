import { CommonModule } from '@angular/common';
import { Component, computed, Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FirebaseDataService, Order } from '../services/firebase-data.service';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss',
})
export class OrdersPageComponent {
  readonly orders: Signal<Order[]>;
  readonly userEmail = localStorage.getItem('lanuitmaison_user') || 'Administrador';
  readonly pendingCount = computed(() => this.orders().filter((order) => !order.delivered).length);
  readonly deliveredCount = computed(() => this.orders().filter((order) => order.delivered).length);
  readonly today = this.toDateInputValue(new Date());

  orderForm = {
    customerName: '',
    phone: '',
    description: '',
    deliveryDate: this.today,
    notes: '',
  };

  constructor(
    private readonly data: FirebaseDataService,
    private readonly router: Router,
  ) {
    this.orders = this.data.orders;
  }

  async addOrder(): Promise<void> {
    const { customerName, phone, description, deliveryDate, notes } = this.orderForm;
    if (!customerName.trim() || !description.trim() || !deliveryDate) {
      return;
    }

    try {
      await this.data.addOrder({ customerName, phone, description, deliveryDate, notes });
    } catch {
      return;
    }
    this.orderForm = {
      customerName: '',
      phone: '',
      description: '',
      deliveryDate: this.today,
      notes: '',
    };
  }

  formatDate(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  async logout(): Promise<void> {
    try {
      await this.data.signOut();
      localStorage.removeItem('lanuitmaison_user');
      await this.router.navigate(['/login']);
    } catch {
      return;
    }
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
