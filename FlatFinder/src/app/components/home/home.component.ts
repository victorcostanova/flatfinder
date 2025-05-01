import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { FavoritesService } from '../../services/favorites.service';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

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
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatSortModule, // Add MatSortModule to imports
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  flats: Flat[] = [];
  dataSource: MatTableDataSource<Flat>;
  favoriteStatus: { [key: string]: boolean } = {};
  isProcessing: { [key: string]: boolean } = {};
  error = '';
  displayedColumns: string[] = [
    'city',
    'address',
    'areaSize',
    'price',
    'actions',
  ];

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private firestore: Firestore,
    private favoritesService: FavoritesService
  ) {
    this.dataSource = new MatTableDataSource<Flat>([]);
  }

  async ngOnInit() {
    await this.loadFlats();
  }

  ngAfterViewInit() {
    // Connect the sort directive to the data source after view init
    this.dataSource.sort = this.sort;
  }

  async loadFlats() {
    try {
      const flatsRef = collection(this.firestore, 'flats');
      const querySnapshot = await getDocs(flatsRef);
      this.flats = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Flat[];

      // Update the data source with the loaded flats
      this.dataSource.data = this.flats;

      // Check favorite status for each flat
      for (const flat of this.flats) {
        this.favoriteStatus[flat.id] = await this.favoritesService.isFavorite(
          flat.id
        );
      }
    } catch (error) {
      console.error('Error loading flats:', error);
      this.error = 'Failed to load flats. Please try again later.';
    }
  }

  // Custom sort function to handle the sorting
  sortData(sort: Sort) {
    if (!sort.active || sort.direction === '') {
      // If no sorting or direction specified, revert to original data
      this.dataSource.data = this.flats;
      return;
    }

    // Create a new sorted array
    this.dataSource.data = this.flats.slice().sort((a, b) => {
      const isAsc = sort.direction === 'asc';

      switch (sort.active) {
        case 'city':
          return this.compare(
            a.city.toLowerCase(),
            b.city.toLowerCase(),
            isAsc
          );
        case 'areaSize':
          return this.compare(a.areaSize, b.areaSize, isAsc);
        case 'price':
          return this.compare(a.rentPrice, b.rentPrice, isAsc);
        default:
          return 0;
      }
    });
  }

  // Helper function for comparison
  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
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
