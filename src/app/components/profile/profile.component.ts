import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { HeaderComponent } from "../header/header.component";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Auth, user, updatePassword } from "@angular/fire/auth";
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  writeBatch,
} from "@angular/fire/firestore";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { ConfirmDialogComponent } from "../user-details/user-details.component";

@Component({
  selector: "app-profile",
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
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"],
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  loading = true;
  isAdmin = false;
  editingField: { [key: string]: boolean } = {
    firstName: false,
    lastName: false,
    birthDate: false,
  };

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.profileForm = this.fb.group({
      firstName: ["", Validators.required],
      lastName: ["", Validators.required],
      birthDate: ["", Validators.required],
      email: [{ value: "", disabled: true }],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ["", Validators.required],
      newPassword: ["", [Validators.required, Validators.minLength(6)]],
      confirmPassword: ["", Validators.required],
    });
  }

  async ngOnInit() {
    const user = this.auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(this.firestore, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.isAdmin = userData["isAdmin"] || false;
        this.profileForm.patchValue({
          firstName: userData["firstName"],
          lastName: userData["lastName"],
          birthDate: userData["birthDate"]
            ? new Date(userData["birthDate"])
            : "",
          email: user.email,
        });
      }
    }
    this.loading = false;
  }

  toggleEdit(field: string) {
    this.editingField[field] = !this.editingField[field];
    if (!this.editingField[field]) {
      // Reset the field value if canceling edit
      const user = this.auth.currentUser;
      if (user) {
        getDoc(doc(this.firestore, "users", user.uid)).then((userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            this.profileForm
              .get(field)
              ?.patchValue(
                field === "birthDate"
                  ? new Date(userData[field])
                  : userData[field]
              );
          }
        });
      }
    }
  }

  async saveField(field: string) {
    if (this.profileForm.get(field)?.valid) {
      try {
        const user = this.auth.currentUser;
        if (!user) return;

        const value = this.profileForm.get(field)?.value;
        const updateData = {
          [field]: field === "birthDate" ? value.toISOString() : value,
          updatedAt: new Date().toISOString(),
        };

        await updateDoc(doc(this.firestore, "users", user.uid), updateData);

        this.editingField[field] = false;
        this.snackBar.open("Profile updated successfully!", "Close", {
          duration: 3000,
        });
      } catch (error) {
        console.error("Error updating profile:", error);
        this.snackBar.open("Error updating profile", "Close", {
          duration: 3000,
        });
      }
    }
  }

  async changePassword() {
    if (this.passwordForm.valid) {
      try {
        const user = this.auth.currentUser;
        if (!user) return;

        await updatePassword(user, this.passwordForm.value.newPassword);

        this.passwordForm.reset();
        this.snackBar.open("Password changed successfully!", "Close", {
          duration: 3000,
        });
      } catch (error) {
        console.error("Error changing password:", error);
        this.snackBar.open("Error changing password", "Close", {
          duration: 3000,
        });
      }
    }
  }

  async deleteAccount() {
    const user = this.auth.currentUser;
    if (!user) return;

    const confirmDialog = this.dialog.open(ConfirmDialogComponent, {
      width: "400px",
      data: {
        title: "Delete My Account",
        message:
          "Are you sure you want to delete your account and all associated data? This action cannot be undone.",
      },
    });

    confirmDialog.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          const batch = writeBatch(this.firestore);

          // Delete all user's flats
          const flatsQuery = query(
            collection(this.firestore, "flats"),
            where("userId", "==", user.uid)
          );
          const flatsSnapshot = await getDocs(flatsQuery);
          flatsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });

          // Delete all user's favorite flats
          const favoritesQuery = query(
            collection(this.firestore, "favorites"),
            where("userId", "==", user.uid)
          );
          const favoritesSnapshot = await getDocs(favoritesQuery);
          favoritesSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });

          // Delete user document
          const userRef = doc(this.firestore, "users", user.uid);
          batch.delete(userRef);

          await batch.commit();

          this.snackBar.open(
            "Account and all associated data have been deleted",
            "Close",
            { duration: 3000 }
          );

          await this.auth.signOut();
          this.router.navigate(["/login"]);
        } catch (error) {
          console.error("Error deleting account:", error);
          this.snackBar.open("Error deleting account", "Close", {
            duration: 3000,
          });
        }
      }
    });
  }
}
