import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import {
  Firestore,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable } from 'rxjs';

interface Flat {
  id: string;
  city: string;
  streetName: string;
  streetNumber: number;
  areaSize: number;
  hasAC: boolean;
  yearBuilt: number;
  rentPrice: number;
  dateAvailable: Date | Timestamp;
  userId: string;
  createdAt: Date;
}

@Component({
  selector: 'app-edit-flat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    HeaderComponent,
  ],
  templateUrl: './edit-flat.component.html',
  styleUrls: ['./edit-flat.component.css'],
})
export class EditFlatComponent implements OnInit {
  flatForm: FormGroup;
  flatId: string = '';
  error = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore,
    private auth: Auth
  ) {
    this.flatForm = this.fb.group({
      city: ['', [Validators.required, Validators.minLength(2)]],
      streetName: ['', [Validators.required, Validators.minLength(2)]],
      streetNumber: ['', [Validators.required, Validators.min(1)]],
      areaSize: ['', [Validators.required, Validators.min(1)]],
      hasAC: [false],
      yearBuilt: [
        '',
        [
          Validators.required,
          Validators.min(1800),
          Validators.max(new Date().getFullYear()),
        ],
      ],
      rentPrice: ['', [Validators.required, Validators.min(1)]],
      dateAvailable: ['', Validators.required],
    });
  }

  async ngOnInit() {
    this.flatId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.flatId) {
      this.error = 'No flat ID provided';
      return;
    }

    try {
      const flatDoc = doc(this.firestore, 'flats', this.flatId);
      const flatSnap = await getDoc(flatDoc);

      if (!flatSnap.exists()) {
        this.error = 'Flat not found';
        return;
      }

      const flatData = flatSnap.data() as Flat;
      const dateAvailable =
        flatData.dateAvailable instanceof Timestamp
          ? flatData.dateAvailable.toDate()
          : new Date(flatData.dateAvailable);

      this.flatForm.patchValue({
        city: flatData.city,
        streetName: flatData.streetName,
        streetNumber: flatData.streetNumber,
        areaSize: flatData.areaSize,
        hasAC: flatData.hasAC,
        yearBuilt: flatData.yearBuilt,
        rentPrice: flatData.rentPrice,
        dateAvailable: dateAvailable.toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Error loading flat:', error);
      this.error = 'Failed to load flat details';
    }
  }

  async onSubmit() {
    if (this.flatForm.invalid) {
      return;
    }

    try {
      const flatDoc = doc(this.firestore, 'flats', this.flatId);
      const formData = this.flatForm.value;

      await updateDoc(flatDoc, {
        city: formData.city,
        streetName: formData.streetName,
        streetNumber: formData.streetNumber,
        areaSize: formData.areaSize,
        hasAC: formData.hasAC,
        yearBuilt: formData.yearBuilt,
        rentPrice: formData.rentPrice,
        dateAvailable: new Date(formData.dateAvailable),
        updatedAt: new Date(),
      });

      this.router.navigate(['/myflats']);
    } catch (error) {
      console.error('Error updating flat:', error);
      this.error = 'Failed to update flat';
    }
  }
}
