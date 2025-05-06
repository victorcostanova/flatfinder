import { Component, OnInit, Inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, ActivatedRoute, Router } from "@angular/router";
import { HeaderComponent } from "../header/header.component";
import {
  Firestore,
  Timestamp,
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
} from "@angular/fire/firestore";
import { FavoritesService } from "../../services/favorites.service";
import { Auth } from "@angular/fire/auth";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSnackBar } from "@angular/material/snack-bar";
import {
  MatDialog,
  MatDialogModule,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";

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
}

interface Message {
  id: string;
  flatId: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: Date;
  read: boolean;
}

@Component({
  selector: "app-flat-preview",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
  ],
  templateUrl: "./flat-preview.component.html",
  styleUrls: ["./flat-preview.component.css"],
})
export class FlatPreviewComponent implements OnInit {
  flat: Flat | null = null;
  isFavorite = false;
  isProcessing = false;
  message = "";
  isOwner = false;
  currentUserId: string | null = null;
  messages: Message[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore,
    private favoritesService: FavoritesService,
    private auth: Auth,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  async ngOnInit() {
    const flatId = this.route.snapshot.paramMap.get("id");
    if (!flatId) {
      this.router.navigate(["/home"]);
      return;
    }

    const currentUser = this.auth.currentUser;
    this.currentUserId = currentUser?.uid || null;

    try {
      const flatDocRef = doc(this.firestore, "flats", flatId);
      const flatSnapPromise = getDoc(flatDocRef);
      const isFavPromise = this.favoritesService.isFavorite(flatId);

      const [flatSnap, isFavorite] = await Promise.all([
        flatSnapPromise,
        isFavPromise,
      ]);

      if (!flatSnap.exists()) {
        this.router.navigate(["/home"]);
        return;
      }

      const data = flatSnap.data() as Omit<Flat, "id">;
      this.flat = {
        id: flatSnap.id,
        city: data["city"],
        streetName: data["streetName"],
        streetNumber: data["streetNumber"],
        areaSize: data["areaSize"],
        hasAC: data["hasAC"],
        yearBuilt: data["yearBuilt"],
        rentPrice: data["rentPrice"],
        dateAvailable: data["dateAvailable"],
        userId: data["userId"],
        createdAt: data["createdAt"],
      };

      this.isFavorite = isFavorite;
      this.isOwner = this.currentUserId === this.flat.userId;
    } catch (error) {
      console.error("Error loading flat:", error);
      this.router.navigate(["/home"]);
    }
  }

  async sendMessage() {
    if (!this.flat || !this.currentUserId || !this.message.trim()) return;

    try {
      const messageData = {
        flatId: this.flat.id,
        senderId: this.currentUserId,
        receiverId: this.flat.userId,
        message: this.message.trim(),
        createdAt: Timestamp.now(),
        read: false,
      };

      await addDoc(collection(this.firestore, "messages"), messageData);

      this.message = "";
      this.snackBar.open("Message sent successfully!", "Close", {
        duration: 3000,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      this.snackBar.open("Error sending message", "Close", {
        duration: 3000,
      });
    }
  }

  async showMessageHistory() {
    if (!this.flat || !this.currentUserId) {
      console.error("Flat or currentUserId is missing");
      return;
    }

    try {
      const messagesQuery = query(
        collection(this.firestore, "messages"),
        where("flatId", "==", this.flat.id),
        orderBy("createdAt", "desc")
      );

      const messagesSnapshot = await getDocs(messagesQuery);

      this.messages = messagesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          flatId: data["flatId"],
          senderId: data["senderId"],
          receiverId: data["receiverId"],
          message: data["message"],
          createdAt: data["createdAt"]?.toDate() || new Date(),
          read: data["read"],
        } as Message;
      });

      const dialogData = {
        flatAddress: `${this.flat.streetName}, ${this.flat.streetNumber}, ${this.flat.city}`,
        messages: this.messages,
      };

      if (this.messages.length === 0) {
        this.dialog.open(NoMessagesDialog, {
          width: "400px",
          data: { flatAddress: dialogData.flatAddress },
        });
      } else {
        this.dialog.open(MessageHistoryDialog, {
          width: "500px",
          data: dialogData,
        });
      }
    } catch (error) {
      console.error("Error loading message history:", error);
      this.snackBar.open("Error loading message history", "Close", {
        duration: 3000,
      });
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
      await this.router.navigate(["/favourites"]);
    } catch (error) {
      console.error("Error toggling favorite:", error);
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

@Component({
  selector: "message-history-dialog",
  template: `
    <h2 mat-dialog-title>Message History</h2>
    <mat-dialog-content>
      <p class="flat-address">{{ data.flatAddress }}</p>
      <div class="messages-container">
        <div *ngFor="let message of data.messages" class="message-item">
          <div class="message-content">{{ message.message }}</div>
          <div class="message-date">
            {{ message.createdAt | date : "medium" }}
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .flat-address {
        color: #666;
        margin-bottom: 1rem;
      }
      .messages-container {
        max-height: 400px;
        overflow-y: auto;
      }
      .message-item {
        padding: 1rem;
        border-bottom: 1px solid #eee;
      }
      .message-content {
        margin-bottom: 0.5rem;
      }
      .message-date {
        font-size: 0.8rem;
        color: #666;
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
})
export class MessageHistoryDialog {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      messages: Message[];
      flatAddress: string;
    }
  ) {}
}

@Component({
  selector: "no-messages-dialog",
  template: `
    <h2 mat-dialog-title>No Messages Yet</h2>
    <mat-dialog-content>
      <p>You haven't sent any messages for this flat yet.</p>
      <p class="flat-address">{{ data.flatAddress }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .flat-address {
        color: #666;
        margin-top: 1rem;
        font-style: italic;
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
})
export class NoMessagesDialog {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      flatAddress: string;
    }
  ) {}
}
