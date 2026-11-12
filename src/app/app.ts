import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FirebaseDataService } from './services/firebase-data.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  template: `
    <router-outlet />
    @if (data.firebaseError(); as error) {
      <aside class="firebase-error" role="alert">
        <span>{{ error }}</span>
        <button type="button" aria-label="Fechar aviso" (click)="data.clearFirebaseError()">×</button>
      </aside>
    }
  `,
})
export class App {
  constructor(readonly data: FirebaseDataService) {}
}
