import './App.css'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { login,loadCards, addCard, searchUsers, searchHis, unlock, loadRoomNumbers, loadRFIDLogs, lock } from './logic/logic'; // Nhập các hàm từ logic.js
import { useEffect, useState } from 'react';
// function ChangePassword() {
//     return (
//         <div>
//             <h2>Thay đổi mật khẩu</h2>
//             <input type="password" placeholder="Mật khẩu hiện tại" />
//             <input type="password" placeholder="Mật khẩu mới" />
//             <button>Thay đổi mật khẩu</button>
//         </div>
//     );
// }



function App() {
    const navigate = useNavigate(); 
    const [notifications, setNotifications] = useState([]);
    
    

    const handlePasswordChangeClick = () => {
        navigate('/change-password'); 
    };
    useEffect(() => {
        loadRoomNumbers();
        loadRFIDLogs();
    }, []); 

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch('http://localhost:5000/getStatus');
                const data = await response.json();
                
                if (data.isLockOpen) {
                    // Thêm thông báo nếu isOpen là true
                    if (!notifications.includes(`Cửa phòng ${data.roomNumber} đang mở!`)) {
                        setNotifications((prev) => [
                            ...prev,
                            `Cửa phòng ${data.roomNumber} đang mở!`
                        ]);

                        const audio = new Audio('/alarmcut.m4a');
                        audio.play();
                    }
                } else {
                    // Xóa thông báo nếu isOpen là false
                    setNotifications((prev) =>
                        prev.filter(
                            (notification) => notification !== `Cửa phòng ${data.roomNumber} đang mở!`
                        )
                    );
                }
            } catch (error) {
                console.error('Error fetching status:', error);
            }
        };

        fetchStatus(); // Gọi hàm fetchStatus để lấy trạng thái ban đầu

        // Giả định có một interval nếu bạn cần cập nhật tự động
        const interval = setInterval(fetchStatus, 5000); // Lấy trạng thái mỗi 5 giây
        return () => clearInterval(interval);

    }, [notifications]); 
    

  return (
    <>
            
            <div id="login-container" style={{ alignContent: 'center' }}>
                <h2>Đăng nhập</h2>
                <input type="email" id="email" placeholder="Email" required style={{ width: '80%' }} />
                <input type="password" id="password" placeholder="Mật khẩu" required style={{ width: '80%' }} />
                <button style={{ width: '86%' }} onClick={login}>Đăng nhập</button>
                <p id="error-message"></p>
            </div>
            <div id="hide" className="container" style={{ display: 'none' }}>
                <div className="left">
                    <h1>Điều khiển mở khóa thẻ từ</h1>
                    <div className="add-card-wrapper">
                        <input type="text" id="card-id" placeholder="Nhập ID thẻ" />
                        <input type="text" id="name" placeholder="Nhập tên người dùng" />
                        <label htmlFor="room-dropdown">Chọn số phòng:</label>
                        <select id="room-dropdown" className="dropdown" onChange={loadCards}>
                        </select>
                        <button className="button" onClick={addCard}>Thêm thẻ mới</button>
                    </div>
                    <br />
                    <h2>Danh sách thành viên:</h2>
                    <div id="search">
                        <input type="text" id="search-input" placeholder="Tìm kiếm người dùng" onInput={searchUsers} />
                    </div>
                    <div id="switch-container"></div>
                </div>
                <div className="right">
                    <h2>Lịch sử ra vào cửa</h2>
                    <div id="search">
                        <input type="text" id="search-input2" placeholder="Tìm kiếm lịch sử" onInput={searchHis} />
                    </div>
                    <div id="data-container"></div>
                    <div id="control-wrapper">
                        <button id="unlockButton" onClick={unlock}>Mở khóa</button>
                        <button id="lockButton" onClick={lock}>Đóng khóa</button>
                    </div>
                    <button id="change" onClick={handlePasswordChangeClick}>Thay đổi tài khoản Admin</button> {/* Nút chuyển hướng */}
                </div>
            </div>
            
            <div>
            {notifications.map((notification, index) => (
                <div
                    key={index}
                    className={`notification ${notification.isLeaving ? 'notification-leave' : ''}`} // Thêm lớp để xử lý biến mất
                    style={{
                        position: 'fixed',
                        bottom: `${20 + index * 70}px`, // Xếp chồng các thông báo
                        left: '20px',
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        padding: '15px',
                        border: '1px solid #f5c6cb',
                        borderRadius: '5px',
                        opacity: 1,
                        transition: 'opacity 0.5s, transform 0.5s',
                        transform: 'translateY(0)',
                    }}
                >
                    {notification}
                </div>
            ))}
        </div>
        </>
  )
}

// function AppRouter() {
//     return (
//         <Router>
//             <Routes>
//                 <Route path="/" element={<App />} />
//                 <Route path="/change-password" element={<ChangePassword />} />
//             </Routes>
//         </Router>
//     );
// }


export default App
