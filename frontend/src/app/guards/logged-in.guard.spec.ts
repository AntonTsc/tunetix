import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { LoggedInGuard } from './logged-in.guard';

describe('LoggedInGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
      TestBed.runInInjectionContext(() => LoggedInGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
