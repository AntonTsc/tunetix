import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-datos-personales',
  templateUrl: './datos-personales.component.html',
  styleUrls: ['./datos-personales.component.css']
})
export class DatosPersonalesComponent implements OnInit {
  editingField = {
    name: false,
    email: false,
    password: false
  };

  // User profile data
  userData = {
    name: 'Nombre Apellidos',
    email: 'user@ejemplo.com',
    profileImage: null as string | null // Allow both string and null
  };

  // For file uploads
  selectedFile: File | null = null;

  ngOnInit(): void {
    // Here you would typically fetch user data from a service
    // This is just placeholder initialization
  }

  toggleEdit(field: string): void {
    // @ts-ignore: Object is possibly 'null'
    this.editingField[field] = !this.editingField[field];
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        this.userData.profileImage = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  uploadImage(): void {
    if (this.selectedFile) {
      // Here you would implement the actual upload to your backend
      // For now we'll just keep the preview as the profile image
      console.log('Image would be uploaded here');
      // After successful upload:
      // this.userData.profileImage = response.imageUrl;
    }
  }

  // Helper method to check if user has a profile image
  hasProfileImage(): boolean {
    return this.userData.profileImage !== null;
  }
}
