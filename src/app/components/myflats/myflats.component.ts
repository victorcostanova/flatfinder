import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Flat {
  id: string;
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
  images?: string[];
}

@Component({
  selector: 'app-myflats',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './myflats.component.html',
  styleUrls: ['./myflats.component.css'],
})
export class MyflatsComponent implements OnInit {
  flats: Flat[] = [];
  loading = true;
  error = '';
  user$: Observable<any>;

  constructor(private firestore: Firestore, private auth: Auth) {
    this.user$ = user(this.auth);
  }

  async ngOnInit() {
    this.user$.subscribe(async (user) => {
      if (user) {
        try {
          const flatsRef = collection(this.firestore, 'flats');
          const q = query(flatsRef, where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          this.flats = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Flat[];
        } catch (error) {
          console.error('Error fetching flats:', error);
          this.error = 'Failed to load your flats';
        } finally {
          this.loading = false;
        }
      }
    });
  }

  async deleteFlat(flatId: string) {
    if (confirm('Are you sure you want to delete this flat?')) {
      try {
        const flatDoc = doc(this.firestore, 'flats', flatId);
        await deleteDoc(flatDoc);
        this.flats = this.flats.filter((flat) => flat.id !== flatId);
      } catch (error) {
        console.error('Error deleting flat:', error);
        this.error = 'Failed to delete flat';
      }
    }
  }

  formatDate(date: any): string {
    if (date?.toDate) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  }
}
