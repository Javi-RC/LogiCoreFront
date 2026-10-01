import { Directive, ElementRef, inject, output } from '@angular/core';
import { NgForm } from '@angular/forms';

// (appSubmit) solo se emite si el formulario es válido; si no, marca los campos
// para que muestren su error y lleva el foco al primero.
@Directive({
  selector: 'form[appSubmit]',
  host: { '(submit)': 'onSubmit()' },
})
export class ValidatedSubmit {
  private readonly form = inject(NgForm);
  private readonly host = inject<ElementRef<HTMLFormElement>>(ElementRef);

  readonly appSubmit = output<void>();

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.control.markAllAsTouched();
      this.host.nativeElement
        .querySelector<HTMLElement>('input.ng-invalid, select.ng-invalid, textarea.ng-invalid')
        ?.focus();
      return;
    }
    this.appSubmit.emit();
  }
}
