import React, { useState } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, updateEmail } from "firebase/auth";
import "./ChangePassword.css";
import { useNavigate } from 'react-router-dom'; 

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC4SQmxh8QYAXszHzzBeudI1ou7uzaHm04",
  authDomain: "esp8266-blynk-rfid-door-lock.firebaseapp.com",
  databaseURL: "https://esp8266-blynk-rfid-door-lock-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "esp8266-blynk-rfid-door-lock",
  storageBucket: "esp8266-blynk-rfid-door-lock.appspot.com",
  messagingSenderId: "1088626656948",
  appId: "1:1088626656948:web:b7aafa281345af68bcf9e1"
};

// Khởi tạo Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

const ChangeEmail = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const navigate = useNavigate();
  const handleChangeEmail = async (e) => {
    e.preventDefault(); 

    try {
      // Đăng nhập và lấy userCredential
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user; // Lấy thông tin người dùng

      // Cập nhật email
      await updateEmail(user, newEmail); // Sử dụng updateEmail từ firebase/auth
      console.log("Email đã được cập nhật thành công!");
      navigate('/');
    } catch (error) {
      console.error("Lỗi khi đăng nhập hoặc cập nhật email:", error);
    }
  };

  return (
    <div>
      <h2>Thay đổi email</h2>
      <div>
        <input
          id="old"
          type="email"
          placeholder="Email hiện tại"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          id="pass"
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          id="new"
          type="email"
          placeholder="Email mới"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
        />
        <button onClick={handleChangeEmail}>Cập nhật email</button>
      </div>
    </div>
  );
};

export default ChangeEmail;
