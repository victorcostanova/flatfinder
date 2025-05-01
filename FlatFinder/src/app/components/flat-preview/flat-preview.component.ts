import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
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
  selector: 'app-flat-preview',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './flat-preview.component.html',
  styleUrls: ['./flat-preview.component.css'],
})
export class FlatPreviewComponent implements OnInit {
  flat: Flat | null = null;
  isFavorite = false;
  isProcessing = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore,
    private favoritesService: FavoritesService
  ) {}

  async ngOnInit() {
    const flatId = this.route.snapshot.paramMap.get('id');
    if (!flatId) {
      this.router.navigate(['/home']);
      return;
    }

    try {
      const flatDoc = doc(this.firestore, 'flats', flatId);
      const flatSnap = await getDoc(flatDoc);

      if (!flatSnap.exists()) {
        this.router.navigate(['/home']);
        return;
      }

      const data = flatSnap.data();
      this.flat = {
        id: flatSnap.id,
        city: data['city'],
        streetName: data['streetName'],
        streetNumber: data['streetNumber'],
        areaSize: data['areaSize'],
        hasAC: data['hasAC'],
        yearBuilt: data['yearBuilt'],
        rentPrice: data['rentPrice'],
        dateAvailable: data['dateAvailable'],
        userId: data['userId'],
        createdAt: data['createdAt'],
      };

      this.isFavorite = await this.favoritesService.isFavorite(flatId);
    } catch (error) {
      console.error('Error loading flat:', error);
      this.router.navigate(['/home']);
    }
  }

  async toggleFavoriteAndNavigate() {
    if (!this.flat || this.isProcessing) return;

    this.isProcessing = true;
    try {
      if (this.isFavorite) {
        await this.favoritesService.removeFromFavorites(this.flat.id);
        this.isFavorite = false;
      } else {
        await this.favoritesService.addToFavorites(this.flat);
        this.isFavorite = true;
      }
      await this.router.navigate(['/favourites']);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // You might want to show an error message to the user here
    } finally {
      this.isProcessing = false;
    }
  }

  formatDate(date: any): string {
    if (date?.toDate) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  }
}
