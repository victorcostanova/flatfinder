import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { HeaderComponent } from "../header/header.component";
import { Firestore, collection, getDocs } from "@angular/fire/firestore";
import { FavoritesService } from "../../services/favorites.service";
import { MatTableModule } from "@angular/material/table";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatSortModule, MatSort, Sort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { BehaviorSubject, Subject, takeUntil } from "rxjs";

interface Flat {
  id: string;
  city: string;
  streetName: string;
  streetNumber: number;
  areaSize: number;
  hasAC: boolean;
  yearBuilt: number;
  rentPrice: number;
  dateAvailable: any;
  userId: string;
  createdAt: any;
  images?: string[];
}

@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatSortModule,
  ],
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private flatsSubject = new BehaviorSubject<Flat[]>([]);
  flats$ = this.flatsSubject.asObservable();
  
  flats: Flat[] = [];
  dataSource: MatTableDataSource<Flat>;
  favoriteStatus: { [key: string]: boolean } = {};
  isProcessing: { [key: string]: boolean } = {};
  error = "";
  displayedColumns: string[] = [
    "city",
    "address",
    "areaSize",
    "price",
    "actions",
  ];

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private firestore: Firestore,
    private favoritesService: FavoritesService
  ) {
    this.dataSource = new MatTableDataSource<Flat>([]);
  }

  async ngOnInit() {
    this.loadFlats();
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    this.flats$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(flats => {
      this.flats = flats;
      this.dataSource.data = flats;
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadFlats() {
    try {
      const flatsRef = collection(this.firestore, "flats");
      const querySnapshot = await getDocs(flatsRef);
      const loadedFlats = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Flat[];

      this.flatsSubject.next(loadedFlats);

      // Check favorite status for each flat
      const statusList = await Promise.all(
        loadedFlats.map((flat) => this.favoritesService.isFavorite(flat.id))
      );

      loadedFlats.forEach((flat, index) => {
        this.favoriteStatus[flat.id] = statusList[index];
      });
    } catch (error) {
      console.error("Error loading flats:", error);
      this.error = "Failed to load flats. Please try again later.";
    }
  }

  private memoizedCompare = new Map<string, (a: any, b: any) => number>();

  sortData(sort: Sort) {
    if (!sort.active || sort.direction === "") {
      this.dataSource.data = this.flats;
      return;
    }

    const sortKey = `${sort.active}-${sort.direction}`;
    if (!this.memoizedCompare.has(sortKey)) {
      this.memoizedCompare.set(sortKey, (a: Flat, b: Flat) => {
        const isAsc = sort.direction === "asc";
        switch (sort.active) {
          case "city":
            return this.compare(
              a.city.toLowerCase(),
              b.city.toLowerCase(),
              isAsc
            );
          case "areaSize":
            return this.compare(a.areaSize, b.areaSize, isAsc);
          case "price":
            return this.compare(a.rentPrice, b.rentPrice, isAsc);
          default:
            return 0;
        }
      });
    }

    this.dataSource.data = this.flats.slice().sort(this.memoizedCompare.get(sortKey)!);
  }

  private compare(a: number | string, b: number | string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  async toggleFavorite(flat: Flat) {
    if (this.isProcessing[flat.id]) return;

    this.isProcessing[flat.id] = true;
    try {
      const newStatus = !this.favoriteStatus[flat.id];
      if (newStatus) {
        await this.favoritesService.addToFavorites({
          ...flat,
          images: flat.images ?? [],
        });
      } else {
        await this.favoritesService.removeFromFavorites(flat.id);
      }
      this.favoriteStatus[flat.id] = newStatus;
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      this.isProcessing[flat.id] = false;
    }
  }

  formatDate(date: Date | { toDate(): Date }): string {
    if (date && typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date as Date).toLocaleDateString();
  }
}
