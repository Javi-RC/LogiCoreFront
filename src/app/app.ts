import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialog } from './shared/ui/confirm-dialog/confirm-dialog';
import { Toaster } from './shared/ui/toaster/toaster';
import { WelcomeTour } from './shared/ui/welcome-tour/welcome-tour';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toaster, ConfirmDialog, WelcomeTour],
  templateUrl: './app.html',
})
export class App {}
