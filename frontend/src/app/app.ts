import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  Router,
  RouterOutlet,
} from '@angular/router';

import { first } from 'rxjs';

import { hideSplash } from '@core/startup/splash.utils';

/**
 * Root shell: nothing but the router outlet, every screen draws its own frame.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  /**
   * Fades the start-up screen of `index.html` out once the first navigation settles, whatever its outcome.
   */
  constructor() {
    const document = inject(DOCUMENT);
    inject(Router)
      .events.pipe(
        first(
          (event) =>
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError,
        ),
      )
      .subscribe(() => hideSplash(document));
  }
}
