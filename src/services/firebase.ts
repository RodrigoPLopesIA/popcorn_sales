import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "SUA_KEY",
  authDomain: "SUA_AUTH",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET",
  messagingSenderId: "SEU_ID",
  appId: "SEU_APP_ID"
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)