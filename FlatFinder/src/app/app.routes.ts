import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { HomeComponent } from './components/home/home.component';
import { MyflatsComponent } from './components/myflats/myflats.component';
import { FavflatsComponent } from './components/favflats/favflats.component';
import { ProfileComponent } from './components/profile/profile.component';
import { NewFlatComponent } from './components/new-flat/new-flat.component';
import { EditFlatComponent } from './components/edit-flat/edit-flat.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent },
  { path: 'myflats', component: MyflatsComponent },
  { path: 'favourites', component: FavflatsComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'new-flat', component: NewFlatComponent },
  { path: 'edit-flat/:id', component: EditFlatComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];
