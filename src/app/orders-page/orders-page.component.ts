import { CommonModule } from '@angular/common';
import { Component, computed, Signal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FirebaseDataService, Order, Product } from '../services/firebase-data.service';
import { clearStoredUserEmail, getStoredUserEmail } from '../session-storage';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss',
})
export class OrdersPageComponent {
  readonly orders: Signal<Order[]>;
  readonly products: Signal<Product[]>;
  readonly userEmail = getStoredUserEmail();
  readonly orderedOrders = computed(() =>
    [...this.orders()].sort((left, right) => Number(left.delivered) - Number(right.delivered)),
  );
  readonly pendingCount = computed(() => this.orders().filter((order) => !order.delivered).length);
  readonly deliveredCount = computed(() => this.orders().filter((order) => order.delivered).length);
  readonly today = this.toDateInputValue(new Date());
  readonly deliveringOrderId = signal<string | null>(null);
  readonly deliveryError = signal<string | null>(null);

  orderForm = {
    customerName: '',
    phone: '',
    productId: '',
    deliveryDate: this.today,
    notes: '',
  };

  constructor(
    private readonly data: FirebaseDataService,
    private readonly router: Router,
  ) {
    this.orders = this.data.orders;
    this.products = this.data.products;
  }

  async addOrder(): Promise<void> {
    const { customerName, phone, productId, deliveryDate, notes } = this.orderForm;
    const product = this.products().find((item) => item.id === productId);
    if (!customerName.trim() || !product?.id || !deliveryDate) {
      return;
    }

    try {
      await this.data.addOrder({
        customerName,
        phone,
        productId: product.id,
        description: product.name,
        deliveryDate,
        notes,
      });
    } catch {
      return;
    }
    this.orderForm = {
      customerName: '',
      phone: '',
      productId: '',
      deliveryDate: this.today,
      notes: '',
    };
  }

  async toggleOrderPaid(order: Order): Promise<void> {
    if (!order.id) {
      return;
    }

    try {
      await this.data.toggleOrderPaid(order.id);
    } catch {
      return;
    }
  }

  async markDelivered(order: Order): Promise<void> {
    if (!order.id || order.delivered || this.deliveringOrderId()) {
      return;
    }

    this.deliveringOrderId.set(order.id);
    this.deliveryError.set(null);
    try {
      await this.data.markOrderDelivered(order.id);
    } catch (error) {
      this.deliveryError.set(
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar a entrega. Verifique a conexão e tente novamente.',
      );
    } finally {
      this.deliveringOrderId.set(null);
    }
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
      clearStoredUserEmail();
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
