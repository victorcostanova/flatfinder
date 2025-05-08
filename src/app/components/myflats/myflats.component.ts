import { Component, OnInit, Inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { HeaderComponent } from "../header/header.component";
import {
  Firestore,
  Timestamp,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  orderBy,
} from "@angular/fire/firestore";
import { Auth, user } from "@angular/fire/auth";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";

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
  selector: "app-myflats",
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, MatDialogModule, MatButtonModule],
  templateUrl: "./myflats.component.html",
  styleUrls: ["./myflats.component.css"],
})
export class MyflatsComponent implements OnInit {
  flats: Flat[] = [];
  loading = true;
  error = "";
  user$: Observable<any>;
  currentUserId: string | null = null;

  constructor(
    private firestore: Firestore, 
    private auth: Auth,
    private dialog: MatDialog
  ) {
    this.user$ = user(this.auth);
  }

  async ngOnInit() {
    this.user$.subscribe(async (user) => {
      if (user) {
        this.currentUserId = user.uid;
        try {
          const flatsRef = collection(this.firestore, "flats");
          const q = query(flatsRef, where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          this.flats = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Flat[];
        } catch (error) {
          console.error("Error fetching flats:", error);
          this.error = "Failed to load your flats";
        } finally {
          this.loading = false;
        }
      }
    });
  }

  async deleteFlat(flatId: string) {
    if (confirm("Are you sure you want to delete this flat?")) {
      try {
        const flatDoc = doc(this.firestore, "flats", flatId);
        await deleteDoc(flatDoc);
        this.flats = this.flats.filter((flat) => flat.id !== flatId);
      } catch (error) {
        console.error("Error deleting flat:", error);
        this.error = "Failed to delete flat";
      }
    }
  }

  async showMessageHistory(flatId: string) {
    if (!this.currentUserId) return;

    try {
      // Find the flat details
      const flat = this.flats.find(f => f.id === flatId);
      if (!flat) {
        console.error("Flat not found");
        return;
      }

      // Query messages for this flat (owner sees all messages)
      const messagesQuery = query(
        collection(this.firestore, "messages"),
        where("flatId", "==", flatId),
        orderBy("createdAt", "desc")
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      const messages = messagesSnapshot.docs.map((doc) => {
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

      // Group messages by sender for better organization when viewing as owner
      const messagesByUser = new Map<string, {
        userId: string,
        userName: string,
        messages: Message[]
      }>();

      // First, collect all unique users
      const uniqueUserIds = new Set<string>();
      messages.forEach(msg => {
        if (msg.senderId !== this.currentUserId) {
          uniqueUserIds.add(msg.senderId);
        }
      });

      // Prepare dialog data
      const dialogData = {
        flatAddress: `${flat.streetName}, ${flat.streetNumber}, ${flat.city}`,
        messages: messages,
        currentUserId: this.currentUserId,
        isOwnerView: true
      };

      // Open appropriate dialog
      if (messages.length === 0) {
        this.dialog.open(NoMessagesDialog, {
          width: "400px",
          data: { flatAddress: dialogData.flatAddress },
        });
      } else {
        this.dialog.open(MessageHistoryDialog, {
          width: "600px", // Slightly wider for owner view
          data: dialogData,
        });
      }
    } catch (error) {
      console.error("Error loading message history:", error);
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
      
      <!-- Owner view with grouped messages by user -->
      <div *ngIf="data.isOwnerView" class="messages-container owner-view">
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
      <div *ngIf="!data.isOwnerView" class="messages-container">
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
      isOwnerView: boolean;
    }
  ) {}
  
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
      <p>There are no messages for this flat yet.</p>
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
