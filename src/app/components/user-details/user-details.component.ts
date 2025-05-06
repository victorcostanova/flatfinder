import { Component, OnInit, Inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, ActivatedRoute, Router } from "@angular/router";
import { HeaderComponent } from "../header/header.component";
import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "@angular/fire/firestore";
import { Auth } from "@angular/fire/auth";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatChipsModule } from "@angular/material/chips";
import { MatSnackBar } from "@angular/material/snack-bar";
import {
  MatDialog,
  MatDialogModule,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";

interface Flat {
  id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  streetName: string;
  streetNumber: string;
  area: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: "app-user-details",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
  ],
  templateUrl: "./user-details.component.html",
  styleUrls: ["./user-details.component.css"],
})
export class UserDetailsComponent implements OnInit {
  user: User | null = null;
  flats: Flat[] = [];
  loading = true;
  isAdmin = false;
  isOwnProfile = false;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  async ngOnInit() {
    await this.checkAdminStatus();
    const userId = this.route.snapshot.paramMap.get("id");
    if (userId) {
      this.isOwnProfile = this.auth.currentUser?.uid === userId;
      if (this.isAdmin || this.isOwnProfile) {
        await this.loadUserDetails(userId);
        await this.loadUserFlats(userId);
      }
    }
    this.loading = false;
  }

  private async checkAdminStatus() {
    const user = this.auth.currentUser;
    if (!user) {
      this.router.navigate(["/login"]);
      return;
    }

    const userDoc = await getDoc(doc(this.firestore, "users", user.uid));
    if (userDoc.exists()) {
      this.isAdmin = userDoc.data()["isAdmin"] || false;
    }
  }

  private async loadUserDetails(userId: string) {
    try {
      const userDoc = await getDoc(doc(this.firestore, "users", userId));
      if (userDoc.exists()) {
        this.user = {
          ...userDoc.data(),
          userId: userDoc.id,
        } as User;
      }
    } catch (error) {
      console.error("Error loading user details:", error);
      this.snackBar.open("Error loading user details", "Close", {
        duration: 3000,
      });
    }
  }

  private async loadUserFlats(userId: string) {
    try {
      const flatsQuery = query(
        collection(this.firestore, "flats"),
        where("userId", "==", userId)
      );
      const flatsSnapshot = await getDocs(flatsQuery);

      this.flats = flatsSnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("Flat data from Firebase:", data); // Debug log

        return {
          id: doc.id,
          title: data["title"],
          description: data["description"],
          price: data["rentPrice"],
          city: data["city"],
          streetName: data["streetName"],
          streetNumber: data["streetNumber"],
          area: data["areaSize"],
          createdAt: data["createdAt"],
          updatedAt: data["updatedAt"],
        } as Flat;
      });

      console.log("Processed flats:", this.flats); // Debug log
    } catch (error) {
      console.error("Error loading user flats:", error);
      this.snackBar.open("Error loading user flats", "Close", {
        duration: 3000,
      });
    }
  }

  viewFlatDetails(flatId: string) {
    this.router.navigate(["/flat", flatId]);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  goBack() {
    this.router.navigate(["/all-users"]);
  }

  async makeAdmin() {
    if (!this.user || !this.isAdmin) return;

    try {
      const userRef = doc(this.firestore, "users", this.user.userId);
      await updateDoc(userRef, {
        isAdmin: true,
        updatedAt: new Date().toISOString(),
      });

      this.user.isAdmin = true;
      this.snackBar.open("User is now an admin", "Close", { duration: 3000 });
    } catch (error) {
      console.error("Error making user admin:", error);
      this.snackBar.open("Error making user admin", "Close", {
        duration: 3000,
      });
    }
  }

  async removeAdmin() {
    if (!this.user || !this.isAdmin) return;

    try {
      const userRef = doc(this.firestore, "users", this.user.userId);
      await updateDoc(userRef, {
        isAdmin: false,
        updatedAt: new Date().toISOString(),
      });

      this.user.isAdmin = false;
      this.snackBar.open("Admin privileges removed", "Close", {
        duration: 3000,
      });
    } catch (error) {
      console.error("Error removing admin privileges:", error);
      this.snackBar.open("Error removing admin privileges", "Close", {
        duration: 3000,
      });
    }
  }

  async deleteUser() {
    if (!this.user || (!this.isAdmin && !this.isOwnProfile)) return;

    const confirmDialog = this.dialog.open(ConfirmDialogComponent, {
      width: "400px",
      data: {
        title: this.isOwnProfile ? "Delete My Account" : "Delete User",
        message:
          "Are you sure you want to delete this account and all associated data? This action cannot be undone.",
      },
    });

    confirmDialog.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          const batch = writeBatch(this.firestore);

          // Delete all user's flats
          const flatsQuery = query(
            collection(this.firestore, "flats"),
            where("userId", "==", this.user!.userId)
          );
          const flatsSnapshot = await getDocs(flatsQuery);
          flatsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });

          // Delete all user's favorite flats
          const favoritesQuery = query(
            collection(this.firestore, "favorites"),
            where("userId", "==", this.user!.userId)
          );
          const favoritesSnapshot = await getDocs(favoritesQuery);
          favoritesSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });

          // Delete user document
          const userRef = doc(this.firestore, "users", this.user!.userId);
          batch.delete(userRef);

          await batch.commit();

          this.snackBar.open(
            "Account and all associated data have been deleted",
            "Close",
            { duration: 3000 }
          );

          if (this.isOwnProfile) {
            await this.auth.signOut();
            this.router.navigate(["/login"]);
          } else {
            this.router.navigate(["/all-users"]);
          }
        } catch (error) {
          console.error("Error deleting user:", error);
          this.snackBar.open("Error deleting account", "Close", {
            duration: 3000,
          });
        }
      }
    });
  }
}

@Component({
  selector: "app-confirm-dialog",
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">
        Delete
      </button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
})
export class ConfirmDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }
  ) {}
}
