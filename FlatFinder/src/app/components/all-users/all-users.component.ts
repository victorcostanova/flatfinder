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

interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  flatsCount?: number;
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
    // Check if user is admin
    const user = this.auth.currentUser;
    if (!user) {
      this.router.navigate(['/home']);
      return;
    }

    const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
    if (!userDoc.exists() || !userDoc.data()['isAdmin']) {
      this.snackBar.open('Access denied: Admin only area', 'Close', {
        duration: 3000,
      });
      this.router.navigate(['/home']);
      return;
    }

    this.isAdmin = true;
    await this.loadUsers();
  }

  async loadUsers() {
    try {
      const usersRef = collection(this.firestore, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const usersPromises = usersSnapshot.docs.map(async (doc) => {
        const userData = doc.data() as User;
        userData.userId = doc.id;

        // Get flats count for each user
        const flatsRef = collection(this.firestore, 'flats');
        const flatsQuery = query(flatsRef, where('userId', '==', doc.id));
        const flatsSnapshot = await getDocs(flatsQuery);
        userData.flatsCount = flatsSnapshot.size;

        return userData;
      });

      this.users = await Promise.all(usersPromises);
    } catch (error) {
      console.error('Error loading users:', error);
      this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  viewUserDetails(userId: string) {
    this.router.navigate(['/user-details', userId]);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
