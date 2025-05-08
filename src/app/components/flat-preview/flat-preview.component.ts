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
  images?: string[];
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
  loading = true;
  error: string | null = null;
  isFavorite = false;
  isProcessing = false;
  message = "";
  isOwner = false;
  currentUserId: string | null = null;
  messages: Message[] = [];
  currentImage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore,
    private favoritesService: FavoritesService,
    private auth: Auth,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const flatId = this.route.snapshot.paramMap.get("id");
    if (!flatId) {
      this.router.navigate(["/home"]);
      return;
    }

    const currentUser = this.auth.currentUser;
    this.currentUserId = currentUser?.uid || null;

    this.route.paramMap.subscribe((params) => {
      this.getFlatDetails();
    });
  }

  async getFlatDetails() {
    try {
      const flatDocRef = doc(this.firestore, "flats", this.route.snapshot.paramMap.get("id") || "");
      const flatSnapPromise = getDoc(flatDocRef);
      const isFavPromise = this.favoritesService.isFavorite(this.route.snapshot.paramMap.get("id") || "");

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
        images: data["images"],
      };

      this.isFavorite = isFavorite;
      this.isOwner = this.currentUserId === this.flat.userId;

      // Set first image as current image if available
      if (this.flat.images && this.flat.images.length > 0) {
        this.currentImage = this.flat.images[0];
      }
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
      let messagesQuery;
      
      // Owner sees all messages for this flat
      if (this.isOwner) {
        messagesQuery = query(
          collection(this.firestore, "messages"),
          where("flatId", "==", this.flat.id),
          orderBy("createdAt", "desc")
        );
      } 
      // Non-owner only sees their own conversation with the owner
      else {
        messagesQuery = query(
          collection(this.firestore, "messages"),
          where("flatId", "==", this.flat.id),
          where("senderId", "in", [this.currentUserId, this.flat.userId]),
          where("receiverId", "in", [this.currentUserId, this.flat.userId]),
          orderBy("createdAt", "desc")
        );
      }

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

      // If not owner, filter to only show conversation between current user and owner
      if (!this.isOwner) {
        this.messages = this.messages.filter(msg => 
          (msg.senderId === this.currentUserId && msg.receiverId === this.flat?.userId) || 
          (msg.senderId === this.flat?.userId && msg.receiverId === this.currentUserId)
        );
      }

      const dialogData = {
        flatAddress: `${this.flat.streetName}, ${this.flat.streetNumber}, ${this.flat.city}`,
        messages: this.messages,
        currentUserId: this.currentUserId,
        isOwnerView: this.isOwner,
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

  setCurrentImage(imageUrl: string) {
    this.currentImage = imageUrl;
  }
}

@Component({
  selector: "message-history-dialog",
  template: `
    <h2 mat-dialog-title>Message History</h2>
    <mat-dialog-content>
      <p class="flat-address">{{ data.flatAddress }}</p>
      
      <!-- Owner view with grouped messages by user -->
      <div *ngIf="isOwnerView()" class="messages-container owner-view">
        <div *ngFor="let message of data.messages" 
             class="message-item"
             [ngClass]="{'sent': message.senderId === data.currentUserId, 'received': message.senderId !== data.currentUserId}">
          <div class="message-header">
            <span class="sender-label" *ngIf="message.senderId !== data.currentUserId">
              Inquirer (User ID: {{getShortenedId(message.senderId)}})
            </span>
            <span class="sender-label" *ngIf="message.senderId === data.currentUserId">You</span>
          </div>
          <div class="message-content">{{ message.message }}</div>
          <div class="message-date">
            {{ message.createdAt | date : "medium" }}
          </div>
        </div>
      </div>
      
      <!-- Regular user view -->
      <div *ngIf="!isOwnerView()" class="messages-container">
        <div *ngFor="let message of data.messages" 
             class="message-item"
             [ngClass]="{'sent': message.senderId === data.currentUserId, 'received': message.senderId !== data.currentUserId}">
          <div class="message-header">
            <span class="sender-label">{{ message.senderId === data.currentUserId ? 'You' : 'Owner' }}</span>
          </div>
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
        margin-bottom: 0.5rem;
        border-radius: 8px;
      }
      .sent {
        background-color: #e3f2fd;
        margin-left: 20px;
      }
      .received {
        background-color: #f5f5f5;
        margin-right: 20px;
      }
      .message-header {
        margin-bottom: 0.5rem;
      }
      .sender-label {
        font-weight: bold;
        font-size: 0.9rem;
      }
      .message-content {
        margin-bottom: 0.5rem;
      }
      .message-date {
        font-size: 0.8rem;
        color: #666;
      }
      .owner-view .received {
        background-color: #f8f1ff; 
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
      currentUserId: string;
      isOwnerView?: boolean;
    }
  ) {}
  
  isOwnerView(): boolean {
    return this.data.isOwnerView === true;
  }
  
  getShortenedId(id: string): string {
    if (!id) return '';
    return id.substring(0, 6) + '...';
  }
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
