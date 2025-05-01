import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  error: string = '';

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private firestore: Firestore
  ) {
    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        birthDate: ['', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      try {
        const formData = this.registerForm.value;

        // Register the user with Firebase Auth
        const userCredential = await this.authService.register(
          formData.email,
          formData.password
        );

        if (userCredential && userCredential.user) {
          // Save additional user data to Firestore
          const userData = {
            userId: userCredential.user.uid,
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            birthDate: formData.birthDate.toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Save to Firestore users collection
          await setDoc(
            doc(this.firestore, 'users', userCredential.user.uid),
            userData
          );
        }
      } catch (error: any) {
        this.error = error.message || 'An error occurred during registration';
      }
    } else {
      if (this.registerForm.errors?.['mismatch']) {
        this.error = 'Passwords do not match';
      } else {
        this.error = 'Please fill in all fields correctly';
      }
    }
  }
}
