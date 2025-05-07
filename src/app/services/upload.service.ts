import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class UploadService {
  constructor() {}

  uploadImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/upload`;

      formData.append("file", file);
      formData.append("upload_preset", environment.cloudinary.uploadPreset);
      formData.append("folder", environment.cloudinary.folder);

      fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Cloudinary error response:", errorText);
            throw new Error(
              `Network response was not ok: ${response.status} ${response.statusText}`
            );
          }
          return response.json();
        })
        .then((data) => {
          console.log("Upload successful:", data.secure_url);
          resolve(data.secure_url);
        })
        .catch((error) => {
          console.error("Error uploading to Cloudinary:", error);
          reject(error);
        });
    });
  }

  async uploadMultipleImages(files: File[]): Promise<string[]> {
    try {
      console.log(`Attempting to upload ${files.length} images`);
      const uploadPromises = Array.from(files).map((file) => {
        console.log(
          `Uploading file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`
        );
        return this.uploadImage(file);
      });
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error("Error uploading multiple images:", error);
      throw error;
    }
  }
}
