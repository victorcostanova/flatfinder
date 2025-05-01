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
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {
    // Listen to authentication state changes
    onAuthStateChanged(this.auth, async (user) => {
      this.userSubject.next(user);
      if (!user) {
        this.router.navigate(['/login']);
      } else {
        // Check if user needs to complete profile
        const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
        if (!userDoc.exists() || !userDoc.data()['firstName']) {
          this.router.navigate(['/complete-profile']);
        }
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

  async register(
    email: string,
    password: string,
    userData: any
  ): Promise<UserCredential> {
    try {
      const result = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      // Save additional user data to Firestore
      await setDoc(doc(this.firestore, 'users', result.user.uid), {
        ...userData,
        email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAdmin: false,
      });

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
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      localStorage.setItem('user', JSON.stringify(result.user));

      // Check if user profile exists
      const userDoc = await getDoc(
        doc(this.firestore, 'users', result.user.uid)
      );

      if (!userDoc.exists() || !userDoc.data()['firstName']) {
        await this.router.navigate(['/complete-profile']);
      } else {
        await this.router.navigate(['/home']);
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  isLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }
}
