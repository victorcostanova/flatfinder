import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <div class="container">
      <div class="form-container">
        <h1>Complete Your Profile</h1>
        <p>
          Please provide the following information to complete your
          registration.
        </p>

        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName" required />
            <mat-error
              *ngIf="profileForm.get('firstName')?.hasError('required')"
            >
              First name is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName" required />
            <mat-error
              *ngIf="profileForm.get('lastName')?.hasError('required')"
            >
              Last name is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Birth Date</mat-label>
            <input
              matInput
              [matDatepicker]="picker"
              formControlName="birthDate"
              required
            />
            <mat-datepicker-toggle
              matSuffix
              [for]="picker"
            ></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error
              *ngIf="profileForm.get('birthDate')?.hasError('required')"
            >
              Birth date is required
            </mat-error>
          </mat-form-field>

          <button
            mat-raised-button
            color="primary"
            type="submit"
            [disabled]="profileForm.invalid"
          >
            Complete Profile
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 20px;
        background-color: #f5f5f5;
      }

      .form-container {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
      }

      h1 {
        margin-bottom: 0.5rem;
        color: #333;
      }

      p {
        color: #666;
        margin-bottom: 2rem;
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      mat-form-field {
        width: 100%;
      }

      button {
        margin-top: 1rem;
      }
    `,
  ],
})
export class CompleteProfileComponent implements OnInit {
  profileForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      birthDate: ['', Validators.required],
    });
  }

  async ngOnInit() {
    const user = this.auth.currentUser;
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    // Check if user already has profile data
    const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
    if (userDoc.exists() && userDoc.data()['firstName']) {
      this.router.navigate(['/home']);
    }
  }

  async onSubmit() {
    if (this.profileForm.valid) {
      try {
        const user = this.auth.currentUser;
        if (!user) {
          throw new Error('No user logged in');
        }

        const userData = {
          ...this.profileForm.value,
          email: user.email,
          birthDate: this.profileForm.value.birthDate.toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isAdmin: false,
        };

        await setDoc(doc(this.firestore, 'users', user.uid), userData);

        this.snackBar.open('Profile completed successfully!', 'Close', {
          duration: 3000,
        });

        this.router.navigate(['/home']);
      } catch (error) {
        console.error('Error saving profile:', error);
        this.snackBar.open('Error saving profile. Please try again.', 'Close', {
          duration: 3000,
        });
      }
    }
  }
}
