import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { AuthService } from "../../services/auth.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { Firestore, doc, setDoc } from "@angular/fire/firestore";
import { MatSnackBar } from "@angular/material/snack-bar";
import { minimumAgeValidator } from "../../validators/age.validator";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.css"],
})
export class RegisterComponent {
  registerForm: FormGroup;
  error: string = "";

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private firestore: Firestore,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group(
      {
        email: ["", [Validators.required, Validators.email]],
        password: ["", [Validators.required, Validators.minLength(6)]],
        confirmPassword: ["", Validators.required],
        firstName: ["", Validators.required],
        lastName: ["", Validators.required],
        birthDate: ["", [Validators.required, minimumAgeValidator(18)]],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get("password")?.value === g.get("confirmPassword")?.value
      ? null
      : { mismatch: true };
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      try {
        const { email, password, firstName, lastName, birthDate } =
          this.registerForm.value;

        const userData = {
          firstName,
          lastName,
          birthDate: birthDate.toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const userCredential = await this.authService.register(
          email,
          password,
          userData
        );

        this.snackBar.open("Registration successful!", "Close", {
          duration: 3000,
        });
      } catch (error: any) {
        console.error("Registration error:", error);
        this.snackBar.open(
          error.message || "Registration failed. Please try again.",
          "Close",
          { duration: 3000 }
        );
      }
    } else {
      if (this.registerForm.errors?.["mismatch"]) {
        this.error = "Passwords do not match";
      } else {
        this.error = "Please fill in all fields correctly";
      }
    }
  }
}
