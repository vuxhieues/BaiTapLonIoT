import React from 'react';
import ReactDOM from 'react-dom/client'; // Thay 'react-dom' thành 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import ChangePassword from './ChangePassword';

// Lấy phần tử root trong DOM
const rootElement = document.getElementById('root');

// Tạo root bằng createRoot
const root = ReactDOM.createRoot(rootElement);

// Sử dụng root.render thay cho ReactDOM.render
root.render(
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/change-password" element={<ChangePassword />} />
    </Routes>
  </Router>
);
