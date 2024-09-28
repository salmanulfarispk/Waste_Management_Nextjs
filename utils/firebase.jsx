import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
    apiKey: `${process.env.FIREBASE_API_KEY}`,
    authDomain: `${process.env.FIREBASE_AUTH_DOMAIN}`,
    projectId: `${process.env.FIREBASE_PROJECT_ID}`,
    storageBucket: "room-booking-81960.appspot.com",
    messagingSenderId: "917752148437",
    appId: "1:917752148437:web:4d8a3a48bdab84a34b4d5c",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export const uploadToFirebase = async (file) => {
    const storageRef = ref(storage, `images/${file.name}`); 
    
    try {
    
      await uploadBytes(storageRef, file);
      
      
      const url = await getDownloadURL(storageRef);
      return url; 
    } catch (error) {
      console.error("Error uploading to Firebase:", error);
      throw error; 
    }
  };