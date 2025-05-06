import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { HomeComponent } from './components/home/home.component';
import { MyflatsComponent } from './components/myflats/myflats.component';
import { FavflatsComponent } from './components/favflats/favflats.component';
import { ProfileComponent } from './components/profile/profile.component';
import { NewFlatComponent } from './components/new-flat/new-flat.component';
import { EditFlatComponent } from './components/edit-flat/edit-flat.component';
import { FlatPreviewComponent } from './components/flat-preview/flat-preview.component';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';
import { AllUsersComponent } from './components/all-users/all-users.component';
import { CompleteProfileComponent } from './components/complete-profile/complete-profile.component';
import { UserDetailsComponent } from './components/user-details/user-details.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [LoginGuard],
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [LoginGuard],
  },
  {
    path: 'complete-profile',
    component: CompleteProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'myflats',
    component: MyflatsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'favourites',
    component: FavflatsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'new-flat',
    component: NewFlatComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'edit-flat/:id',
    component: EditFlatComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'flat/:id',
    component: FlatPreviewComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'all-users',
    component: AllUsersComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'user-details/:id',
    component: UserDetailsComponent,
    canActivate: [AuthGuard],
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];
