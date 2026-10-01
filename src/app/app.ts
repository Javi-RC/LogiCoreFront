import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialog } from './shared/ui/confirm-dialog/confirm-dialog';
import { Toaster } from './shared/ui/toaster/toaster';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toaster, ConfirmDialog],
  templateUrl: './app.html',
})
export class App {}
