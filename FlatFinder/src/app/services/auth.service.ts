import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
} from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private auth: Auth, private router: Router) {
    // Listen to authentication state changes
    onAuthStateChanged(this.auth, (user) => {
      this.userSubject.next(user);
      if (!user) {
        this.router.navigate(['/login']);
      }
    });

    // Check if user was previously logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.userSubject.next(JSON.parse(savedUser));
    }
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const result = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      localStorage.setItem('user', JSON.stringify(result.user));
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(email: string, password: string): Promise<UserCredential> {
    try {
      const result = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      localStorage.setItem('user', JSON.stringify(result.user));
      this.router.navigate(['/home']);
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      localStorage.removeItem('user');
      this.userSubject.next(null);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    localStorage.setItem('user', JSON.stringify(result.user));
    this.router.navigate(['/home']);
  }

  isLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }
}
