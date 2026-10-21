import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { useFrenchTexts } from '@core/i18n/i18n.fixtures';
import { useCleanStorage } from '@core/storage/storage.fixtures';
import { settle } from '@core/testing/testing.fixtures';

import { LoginPage } from './login';

describe('LoginPage', () => {
  useFrenchTexts();
  useCleanStorage();

  let http: HttpTestingController;
  let fixture: ComponentFixture<LoginPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  /**
   * Types a password and submits the form.
   */
  function submit(password: string): void {
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    input.value = password;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('form')!.requestSubmit();
    fixture.detectChanges();
  }

  it('keeps the button off until a password is typed', () => {
    const button = (fixture.nativeElement as HTMLElement).querySelector('button[type=submit]');
    expect(button?.hasAttribute('disabled')).toBe(true);
  });

  it('stores the token and opens the feed on the right password', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    submit('secret');

    const request = http.expectOne('/api/auth/login');
    expect(request.request.body).toEqual({ password: 'secret' });
    request.flush({ token: 'token-1' });
    await settle(fixture);

    expect(localStorage.getItem('job-finder-token')).toBe('token-1');
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('says the password is wrong on a refusal', async () => {
    submit('nope');
    http.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain('Mot de passe incorrect.');
    expect(localStorage.getItem('job-finder-token')).toBeNull();
  });
});
