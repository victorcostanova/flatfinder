import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { FavoritesService } from '../../services/favorites.service';

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
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  flats: Flat[] = [];
  favoriteStatus: { [key: string]: boolean } = {};
  isProcessing: { [key: string]: boolean } = {};
  error = '';

  constructor(
    private firestore: Firestore,
    private favoritesService: FavoritesService
  ) {}

  async ngOnInit() {
    await this.loadFlats();
  }

  async loadFlats() {
    try {
      const flatsRef = collection(this.firestore, 'flats');
      const querySnapshot = await getDocs(flatsRef);
      this.flats = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Flat[];

      // Check favorite status for each flat
      for (const flat of this.flats) {
        this.favoriteStatus[flat.id] = await this.favoritesService.isFavorite(
          flat.id
        );
      }
    } catch (error) {
      console.error('Error loading flats:', error);
    }
  }

  async toggleFavorite(flat: Flat) {
    if (this.isProcessing[flat.id]) return;

    this.isProcessing[flat.id] = true;
    try {
      if (this.favoriteStatus[flat.id]) {
        await this.favoritesService.removeFromFavorites(flat.id);
        this.favoriteStatus[flat.id] = false;
      } else {
        await this.favoritesService.addToFavorites(flat);
        this.favoriteStatus[flat.id] = true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      this.isProcessing[flat.id] = false;
    }
  }

  formatDate(date: any): string {
    if (date?.toDate) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  }
}
