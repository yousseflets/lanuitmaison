import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FirebaseDataService, Product } from '../services/firebase-data.service';
import { clearStoredUserEmail, getStoredUserEmail } from '../session-storage';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.scss',
})
export class ProductsPageComponent {
  readonly products = signal<Product[]>([]);
  readonly userEmail = getStoredUserEmail();

  readonly totalValue = computed(() =>
    this.products().reduce((total, product) => total + product.price * product.stock, 0),
  );

  editingProductId: string | null = null;
  isModalOpen = false;

  newProductForm = {
    name: '',
    category: '',
    price: 0,
    costPrice: 0,
    stock: 0,
  };

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

  openCreateModal(): void {
    this.editingProductId = null;
    this.resetForm();
    this.isModalOpen = true;
  }

  openEditModal(product: Product): void {
    this.editingProductId = product.id ?? null;
    this.newProductForm = {
      name: product.name,
      category: product.category,
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.resetForm();
  }

  async addProduct(): Promise<void> {
    if (!this.newProductForm.name.trim() || !this.newProductForm.category.trim()) {
      return;
    }

    const payload = {
      name: this.newProductForm.name.trim(),
      category: this.newProductForm.category.trim(),
      price: Number(this.newProductForm.price) || 0,
      costPrice: Number(this.newProductForm.costPrice) || 0,
      stock: Number(this.newProductForm.stock) || 0,
      active: true,
    };

    try {
      if (this.editingProductId) {
        await this.data.updateProduct(this.editingProductId, payload);
      } else {
        await this.data.addProduct(payload);
      }
    } catch {
      return;
    }

    this.closeModal();
  }

  editProduct(product: Product): void {
    this.openEditModal(product);
  }

  async toggleProductStatus(productId: string | undefined): Promise<void> {
    if (!productId) {
      return;
    }

    try {
      await this.data.toggleProductStatus(productId);
    } catch {
      return;
    }
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

  private resetForm(): void {
    this.editingProductId = null;
    this.newProductForm = {
      name: '',
      category: '',
      price: 0,
      costPrice: 0,
      stock: 0,
    };
  }
}
