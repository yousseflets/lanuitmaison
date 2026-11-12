import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FirebaseDataService } from './services/firebase-data.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const data = inject(FirebaseDataService);
  const router = inject(Router);

  if (!data.isFirebaseConfigured()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  await data.waitForAuth();
  const user = data.currentUser();
  return user
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
