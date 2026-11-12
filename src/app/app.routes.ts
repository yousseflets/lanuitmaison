import { Routes } from '@angular/router';
import { DashboardPageComponent } from './dashboard-page/dashboard-page.component';
import { InventoryPageComponent } from './inventory-page/inventory-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { OrdersPageComponent } from './orders-page/orders-page.component';
import { AgendaPageComponent } from './agenda-page/agenda-page.component';
import { ProductsPageComponent } from './products-page/products-page.component';
import { SalesPageComponent } from './sales-page/sales-page.component';
import { ShopeePageComponent } from './shopee-page/shopee-page.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'dashboard', component: DashboardPageComponent, canActivate: [authGuard] },
  { path: 'products', component: ProductsPageComponent, canActivate: [authGuard] },
  { path: 'inventory', component: InventoryPageComponent, canActivate: [authGuard] },
  { path: 'sales', component: SalesPageComponent, canActivate: [authGuard] },
  { path: 'shopee', component: ShopeePageComponent, canActivate: [authGuard] },
  { path: 'orders', component: OrdersPageComponent, canActivate: [authGuard] },
  { path: 'agenda', component: AgendaPageComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
