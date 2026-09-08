import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root shell: nothing but the router outlet.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {}
