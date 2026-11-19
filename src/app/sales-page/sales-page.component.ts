import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FirebaseDataService, Product, Sale } from '../services/firebase-data.service';
import { clearStoredUserEmail, getStoredUserEmail } from '../session-storage';

@Component({
  selector: 'app-sales-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './sales-page.component.html',
  styleUrl: './sales-page.component.scss',
})
export class SalesPageComponent {
  readonly products = signal<Product[]>([]);
  readonly sales = signal<Sale[]>([]);
  readonly userEmail = getStoredUserEmail();
  readonly today = this.toDateInputValue(new Date());

  readonly totalRevenue = computed(() =>
    this.sales().reduce((total, sale) => total + sale.quantity * sale.unitPrice, 0),
  );

  readonly totalProfit = computed(() =>
    this.sales().reduce((total, sale) => total + sale.profit, 0),
  );

  readonly dailySales = computed(() => {
    const today = this.toDateInputValue(new Date());
    return this.sales().filter((sale) => {
      const timestamp = this.saleDateTimestamp(sale);
      return timestamp !== null && this.toDateInputValue(new Date(timestamp)) === today;
    });
  });

  readonly latestSales = computed(() =>
    [...this.sales()]
      .sort(
        (left, right) =>
          (this.saleDateTimestamp(right) ?? 0) - (this.saleDateTimestamp(left) ?? 0),
      )
      .slice(0, 10),
  );

  saleForm = {
    productId: '',
    quantity: 1,
    unitPrice: 0,
    date: this.today,
  };

  readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  get unitPriceInputValue(): string {
    return this.saleForm.unitPrice > 0 ? this.currencyFormatter.format(this.saleForm.unitPrice) : '';
  }

  constructor(
    private readonly data: FirebaseDataService,
    private readonly router: Router,
  ) {
    this.products = this.data.products;
    this.sales = this.data.sales;
  }

  onProductSelected(): void {
    if (!this.saleForm.productId) {
      this.saleForm.unitPrice = 0;
      return;
    }

    const selectedProduct = this.products().find((product) => product.id === this.saleForm.productId);

    if (selectedProduct) {
      this.saleForm.unitPrice = Number(selectedProduct.price.toFixed(2));
    }
  }

  unitPriceInputChanged(value: string): void {
    const normalized = value
      .replace(/[^\d,.-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');

    this.saleForm.unitPrice = Number(normalized) || 0;
  }

  formatSaleDate(sale: Sale): string {
    const timestamp = this.saleDateTimestamp(sale);
    return timestamp === null ? '—' : new Date(timestamp).toLocaleDateString('pt-BR');
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

  async addSale(): Promise<void> {
    if (!this.saleForm.productId || !this.saleForm.date) {
      return;
    }

    const selectedProduct = this.products().find((product) => product.id === this.saleForm.productId);

    if (!selectedProduct) {
      return;
    }

    const quantity = Number(this.saleForm.quantity) || 0;
    const unitPrice = Number(this.saleForm.unitPrice) || 0;

    if (quantity <= 0 || unitPrice <= 0 || quantity > selectedProduct.stock) {
      return;
    }

    try {
      await this.data.addSale({
        productId: selectedProduct.id ?? '',
        productName: selectedProduct.name,
        quantity,
        unitPrice,
        date: new Date(`${this.saleForm.date}T00:00:00`).toISOString(),
      });
    } catch {
      return;
    }

    this.saleForm = {
      productId: '',
      quantity: 1,
      unitPrice: 0,
      date: this.toDateInputValue(new Date()),
    };
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private saleDateTimestamp(sale: Sale): number | null {
    const date = sale.date || sale.createdAt;
    if (!date) {
      return null;
    }

    const timestamp = new Date(date).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
  }
}
