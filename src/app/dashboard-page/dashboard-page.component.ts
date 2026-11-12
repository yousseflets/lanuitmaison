import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FirebaseDataService, Product, Sale } from '../services/firebase-data.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent implements OnInit {
  readonly products = signal<Product[]>([]);
  readonly sales = signal<Sale[]>([]);

  constructor(
    private readonly data: FirebaseDataService,
    private readonly router: Router,
  ) {}

  readonly stats = computed(() => [
    {
      label: 'Produtos',
      value: `${this.products().length}`,
      subtitle: 'cadastros ativos',
      tone: 'blue',
    },
    {
      label: 'Vendas',
      value: `${this.sales().length}`,
      subtitle: 'registros no período',
      tone: 'green',
    },
    {
      label: 'Estoque',
      value: `${this.products().reduce((total, product) => total + product.stock, 0)}`,
      subtitle: 'itens em estoque',
      tone: 'orange',
    },
    {
      label: 'Lucro',
      value: this.currencyFormatter.format(this.sales().reduce((total, sale) => total + sale.profit, 0)),
      subtitle: 'total estimado',
      tone: 'purple',
    },
  ]);

  readonly lowStockProducts = computed(() =>
    this.products().filter((product) => product.stock <= 5),
  );

  readonly revenue = computed(() =>
    this.sales().reduce((total, sale) => total + sale.quantity * sale.unitPrice, 0),
  );

  readonly topSellingProducts = computed(() => {
    const productMap = new Map<string, number>();

    this.sales().forEach((sale) => {
      productMap.set(sale.productId, (productMap.get(sale.productId) ?? 0) + sale.quantity);
    });

    return Array.from(productMap.entries())
      .map(([productId, quantity]) => {
        const product = this.products().find((item) => item.id === productId);
        return { name: product?.name ?? 'Produto', quantity };
      })
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 3);
  });

  readonly tableProducts = signal<Product[]>([]);
  readonly tableSales = signal<Sale[]>([]);
  readonly userEmail = localStorage.getItem('lanuitmaison_user') || 'Administrador';

  readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  newProductForm = {
    name: '',
    category: '',
    price: 0,
    costPrice: 0,
    stock: 0,
  };

  saleForm = {
    productId: '',
    quantity: 1,
    unitPrice: 0,
  };

  ngOnInit(): void {
    const userEmail = localStorage.getItem('lanuitmaison_user');

    if (!userEmail) {
      this.router.navigate(['/login']);
      return;
    }

    void this.refreshDashboardData();
  }

  private async refreshDashboardData(): Promise<void> {
    try {
      await this.data.loadData();
      this.products.set(this.data.products());
      this.sales.set(this.data.sales());
      this.tableProducts.set(this.products());
      this.tableSales.set(this.sales());
    } catch {
      // The global Firebase alert displays the load failure.
    }
  }

  async addProduct(): Promise<void> {
    if (!this.newProductForm.name.trim() || !this.newProductForm.category.trim()) {
      return;
    }

    try {
      await this.data.addProduct({
        name: this.newProductForm.name.trim(),
        category: this.newProductForm.category.trim(),
        price: Number(this.newProductForm.price) || 0,
        costPrice: Number(this.newProductForm.costPrice) || 0,
        stock: Number(this.newProductForm.stock) || 0,
      });
    } catch {
      return;
    }

    this.newProductForm = {
      name: '',
      category: '',
      price: 0,
      costPrice: 0,
      stock: 0,
    };
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

    if (quantity <= 0 || unitPrice <= 0) {
      return;
    }

    if (quantity > selectedProduct.stock) {
      return;
    }

    try {
      await this.data.addSale({
        productId: this.saleForm.productId,
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

  async logout(): Promise<void> {
    try {
      await this.data.signOut();
      localStorage.removeItem('lanuitmaison_user');
      await this.router.navigate(['/login']);
    } catch {
      return;
    }
  }
}
