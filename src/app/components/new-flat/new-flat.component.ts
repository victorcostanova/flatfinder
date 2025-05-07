import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { UploadService } from '../../services/upload.service';

interface Flat {
  city: string;
  streetName: string;
  streetNumber: number;
  areaSize: number;
  hasAC: boolean;
  yearBuilt: number;
  rentPrice: number;
  dateAvailable: Date;
  userId: string;
  createdAt: Date;
  images: string[]; // Array of image URLs
}

@Component({
  selector: 'app-new-flat',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, ReactiveFormsModule],
  templateUrl: './new-flat.component.html',
  styleUrls: ['./new-flat.component.css'],
})
export class NewFlatComponent {
  flatForm: FormGroup;
  selectedFiles: File[] = [];
  isUploading = false;
  uploadProgress = 0;
  previewUrls: string[] = [];

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private auth: Auth,
    private router: Router,
    private uploadService: UploadService
  ) {
    this.flatForm = this.fb.group({
      city: ['', [Validators.required]],
      streetName: ['', [Validators.required]],
      streetNumber: ['', [Validators.required, Validators.min(1)]],
      areaSize: ['', [Validators.required, Validators.min(1)]],
      hasAC: [false],
      yearBuilt: [
        '',
        [
          Validators.required,
          Validators.min(1800),
          Validators.max(new Date().getFullYear()),
        ],
      ],
      rentPrice: ['', [Validators.required, Validators.min(1)]],
      dateAvailable: ['', [Validators.required]],
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
      this.previewUrls = [];
      
      // Generate preview URLs
      this.selectedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  async onSubmit() {
    if (this.flatForm.valid && this.auth.currentUser) {
      try {
        this.isUploading = true;
        
        // Upload images to Cloudinary (if any)
        let imageUrls: string[] = [];
        if (this.selectedFiles.length > 0) {
          imageUrls = await this.uploadService.uploadMultipleImages(this.selectedFiles);
        }
        
        // Create flat data with image URLs
        const flatData: Flat = {
          ...this.flatForm.value,
          userId: this.auth.currentUser.uid,
          createdAt: new Date(),
          images: imageUrls
        };

        const flatsRef = collection(this.firestore, 'flats');
        await addDoc(flatsRef, flatData);
        
        this.isUploading = false;
        this.router.navigate(['/home']);
      } catch (error) {
        this.isUploading = false;
        console.error('Error saving flat:', error);
      }
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.flatForm.get(controlName);
    if (control?.errors) {
      if (control.errors['required']) {
        return 'This field is required';
      }
      if (control.errors['min']) {
        return `Minimum value is ${control.errors['min'].min}`;
      }
      if (control.errors['max']) {
        return `Maximum value is ${control.errors['max'].max}`;
      }
    }
    return '';
  }
}
