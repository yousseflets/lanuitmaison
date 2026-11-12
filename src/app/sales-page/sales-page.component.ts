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

  readonly totalRevenue = computed(() =>
    this.sales().reduce((total, sale) => total + sale.quantity * sale.unitPrice, 0),
  );

  readonly totalProfit = computed(() =>
    this.sales().reduce((total, sale) => total + sale.profit, 0),
  );

  saleForm = {
    productId: '',
    quantity: 1,
    unitPrice: 0,
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
    if (!this.saleForm.productId) {
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
        date: new Date().toISOString(),
      });
    } catch {
      return;
    }

    this.saleForm = {
      productId: '',
      quantity: 1,
      unitPrice: 0,
    };
  }
}
