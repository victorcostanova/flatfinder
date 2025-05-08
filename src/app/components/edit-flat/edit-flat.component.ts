import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { RouterModule, ActivatedRoute, Router } from "@angular/router";
import { HeaderComponent } from "../header/header.component";
import {
  Firestore,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from "@angular/fire/firestore";
import { Auth } from "@angular/fire/auth";
import { UploadService } from "../../services/upload.service";

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
  images?: string[];
}

@Component({
  selector: "app-edit-flat",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    HeaderComponent,
  ],
  templateUrl: "./edit-flat.component.html",
  styleUrls: ["./edit-flat.component.css"],
})
export class EditFlatComponent implements OnInit {
  flatForm: FormGroup;
  flatId: string = "";
  error = "";
  selectedFiles: File[] = [];
  isUploading = false;
  previewUrls: string[] = [];
  existingImages: string[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore,
    private auth: Auth,
    private uploadService: UploadService
  ) {
    this.flatForm = this.fb.group({
      city: ["", [Validators.required, Validators.minLength(2)]],
      streetName: ["", [Validators.required, Validators.minLength(2)]],
      streetNumber: ["", [Validators.required, Validators.min(1)]],
      areaSize: ["", [Validators.required, Validators.min(1)]],
      hasAC: [false],
      yearBuilt: [
        "",
        [
          Validators.required,
          Validators.min(1800),
          Validators.max(new Date().getFullYear()),
        ],
      ],
      rentPrice: ["", [Validators.required, Validators.min(1)]],
      dateAvailable: ["", Validators.required],
    });
  }

  async ngOnInit() {
    this.flatId = this.route.snapshot.paramMap.get("id") || "";
    if (!this.flatId) {
      this.error = "No flat ID provided";
      return;
    }

    try {
      const flatDoc = doc(this.firestore, "flats", this.flatId);
      const flatSnap = await getDoc(flatDoc);

      if (!flatSnap.exists()) {
        this.error = "Flat not found";
        return;
      }

      const flatData = flatSnap.data() as Flat;
      const dateAvailable =
        flatData.dateAvailable instanceof Timestamp
          ? flatData.dateAvailable.toDate()
          : new Date(flatData.dateAvailable);

      // Store existing images
      if (flatData.images) {
        this.existingImages = flatData.images;
        this.previewUrls = [...flatData.images];
      }

      this.flatForm.patchValue({
        city: flatData.city,
        streetName: flatData.streetName,
        streetNumber: flatData.streetNumber,
        areaSize: flatData.areaSize,
        hasAC: flatData.hasAC,
        yearBuilt: flatData.yearBuilt,
        rentPrice: flatData.rentPrice,
        dateAvailable: dateAvailable.toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error loading flat:", error);
      this.error = "Failed to load flat details";
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);

      // Generate preview URLs for new files
      this.selectedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number) {
    if (index < this.existingImages.length) {
      // Remove from existing images
      this.existingImages.splice(index, 1);
    } else {
      // Remove from newly selected files
      const newFileIndex = index - this.existingImages.length;
      this.selectedFiles.splice(newFileIndex, 1);
    }
    this.previewUrls.splice(index, 1);
  }

  async onSubmit() {
    if (this.flatForm.invalid) {
      return;
    }

    try {
      this.isUploading = true;
      const flatDoc = doc(this.firestore, "flats", this.flatId);
      const formData = this.flatForm.value;

      // Upload new images if any
      let newImageUrls: string[] = [];
      if (this.selectedFiles.length > 0) {
        newImageUrls = await this.uploadService.uploadMultipleImages(
          this.selectedFiles
        );
      }

      // Combine existing and new images
      const allImages = [...this.existingImages, ...newImageUrls];

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
        images: allImages,
      });

      this.isUploading = false;
      this.router.navigate(["/myflats"]);
    } catch (error) {
      this.isUploading = false;
      console.error("Error updating flat:", error);
      this.error = "Failed to update flat";
    }
  }
}
