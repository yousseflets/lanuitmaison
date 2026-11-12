import { CommonModule } from '@angular/common';
import { Component, computed, Signal, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FirebaseDataService, Order } from '../services/firebase-data.service';
import { clearStoredUserEmail, getStoredUserEmail } from '../session-storage';

interface CalendarDay {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  orderCount: number;
}

@Component({
  selector: 'app-agenda-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './agenda-page.component.html',
  styleUrl: './agenda-page.component.scss',
})
export class AgendaPageComponent {
  readonly orders: Signal<Order[]>;
  readonly userEmail = getStoredUserEmail();
  readonly today = this.toDateInputValue(new Date());
  readonly displayedMonth = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  readonly selectedDate = signal(this.today);
  readonly weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  readonly calendarDays = computed(() => {
    const month = this.displayedMonth();
    const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const startDate = new Date(month.getFullYear(), month.getMonth(), 1 - startOffset);

    return Array.from({ length: 42 }, (_, index): CalendarDay => {
      const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + index);
      const dateKey = this.toDateInputValue(date);
      return {
        dateKey,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === month.getMonth(),
        isToday: dateKey === this.today,
        orderCount: this.orders().filter((order) => order.deliveryDate === dateKey && !order.delivered).length,
      };
    });
  });

  readonly selectedOrders = computed(() =>
    this.orders()
      .filter((order) => order.deliveryDate === this.selectedDate())
      .sort((left, right) => Number(left.delivered) - Number(right.delivered)),
  );
  readonly pendingCount = computed(() => this.orders().filter((order) => !order.delivered).length);
  readonly monthLabel = computed(() =>
    this.displayedMonth().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
  );

  constructor(
    private readonly data: FirebaseDataService,
    private readonly router: Router,
  ) {
    this.orders = this.data.orders;
  }

  previousMonth(): void {
    const month = this.displayedMonth();
    this.displayedMonth.set(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const month = this.displayedMonth();
    this.displayedMonth.set(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
  }

  async markDelivered(order: Order): Promise<void> {
    if (order.id) {
      try {
        await this.data.markOrderDelivered(order.id);
      } catch {
        return;
      }
    }
  }

  formatSelectedDate(): string {
    return new Date(`${this.selectedDate()}T00:00:00`).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
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
