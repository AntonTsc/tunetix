import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactService } from 'src/app/services/contact.service';

@Component({
  selector: 'app-contacto',
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.css']
})
export class ContactoComponent implements OnInit {
  contactForm!: FormGroup;
  loading = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private contactService: ContactService
  ) { }

  ngOnInit(): void {
    this.contactForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  // Getter para facilitar el acceso a los campos del formulario
  get f() { return this.contactForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Detener si el formulario es inválido
    if (this.contactForm.invalid) {
      return;
    }

    this.loading = true;

    const formData = {
      ...this.contactForm.value,
      date: new Date(),
      status: 'nuevo'
    };

    this.contactService.submitContactForm(formData)
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.submitted = false;
          this.successMessage = 'Tu mensaje ha sido enviado correctamente. Nos pondremos en contacto contigo pronto.';
          this.contactForm.reset();

          // Scroll hacia el mensaje de éxito
          setTimeout(() => {
            const successElement = document.querySelector('.bg-green-50');
            if (successElement) {
              successElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = 'Hubo un problema al enviar tu mensaje. Por favor, inténtalo de nuevo.';
          console.error('Error al enviar formulario:', error);
        }
      });
  }
}
