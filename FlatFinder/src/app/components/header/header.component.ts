import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;

  constructor(
    private authService: AuthService,
    private auth: Auth,
    private firestore: Firestore
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(async (user) => {
      this.isLoggedIn = !!user;

      if (user) {
        const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
        this.isAdmin = userDoc.exists() && userDoc.data()['isAdmin'] === true;
      } else {
        this.isAdmin = false;
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
