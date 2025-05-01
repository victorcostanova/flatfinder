import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Flat {
  city: string;
  price: number;
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
  flatsCount: number;
  flats?: Flat[];
}

@Component({
  selector: 'app-all-users',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './all-users.component.html',
  styleUrls: ['./all-users.component.css'],
})
export class AllUsersComponent implements OnInit {
  users: User[] = [];
  loading = true;
  isAdmin = false;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    await this.checkAdminStatus();
    if (this.isAdmin) {
      await this.loadUsers();
    }
    this.loading = false;
  }

  private async checkAdminStatus() {
    const user = this.auth.currentUser;
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
    if (userDoc.exists()) {
      this.isAdmin = userDoc.data()['isAdmin'] || false;
    }
  }

  private async loadUsers() {
    try {
      const usersCollection = collection(this.firestore, 'users');
      const usersSnapshot = await getDocs(usersCollection);

      this.users = await Promise.all(
        usersSnapshot.docs.map(async (doc) => {
          const userData = doc.data() as User;
          const flatsQuery = query(
            collection(this.firestore, 'flats'),
            where('userId', '==', doc.id)
          );
          const flatsSnapshot = await getDocs(flatsQuery);
          const flats = flatsSnapshot.docs.map((flatDoc) => ({
            city: flatDoc.data()['city'] || 'Unknown',
            price: flatDoc.data()['price'] || 0,
          }));

          return {
            ...userData,
            userId: doc.id,
            flatsCount: flats.length,
            flats: flats,
          };
        })
      );
    } catch (error) {
      console.error('Error loading users:', error);
      this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
    }
  }

  viewUserDetails(userId: string) {
    this.router.navigate(['/user-details', userId]);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
