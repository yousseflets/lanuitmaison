import { Injectable, signal } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  Firestore,
  getDocs,
  getFirestore,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { environment } from '../../environments/environment';

export interface Product {
  id?: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  active?: boolean;
  createdAt?: string;
}

export interface RawMaterial {
  id?: string;
  name: string;
  unit: string;
  quantity: number;
  minimumQuantity: number;
  unitCost: number;
  createdAt?: string;
}

export interface Sale {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  profit: number;
  date: string;
}

export interface ShopeeProduct {
  id?: string;
  name: string;
  price: number;
  costPrice: number;
  fee: number;
  createdAt: string;
}

export interface ShopeeSale {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  fee: number;
  profit: number;
  date: string;
}

export interface Order {
  id?: string;
  customerName: string;
  phone: string;
  description: string;
  productId?: string;
  deliveryDate: string;
  notes: string;
  delivered: boolean;
  paid?: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseDataService {
  readonly products = signal<Product[]>([]);
  readonly rawMaterials = signal<RawMaterial[]>([]);
  readonly sales = signal<Sale[]>([]);
  readonly shopeeProducts = signal<ShopeeProduct[]>([]);
  readonly shopeeSales = signal<ShopeeSale[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly currentUser = signal<User | null>(null);
  readonly firebaseError = signal<string | null>(null);

  private app?: FirebaseApp;
  private auth?: Auth;
  private db?: Firestore;
  private readonly authReadyPromise: Promise<User | null>;
  private resolveAuthReady!: (user: User | null) => void;

  private readonly demoProducts: Product[] = [
    {
      id: 'p-1',
      name: 'Cafeteira Deluxe',
      category: 'Casa',
      price: 499.9,
      costPrice: 320,
      stock: 8,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-2',
      name: 'Toalha de Banho',
      category: 'Casa',
      price: 89.9,
      costPrice: 42,
      stock: 15,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-3',
      name: 'Kit de Mesa',
      category: 'Decoração',
      price: 159.9,
      costPrice: 92,
      stock: 2,
      active: false,
      createdAt: new Date().toISOString(),
    },
  ];

  private readonly demoSales: Sale[] = [
    {
      id: 's-1',
      productId: 'p-1',
      productName: 'Cafeteira Deluxe',
      quantity: 2,
      unitPrice: 499.9,
      profit: 359.8,
      date: new Date().toISOString(),
    },
    {
      id: 's-2',
      productId: 'p-3',
      productName: 'Kit de Mesa',
      quantity: 1,
      unitPrice: 159.9,
      profit: 67.9,
      date: new Date().toISOString(),
    },
  ];

  constructor() {
    this.authReadyPromise = new Promise((resolve) => {
      this.resolveAuthReady = resolve;
    });
    this.products.set(this.demoProducts);
    this.sales.set(this.demoSales);
    this.initializeFirebase();
  }

  isFirebaseConfigured(): boolean {
    return !!this.auth && !!this.db;
  }

  waitForAuth(): Promise<User | null> {
    return this.authReadyPromise;
  }

  async signIn(email: string, password: string): Promise<void> {
    if (!this.auth) {
      throw new Error('Firebase ainda não foi configurado para este projeto.');
    }

    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    this.currentUser.set(credential.user);
    this.resolveAuthReady(credential.user);
  }

  async signOut(): Promise<void> {
    this.currentUser.set(null);
    this.products.set([]);
    this.rawMaterials.set([]);
    this.sales.set([]);
    this.orders.set([]);
    this.shopeeProducts.set([]);
    this.shopeeSales.set([]);

    if (this.auth) {
      try {
        await signOut(this.auth);
      } catch (error) {
        this.firebaseError.set('Não foi possível encerrar a sessão do Firebase.');
        throw error;
      }
    }
  }

  clearFirebaseError(): void {
    this.firebaseError.set(null);
  }

  async loadData(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      const productsSnapshot = await getDocs(collection(this.db, 'products'));
      const rawMaterialsSnapshot = await getDocs(collection(this.db, 'rawMaterials'));
      const salesSnapshot = await getDocs(collection(this.db, 'sales'));
      const ordersSnapshot = await getDocs(collection(this.db, 'orders'));
      const shopeeProductsSnapshot = await getDocs(collection(this.db, 'shopeeProducts'));
      const shopeeSalesSnapshot = await getDocs(collection(this.db, 'shopeeSales'));

      const productList = productsSnapshot.docs.map((snapshot) => ({
        id: snapshot.id,
        ...(snapshot.data() as Omit<Product, 'id'>),
      }));
      const rawMaterialList = rawMaterialsSnapshot.docs.map((snapshot) => ({
        id: snapshot.id,
        ...(snapshot.data() as Omit<RawMaterial, 'id'>),
      }));

      const saleList = salesSnapshot.docs.map((snapshot) => ({
        id: snapshot.id,
        ...(snapshot.data() as Omit<Sale, 'id'>),
      }));
      const orderList = ordersSnapshot.docs.map((snapshot) => ({
        id: snapshot.id,
        ...(snapshot.data() as Omit<Order, 'id'>),
      }));
      const shopeeProductList = shopeeProductsSnapshot.docs.map((snapshot) => ({
        id: snapshot.id,
        ...(snapshot.data() as Omit<ShopeeProduct, 'id'>),
      }));
      const shopeeSaleList = shopeeSalesSnapshot.docs.map((snapshot) => ({
        id: snapshot.id,
        ...(snapshot.data() as Omit<ShopeeSale, 'id'>),
      }));

      this.products.set(productList);
      this.rawMaterials.set(rawMaterialList);
      this.sales.set(saleList);
      this.orders.set(orderList);
      this.shopeeProducts.set(shopeeProductList);
      this.shopeeSales.set(shopeeSaleList);
      this.firebaseError.set(null);
    } catch (error) {
      console.error('Não foi possível carregar os dados do Firebase.', error);
      this.firebaseError.set('Não foi possível carregar os dados do Firebase. Verifique a conexão e as regras do Firestore.');
      throw error;
    }
  }

  async addProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<void> {
    const normalizedProduct: Product = {
      ...product,
      price: Number(product.price) || 0,
      costPrice: Number(product.costPrice) || 0,
      stock: Number(product.stock) || 0,
      active: product.active ?? true,
      createdAt: new Date().toISOString(),
    };

    if (!this.db) {
      const nextProducts = [...this.products(), { ...normalizedProduct, id: crypto.randomUUID() }];
      this.products.set(nextProducts);
      return;
    }

    try {
      const addedDocument = await addDoc(collection(this.db, 'products'), normalizedProduct);
      this.products.update((currentProducts) => [
        ...currentProducts,
        { ...normalizedProduct, id: addedDocument.id },
      ]);
    } catch (error) {
      this.reportWriteError('salvar produto', error);
    }
  }

  async addRawMaterial(material: Omit<RawMaterial, 'id' | 'createdAt'>): Promise<void> {
    const normalizedMaterial: RawMaterial = {
      ...material,
      quantity: Number(material.quantity) || 0,
      minimumQuantity: Number(material.minimumQuantity) || 0,
      unitCost: Number(material.unitCost) || 0,
      createdAt: new Date().toISOString(),
    };

    if (!this.db) {
      this.rawMaterials.update((materials) => [
        ...materials,
        { ...normalizedMaterial, id: crypto.randomUUID() },
      ]);
      return;
    }

    try {
      const addedDocument = await addDoc(collection(this.db, 'rawMaterials'), normalizedMaterial);
      this.rawMaterials.update((materials) => [
        ...materials,
        { ...normalizedMaterial, id: addedDocument.id },
      ]);
    } catch (error) {
      this.reportWriteError('salvar matéria-prima', error);
    }
  }

  async updateRawMaterial(
    materialId: string,
    material: Partial<Omit<RawMaterial, 'id'>>,
  ): Promise<void> {
    if (this.db) {
      try {
        await updateDoc(doc(this.db, 'rawMaterials', materialId), material);
      } catch (error) {
        this.reportWriteError('atualizar matéria-prima', error);
      }
    }

    this.rawMaterials.update((materials) =>
      materials.map((current) =>
        current.id === materialId ? { ...current, ...material } : current,
      ),
    );
  }

  async updateProduct(productId: string, product: Partial<Omit<Product, 'id'>>): Promise<void> {
    if (this.db) {
      try {
        await updateDoc(doc(this.db, 'products', productId), product);
      } catch (error) {
        this.reportWriteError('atualizar produto', error);
      }
    }

    this.products.update((currentProducts) =>
      currentProducts.map((currentProduct) =>
        currentProduct.id === productId ? { ...currentProduct, ...product } : currentProduct,
      ),
    );
  }

  async toggleProductStatus(productId: string): Promise<void> {
    const currentProduct = this.products().find((product) => product.id === productId);
    if (!currentProduct) {
      return;
    }

    const active = !(currentProduct.active ?? true);
    if (this.db) {
      try {
        await updateDoc(doc(this.db, 'products', productId), { active });
      } catch (error) {
        this.reportWriteError('atualizar status do produto', error);
      }
    }

    this.products.update((currentProducts) =>
      currentProducts.map((currentProduct) =>
        currentProduct.id === productId
          ? { ...currentProduct, active }
          : currentProduct,
      ),
    );
  }

  async addSale(sale: Omit<Sale, 'id' | 'profit'>): Promise<void> {
    const selectedProduct = this.products().find((product) => product.id === sale.productId);

    if (!selectedProduct) {
      return;
    }

    const quantity = Number(sale.quantity) || 0;
    const unitPrice = Number(sale.unitPrice) || 0;
    const profit = (unitPrice - (selectedProduct.costPrice || 0)) * quantity;
    const nextStock = Math.max(selectedProduct.stock - quantity, 0);

    const saleRecord: Sale = {
      ...sale,
      productName: selectedProduct.name,
      quantity,
      unitPrice,
      profit,
      date: new Date().toISOString(),
    };

    if (!this.db) {
      this.sales.update((currentSales) => [...currentSales, { ...saleRecord, id: crypto.randomUUID() }]);
      this.products.update((currentProducts) =>
        currentProducts.map((product) =>
          product.id === selectedProduct.id ? { ...product, stock: nextStock } : product,
        ),
      );
      return;
    }

    try {
      const batch = writeBatch(this.db);
      const saleDocument = doc(collection(this.db, 'sales'));
      batch.set(saleDocument, saleRecord);
      batch.update(doc(this.db, 'products', selectedProduct.id ?? ''), { stock: nextStock });
      await batch.commit();

      this.sales.update((currentSales) => [...currentSales, { ...saleRecord, id: saleDocument.id }]);
      this.products.update((currentProducts) =>
        currentProducts.map((product) =>
          product.id === selectedProduct.id ? { ...product, stock: nextStock } : product,
        ),
      );
    } catch (error) {
      this.reportWriteError('registrar venda', error);
    }
  }

  async addShopeeProduct(product: Omit<ShopeeProduct, 'id' | 'createdAt'>): Promise<void> {
    const productRecord: ShopeeProduct = {
      name: product.name.trim(),
      price: Number(product.price),
      costPrice: Number(product.costPrice),
      fee: Number(product.fee),
      createdAt: new Date().toISOString(),
    };

    if (!this.db) {
      this.shopeeProducts.update((products) => [
        ...products,
        { ...productRecord, id: crypto.randomUUID() },
      ]);
      return;
    }

    try {
      const savedDocument = await addDoc(collection(this.db, 'shopeeProducts'), productRecord);
      this.shopeeProducts.update((products) => [
        ...products,
        { ...productRecord, id: savedDocument.id },
      ]);
    } catch (error) {
      this.reportWriteError('salvar produto Shopee', error);
    }
  }

  async addShopeeSale(productId: string, quantity: number): Promise<void> {
    const product = this.shopeeProducts().find((item) => item.id === productId);
    if (!product) {
      return;
    }

    const saleRecord: ShopeeSale = {
      productId,
      productName: product.name,
      quantity,
      unitPrice: product.price,
      costPrice: product.costPrice,
      fee: product.fee,
      profit: (product.price - product.costPrice - product.fee) * quantity,
      date: new Date().toISOString(),
    };

    if (!this.db) {
      this.shopeeSales.update((sales) => [...sales, { ...saleRecord, id: crypto.randomUUID() }]);
      return;
    }

    try {
      const savedDocument = await addDoc(collection(this.db, 'shopeeSales'), saleRecord);
      this.shopeeSales.update((sales) => [...sales, { ...saleRecord, id: savedDocument.id }]);
    } catch (error) {
      this.reportWriteError('registrar venda Shopee', error);
    }
  }

  async addOrder(order: Omit<Order, 'id' | 'createdAt' | 'delivered'>): Promise<void> {
    const orderRecord: Order = {
      ...order,
      customerName: order.customerName.trim(),
      phone: order.phone.trim(),
      description: order.description.trim(),
      notes: order.notes.trim(),
      delivered: false,
      paid: order.paid ?? false,
      createdAt: new Date().toISOString(),
    };

    if (!this.db) {
      this.orders.update((currentOrders) => [
        ...currentOrders,
        { ...orderRecord, id: crypto.randomUUID() },
      ]);
      return;
    }

    try {
      const savedDocument = await addDoc(collection(this.db, 'orders'), orderRecord);
      this.orders.update((currentOrders) => [...currentOrders, { ...orderRecord, id: savedDocument.id }]);
    } catch (error) {
      this.reportWriteError('salvar encomenda', error);
    }
  }

  async markOrderDelivered(orderId: string): Promise<void> {
    if (!this.db) {
      this.orders.update((currentOrders) =>
        currentOrders.map((order) => (order.id === orderId ? { ...order, delivered: true } : order)),
      );
      return;
    }

    try {
      await updateDoc(doc(this.db, 'orders', orderId), { delivered: true });
    } catch (error) {
      this.reportWriteError('atualizar entrega', error);
    }

    this.orders.update((currentOrders) =>
      currentOrders.map((order) => (order.id === orderId ? { ...order, delivered: true } : order)),
    );
  }

  async toggleOrderPaid(orderId: string): Promise<void> {
    const order = this.orders().find((currentOrder) => currentOrder.id === orderId);
    if (!order) {
      return;
    }

    const paid = !(order.paid ?? false);
    if (this.db) {
      try {
        await updateDoc(doc(this.db, 'orders', orderId), { paid });
      } catch (error) {
        this.reportWriteError('atualizar pagamento da encomenda', error);
      }
    }

    this.orders.update((currentOrders) =>
      currentOrders.map((currentOrder) =>
        currentOrder.id === orderId ? { ...currentOrder, paid } : currentOrder,
      ),
    );
  }

  private initializeFirebase(): void {
    const firebaseConfig = environment.firebaseConfig;
    const requiredConfigValues = [
      firebaseConfig.apiKey,
      firebaseConfig.authDomain,
      firebaseConfig.projectId,
      firebaseConfig.appId,
    ];
    const hasConfig = requiredConfigValues.every(
      (value) => !!value && !value.startsWith('YOUR_') && value !== 'demo-project-id',
    );

    if (!hasConfig) {
      this.resolveAuthReady(null);
      return;
    }

    try {
      this.app = initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser.set(user);
        this.resolveAuthReady(user);

        if (user) {
          void this.loadData().catch(() => undefined);
        } else {
          this.products.set([]);
          this.rawMaterials.set([]);
          this.sales.set([]);
          this.orders.set([]);
          this.shopeeProducts.set([]);
          this.shopeeSales.set([]);
        }
      });
    } catch (error) {
      console.error('Não foi possível inicializar o Firebase.', error);
      this.firebaseError.set('Não foi possível inicializar o Firebase. Confira a configuração do projeto.');
      this.resolveAuthReady(null);
    }
  }

  private reportWriteError(action: string, error: unknown): never {
    console.error(`Falha ao ${action} no Firebase.`, error);
    this.firebaseError.set(`Não foi possível ${action}. Verifique sua conexão e as regras do Firestore.`);
    throw error;
  }
}
