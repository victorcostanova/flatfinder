# FlatFinder 🏠

FlatFinder is a web application built with **Angular**, integrated with **Firebase Authentication** and **Cloud Firestore**. It allows users to create, save, and browse available flats (apartments), as well as favorite listings.

## 🔧 Setup Instructions

Follow these steps to clone and run the project locally:

### 1. Clone the repository

```bash
git clone https://github.com/victorcostanova/flatfinder.git
cd flatfinder
```

### 2. Install dependencies

```bash
npm install
```

# Firebase Project Setup

## 3. Create Firebase Project

This project uses Firebase for authentication and data storage. To connect your local version:

1. Go to Firebase Console and create a project.
2. Enable Authentication (with Email/Password).
3. Enable Cloud Firestore.
4. Go to your Firebase project settings and find your web app's config object.

## 4. Create the `environment.ts` File

The `src/environments` folder is ignored by Git to protect private credentials. You'll need to create it manually:

```bash
mkdir src/environments
touch src/environments/environment.ts
```

Then, paste your Firebase config into `environment.ts` like this:

```typescript
export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
  },
};
```

🔒 **Replace the placeholders with your actual Firebase credentials.**

## 5. Run the Application

To run the application, execute:

```bash
ng serve
```

Navigate to [http://localhost:4200](http://localhost:4200). The app will reload automatically if you make code changes.

## 📦 Build for Production

To build the project for production, execute:

```bash
ng build
```

Build artifacts will be stored in the `dist/` directory.

Feel free to contribute or report issues to help improve this project!

Developed by: Victor Costa Nova, Jacobo Jose Ramirez Araujo, Maria Valeria Castro Trujillo, and Jose Antonio Cerda Ocejo

