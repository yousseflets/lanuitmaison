import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FirebaseDataService, Product } from '../services/firebase-data.service';
import { clearStoredUserEmail, getStoredUserEmail } from '../session-storage';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inventory-page.component.html',
  styleUrl: './inventory-page.component.scss',
})
export class InventoryPageComponent {
  readonly products = signal<Product[]>([]);
  readonly userEmail = getStoredUserEmail();

  readonly totalStock = computed(() =>
    this.products().reduce((total, product) => total + product.stock, 0),
  );

  readonly lowStockProducts = computed(() =>
    this.products().filter((product) => product.stock <= 5),
  );

  readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  constructor(
    private readonly data: FirebaseDataService,
    private readonly router: Router,
  ) {
    this.products = this.data.products;
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
}
