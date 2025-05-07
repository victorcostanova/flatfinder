import { Injectable } from "@angular/core";
import {
  Firestore,
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  DocumentData,
  collectionData,
  DocumentReference,
} from "@angular/fire/firestore";
import { AuthService } from "./auth.service";
import { Observable } from "rxjs";

export interface Flat {
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

export interface Favorite {
  id?: string;
  userId: string;
  flatId: string;
  createdAt: Date;
}

@Injectable({
  providedIn: "root",
})
export class FavoritesService {
  constructor(private firestore: Firestore, private authService: AuthService) {}

  async addToFavorites(flat: Flat): Promise<void> {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) throw new Error("No user logged in");

      const favoriteData: Favorite = {
        userId: user.uid,
        flatId: flat.id,
        createdAt: new Date(),
      };

      const favoritesRef = collection(this.firestore, "favorites");
      await addDoc(favoritesRef, favoriteData);
      console.log("Flat added to favorites successfully");
    } catch (error) {
      console.error("Error adding flat to favorites:", error);
      throw error;
    }
  }

  async removeFromFavorites(flatId: string): Promise<void> {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) throw new Error("No user logged in");

      const favoritesRef = collection(this.firestore, "favorites");
      const q = query(
        favoritesRef,
        where("userId", "==", user.uid),
        where("flatId", "==", flatId)
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);
      console.log("Flat removed from favorites successfully");
    } catch (error) {
      console.error("Error removing flat from favorites:", error);
      throw error;
    }
  }

  async isFavorite(flatId: string): Promise<boolean> {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) return false;

      const favoritesRef = collection(this.firestore, "favorites");
      const q = query(
        favoritesRef,
        where("userId", "==", user.uid),
        where("flatId", "==", flatId)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking favorite status:", error);
      return false;
    }
  }

  async getFavoriteFlats(): Promise<Flat[]> {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) return [];

      // Get all favorites for the current user
      const favoritesRef = collection(this.firestore, "favorites");
      const favoritesQuery = query(
        favoritesRef,
        where("userId", "==", user.uid)
      );
      const favoritesSnapshot = await getDocs(favoritesQuery);

      // Get the corresponding flats
      const flatsPromises = favoritesSnapshot.docs.map(async (favoriteDoc) => {
        const favoriteData = favoriteDoc.data() as Favorite;
        const flatRef = doc(this.firestore, "flats", favoriteData.flatId);
        const flatSnap = await getDoc(flatRef);

        if (flatSnap.exists()) {
          const flatData = flatSnap.data();
          return {
            id: flatSnap.id,
            city: flatData["city"],
            streetName: flatData["streetName"],
            streetNumber: flatData["streetNumber"],
            areaSize: flatData["areaSize"],
            hasAC: flatData["hasAC"],
            yearBuilt: flatData["yearBuilt"],
            rentPrice: flatData["rentPrice"],
            dateAvailable: flatData["dateAvailable"],
            userId: flatData["userId"],
            createdAt: flatData["createdAt"],
            images: flatData["images"],
          } as Flat;
        }
        return null;
      });

      const flats = await Promise.all(flatsPromises);
      return flats.filter((flat): flat is Flat => flat !== null);
    } catch (error) {
      console.error("Error getting favorite flats:", error);
      return [];
    }
  }
}
