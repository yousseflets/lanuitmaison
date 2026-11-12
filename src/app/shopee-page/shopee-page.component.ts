import { CommonModule } from '@angular/common';
import { Component, computed, Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FirebaseDataService, ShopeeProduct, ShopeeSale } from '../services/firebase-data.service';
import { clearStoredUserEmail, getStoredUserEmail } from '../session-storage';

@Component({
  selector: 'app-shopee-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './shopee-page.component.html',
  styleUrl: './shopee-page.component.scss',
})
export class ShopeePageComponent {
  readonly products: Signal<ShopeeProduct[]>;
  readonly sales: Signal<ShopeeSale[]>;
  readonly userEmail = getStoredUserEmail();

  readonly totalQuantity = computed(() =>
    this.sales().reduce((total, sale) => total + sale.quantity, 0),
  );
  readonly totalProfit = computed(() =>
    this.sales().reduce((total, sale) => total + sale.profit, 0),
  );
  readonly totalRevenue = computed(() =>
    this.sales().reduce((total, sale) => total + sale.quantity * sale.unitPrice, 0),
  );
  readonly productSummaries = computed(() =>
    this.products().map((product) => {
      const productSales = this.sales().filter((sale) => sale.productId === product.id);
      return {
        ...product,
        quantitySold: productSales.reduce((total, sale) => total + sale.quantity, 0),
        profit: productSales.reduce((total, sale) => total + sale.profit, 0),
      };
    }),
  );

  productForm = {
    name: '',
    price: 0,
    costPrice: 0,
    fee: 0,
  };
  saleForm = {
    productId: '',
    quantity: 1,
  };

  readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  constructor(
    private readonly data: FirebaseDataService,
    private readonly router: Router,
  ) {
    this.products = this.data.shopeeProducts;
    this.sales = this.data.shopeeSales;
  }

  async addProduct(): Promise<void> {
    const { name, price, costPrice, fee } = this.productForm;
    if (!name.trim() || Number(price) <= 0 || Number(costPrice) < 0 || Number(fee) < 0) {
      return;
    }

    try {
      await this.data.addShopeeProduct({
        name: name.trim(),
        price: Number(price),
        costPrice: Number(costPrice),
        fee: Number(fee),
      });
    } catch {
      return;
    }
    this.productForm = { name: '', price: 0, costPrice: 0, fee: 0 };
  }

  async addSale(): Promise<void> {
    const quantity = Number(this.saleForm.quantity);
    if (!this.saleForm.productId || !Number.isInteger(quantity) || quantity <= 0) {
      return;
    }

    try {
      await this.data.addShopeeSale(this.saleForm.productId, quantity);
    } catch {
      return;
    }
    this.saleForm = { productId: '', quantity: 1 };
  }

  getSelectedProduct(): ShopeeProduct | undefined {
    return this.products().find((product) => product.id === this.saleForm.productId);
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
