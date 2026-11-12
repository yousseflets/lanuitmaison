import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseDataService } from '../services/firebase-data.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  loginForm = {
    email: '',
    password: '',
  };

  errorMessage = '';
  isSubmitting = false;

  constructor(
    readonly data: FirebaseDataService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  async onSubmit(): Promise<void> {
    const email = this.loginForm.email.trim();
    const password = this.loginForm.password;

    if (!email || !password) {
      this.errorMessage = 'Informe e-mail e senha para continuar.';
      return;
    }

    if (!this.data.isFirebaseConfigured()) {
      this.errorMessage = 'Configure o app Web do Firebase antes de entrar.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      await this.data.signIn(email, password);
      localStorage.setItem('lanuitmaison_user', email);

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      const destination = returnUrl?.startsWith('/') && !returnUrl.startsWith('//')
        ? returnUrl
        : '/dashboard';
      await this.router.navigateByUrl(destination);
    } catch (error) {
      const code = this.getErrorCode(error);
      this.errorMessage = code === 'auth/too-many-requests'
        ? 'Muitas tentativas. Aguarde um momento e tente novamente.'
        : 'Não foi possível entrar. Confira o e-mail e a senha cadastrados no Firebase Authentication.';
    } finally {
      this.isSubmitting = false;
    }
  }

  private getErrorCode(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      return String(error.code);
    }

    return '';
  }
}
