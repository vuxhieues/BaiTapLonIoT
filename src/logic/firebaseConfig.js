import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";
import { getDatabase, ref,get, set, onValue, remove } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyC4SQmxh8QYAXszHzzBeudI1ou7uzaHm04",
    authDomain: "esp8266-blynk-rfid-door-lock.firebaseapp.com",
    databaseURL: "https://esp8266-blynk-rfid-door-lock-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "esp8266-blynk-rfid-door-lock",
    storageBucket: "esp8266-blynk-rfid-door-lock.appspot.com",
    messagingSenderId: "1088626656948",
    appId: "1:1088626656948:web:b7aafa281345af68bcf9e1"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);