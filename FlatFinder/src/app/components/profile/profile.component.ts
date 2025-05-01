import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Auth, user, updatePassword } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isEditing = false;
  userData: any = null;
  loading = true;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      birthDate: ['', Validators.required],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required, Validators.minLength(6)]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  ngOnInit() {
    user(this.auth).subscribe(async (user) => {
      if (user) {
        const userDoc = doc(this.firestore, 'users', user.uid);
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists()) {
          this.userData = userSnapshot.data();
          this.profileForm.patchValue({
            firstName: this.userData.firstName || '',
            lastName: this.userData.lastName || '',
            birthDate: this.userData.birthDate
              ? new Date(this.userData.birthDate)
              : '',
          });
        }
        this.loading = false;
      }
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.profileForm.patchValue({
        firstName: this.userData?.firstName || '',
        lastName: this.userData?.lastName || '',
        birthDate: this.userData?.birthDate
          ? new Date(this.userData.birthDate)
          : '',
      });
    }
  }

  async saveProfile() {
    if (this.profileForm.valid) {
      try {
        const user = this.auth.currentUser;
        if (user) {
          const userDoc = doc(this.firestore, 'users', user.uid);
          const formData = this.profileForm.value;

          const userData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            birthDate: formData.birthDate.toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await setDoc(userDoc, userData, { merge: true });

          this.userData = {
            ...this.userData,
            ...userData,
          };

          this.isEditing = false;
          this.snackBar.open('Profile updated successfully', 'Close', {
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        this.snackBar.open('Error updating profile', 'Close', {
          duration: 3000,
        });
      }
    }
  }

  async changePassword() {
    if (this.passwordForm.valid) {
      try {
        const user = this.auth.currentUser;
        if (user) {
          await updatePassword(
            user,
            this.passwordForm.get('newPassword')?.value
          );

          this.snackBar.open('Password changed successfully', 'Close', {
            duration: 3000,
          });

          // Reset the form
          this.passwordForm.reset();
        }
      } catch (error: any) {
        console.error('Error changing password:', error);
        this.snackBar.open(
          error.message || 'Error changing password. Please try again.',
          'Close',
          {
            duration: 3000,
          }
        );
      }
    } else {
      if (this.passwordForm.errors?.['mismatch']) {
        this.snackBar.open('New passwords do not match', 'Close', {
          duration: 3000,
        });
      }
    }
  }
}
