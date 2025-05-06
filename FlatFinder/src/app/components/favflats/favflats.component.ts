import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
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
  selector: 'app-favflats',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './favflats.component.html',
  styleUrls: ['./favflats.component.css'],
})
export class FavflatsComponent implements OnInit {
  flats: Flat[] = [];
  isProcessing: { [key: string]: boolean } = {};
  error = '';

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit(): void {
    this.loadFavoriteFlats(); // não bloqueia a renderização
  }

  loadFavoriteFlats(): void {
    this.favoritesService
      .getFavoriteFlats()
      .then((flats) => {
        this.flats = flats;
      })
      .catch((error) => {
        console.error('Error loading favorite flats:', error);
        this.error = 'Erro ao carregar flats favoritos.';
      });
  }

  toggleFavorite(flat: Flat): void {
    if (this.isProcessing[flat.id]) return;

    this.isProcessing[flat.id] = true;
    this.favoritesService
      .removeFromFavorites(flat.id)
      .then(() => {
        this.flats = this.flats.filter((f) => f.id !== flat.id);
      })
      .catch((error) => {
        console.error('Erro ao remover dos favoritos:', error);
      })
      .finally(() => {
        this.isProcessing[flat.id] = false;
      });
  }

  formatDate(date: any): string {
    if (date?.toDate) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  }
}
