import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
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
  selector: 'app-user-details',
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
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.css'],
})
export class UserDetailsComponent implements OnInit {
  user: User | null = null;
  flats: Flat[] = [];
  loading = true;
  isAdmin = false;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    await this.checkAdminStatus();
    if (this.isAdmin) {
      const userId = this.route.snapshot.paramMap.get('id');
      if (userId) {
        await this.loadUserDetails(userId);
        await this.loadUserFlats(userId);
      }
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

  private async loadUserDetails(userId: string) {
    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', userId));
      if (userDoc.exists()) {
        this.user = {
          ...userDoc.data(),
          userId: userDoc.id,
        } as User;
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      this.snackBar.open('Error loading user details', 'Close', {
        duration: 3000,
      });
    }
  }

  private async loadUserFlats(userId: string) {
    try {
      const flatsQuery = query(
        collection(this.firestore, 'flats'),
        where('userId', '==', userId)
      );
      const flatsSnapshot = await getDocs(flatsQuery);

      this.flats = flatsSnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log('Flat data from Firebase:', data); // Debug log

        return {
          id: doc.id,
          title: data['title'],
          description: data['description'],
          price: data['rentPrice'],
          city: data['city'],
          streetName: data['streetName'],
          streetNumber: data['streetNumber'],
          area: data['areaSize'],
          createdAt: data['createdAt'],
          updatedAt: data['updatedAt'],
        } as Flat;
      });

      console.log('Processed flats:', this.flats); // Debug log
    } catch (error) {
      console.error('Error loading user flats:', error);
      this.snackBar.open('Error loading user flats', 'Close', {
        duration: 3000,
      });
    }
  }

  viewFlatDetails(flatId: string) {
    this.router.navigate(['/flat', flatId]);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  goBack() {
    this.router.navigate(['/all-users']);
  }
}
