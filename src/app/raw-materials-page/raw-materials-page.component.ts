import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FirebaseDataService, RawMaterial } from '../services/firebase-data.service';
import { clearStoredUserEmail, getStoredUserEmail } from '../session-storage';

@Component({
  selector: 'app-raw-materials-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './raw-materials-page.component.html',
  styleUrl: './raw-materials-page.component.scss',
})
export class RawMaterialsPageComponent {
  readonly materials = signal<RawMaterial[]>([]);
  readonly userEmail = getStoredUserEmail();
  readonly lowStockMaterials = computed(() =>
    this.materials().filter((material) => material.quantity <= material.minimumQuantity),
  );
  readonly totalValue = computed(() =>
    this.materials().reduce((total, material) => total + material.quantity * material.unitCost, 0),
  );

  isModalOpen = false;
  isAdjustmentModalOpen = false;
  editingMaterialId: string | null = null;
  adjustmentMaterial: RawMaterial | null = null;
  adjustmentType: 'entry' | 'consumption' = 'entry';
  adjustmentQuantity = 0;
  formError = '';

  materialForm = {
    name: '',
    unit: '',
    quantity: 0,
    minimumQuantity: 0,
    unitCost: 0,
  };

  readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  constructor(
    private readonly data: FirebaseDataService,
    private readonly router: Router,
  ) {
    this.materials = this.data.rawMaterials;
  }

  openCreateModal(): void {
    this.editingMaterialId = null;
    this.resetForm();
    this.formError = '';
    this.isModalOpen = true;
  }

  openEditModal(material: RawMaterial): void {
    this.editingMaterialId = material.id ?? null;
    this.materialForm = {
      name: material.name,
      unit: material.unit,
      quantity: material.quantity,
      minimumQuantity: material.minimumQuantity,
      unitCost: material.unitCost,
    };
    this.formError = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.formError = '';
    this.resetForm();
  }

  openAdjustmentModal(material: RawMaterial, type: 'entry' | 'consumption'): void {
    this.adjustmentMaterial = material;
    this.adjustmentType = type;
    this.adjustmentQuantity = 0;
    this.formError = '';
    this.isAdjustmentModalOpen = true;
  }

  closeAdjustmentModal(): void {
    this.isAdjustmentModalOpen = false;
    this.adjustmentMaterial = null;
    this.adjustmentQuantity = 0;
    this.formError = '';
  }

  async saveMaterial(): Promise<void> {
    const name = this.materialForm.name.trim();
    const unit = this.materialForm.unit.trim();
    if (!name || !unit) {
      this.formError = 'Informe o nome e a unidade de medida.';
      return;
    }

    const quantity = Number(this.materialForm.quantity);
    const minimumQuantity = Number(this.materialForm.minimumQuantity);
    const unitCost = Number(this.materialForm.unitCost);
    if (
      ![quantity, minimumQuantity, unitCost].every(Number.isFinite) ||
      quantity < 0 ||
      minimumQuantity < 0 ||
      unitCost < 0
    ) {
      this.formError = 'As quantidades e o custo devem ser números iguais ou maiores que zero.';
      return;
    }

    const payload = {
      name,
      unit,
      quantity,
      minimumQuantity,
      unitCost,
    };

    try {
      if (this.editingMaterialId) {
        await this.data.updateRawMaterial(this.editingMaterialId, payload);
      } else {
        await this.data.addRawMaterial(payload);
      }
      this.closeModal();
    } catch {
      this.formError = 'Não foi possível salvar. Verifique sua conexão e tente novamente.';
    }
  }

  async saveAdjustment(): Promise<void> {
    const change = Number(this.adjustmentQuantity);
    if (!this.adjustmentMaterial?.id || !Number.isFinite(change) || change <= 0) {
      this.formError = 'Informe uma quantidade maior que zero.';
      return;
    }

    const quantity =
      this.adjustmentType === 'entry'
        ? this.adjustmentMaterial.quantity + change
        : this.adjustmentMaterial.quantity - change;

    if (quantity < 0) {
      this.formError = 'O consumo não pode ser maior que a quantidade disponível.';
      return;
    }

    try {
      await this.data.updateRawMaterial(this.adjustmentMaterial.id, { quantity });
      this.closeAdjustmentModal();
    } catch {
      this.formError = 'Não foi possível atualizar o estoque. Verifique sua conexão e tente novamente.';
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
    this.materialForm = {
      name: '',
      unit: '',
      quantity: 0,
      minimumQuantity: 0,
      unitCost: 0,
    };
  }
}
