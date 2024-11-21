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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
        
        
export function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            

            // Hiển thị nội dung được bảo vệ
            document.getElementById("login-container").style.display = "none";
            document.getElementById("hide").style.display = "flex";
        })
        .catch((error) => {
            errorMessage.textContent = "Đăng nhập không thành công. Sai tài khoản hoặc mật khẩu" ;
        });
}

// Gán hàm vào global scope để dùng onclick
window.login = login;

// Hàm thêm công tắc và nút xóa cho ID thẻ
export function addSwitch(flagName, name, initialState) {
    const switchWrapper = document.createElement('div');
    switchWrapper.className = 'switch-wrapper';

    const label = document.createElement('label');
    label.htmlFor = flagName;
    label.textContent = `${name}:`;
    switchWrapper.appendChild(label);


    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = flagName;
    checkbox.checked = initialState === 1; 
    switchWrapper.appendChild(checkbox);

    const slider = document.createElement('label');
    slider.className = 'slider';
    slider.htmlFor = flagName;
    switchWrapper.appendChild(slider);

    const deleteWrapper = document.createElement('div');
    switchWrapper.className = 'delete-wrapper';
    // Nút xóa
    const deleteButton = document.createElement('button');
    deleteButton.textContent = "Xóa";
    deleteButton.className = 'delete-button'; // Gán lớp CSS mới
    deleteButton.onclick = function() {
        deleteCard(flagName); // Gọi hàm xóa thẻ
    };
    deleteWrapper.appendChild(deleteButton);

    // Lắng nghe sự thay đổi của công tắc
    checkbox.addEventListener("change", function () {
        updateFlag(flagName, checkbox.checked ? 1 : 0, name);
    });

    const combinedWrapper = document.createElement('div');
    combinedWrapper.className = 'combined-wrapper';
    combinedWrapper.appendChild(switchWrapper);
    combinedWrapper.appendChild(deleteWrapper);

    document.getElementById('switch-container').appendChild(combinedWrapper);
}

// Hàm cập nhật trạng thái công tắc
export function updateFlag(flagName, flagValue, userName) {
    const roomDropdown = document.getElementById("room-dropdown"); // Hoặc từ biến nào đó mà bạn đã lưu
    const selectedRoom = roomDropdown.value.trim(); // Lấy số phòng đã chọn
    // Cập nhật giá trị flag trong Firebase cho thẻ thuộc phòng cụ thể
    const flagRef = ref(database, 'cards/' + selectedRoom + '/' + flagName  + '/flag'); // Cập nhật đúng đường dẫn

    set(flagRef, flagValue)
        .then(() => {
            alert(`Đã cập nhật quyền của ${userName} thành ${flagValue === 1 ? "BẬT" : "TẮT"}`);
        })
        .catch((error) => {
            console.error("Lỗi khi cập nhật giá trị flag trong Firebase: ", error);
        });
        roomDropdown.value = selectedRoom;
        loadCards();
}

// Hàm xóa thẻ khỏi Firebase
export function deleteCard(cardId) {
    const roomDropdown = document.getElementById("room-dropdown"); // Hoặc từ biến nào đó mà bạn đã lưu
    const selectedRoom = roomDropdown.value.trim(); // Lấy số phòng đã chọn

    // Lấy tên người dùng dựa trên ID thẻ từ Firebase
    const cardRef = ref(database, 'cards/' + selectedRoom + '/' + cardId); // Thay đổi đường dẫn

    get(cardRef).then((snapshot) => {
        if (snapshot.exists()) {
            const userName = snapshot.val().name; // Lấy tên người dùng

            // Hiển thị hộp thoại xác nhận với tên người dùng
            const confirmed = confirm(`Bạn có chắc chắn muốn xóa thẻ của ${userName}?`);
            if (!confirmed) return;

            // Xóa thẻ từ Firebase
            remove(cardRef)
                .then(() => {
                    roomDropdown.value = selectedRoom;
                    alert(`Đã xóa thẻ của ${userName} khỏi hệ thống.`);
                    loadCards(); // Tải lại danh sách thẻ sau khi xóa
                })
                .catch((error) => {
                    console.error("Lỗi khi xóa thẻ từ Firebase: ", error);
                });
        } else {
            alert("ID thẻ không tồn tại trong phòng này.");
        }
    }).catch((error) => {
        console.error("Lỗi khi lấy dữ liệu thẻ từ Firebase: ", error);
    });
}

// Hàm tải các ID thẻ từ Firebase và tạo công tắc
export function loadCards(event) {
    let selectedRoom;

    // Kiểm tra nếu event được truyền vào, thì lấy giá trị từ sự kiện
    if (event && event.target) {
        selectedRoom = event.target.value;
    } else {
        // Nếu event không tồn tại, lấy giá trị từ element bằng id
        selectedRoom = document.getElementById("room-dropdown").value;
    }

    console.log(`Đang tải danh sách thẻ từ phòng ${selectedRoom}...`);

    const cardsRef = ref(database, 'cards/' + selectedRoom);
    const cardsArray = [];

    onValue(cardsRef, (snapshot) => {
        console.log(`Đang tải các thẻ từ phòng ${selectedRoom}...`);
        document.getElementById("switch-container").innerHTML = ''; // Xóa các công tắc cũ

        snapshot.forEach((childSnapshot) => {
            const cardId = childSnapshot.key;
            const { name, flag } = childSnapshot.val(); 
            console.log(`Thẻ đã tải: ID = ${cardId}, Tên = ${name}, Giá trị công tắc = ${flag}`);
            cardsArray.push({ cardId, name, flag });
        });

        cardsArray.sort((a, b) => {
            const lastNameA = a.name.trim().split(" ").slice(-1)[0];
            const lastNameB = b.name.trim().split(" ").slice(-1)[0];
            return lastNameA.localeCompare(lastNameB); 
        });

        cardsArray.forEach(card => {
            addSwitch(card.cardId, card.name, card.flag);
        });
        cardsArray.length = 0;
    }, (error) => {
        console.error("Lỗi khi tải ID thẻ từ Firebase: ", error);
    });
}


export function loadRoomNumbers() {
    console.log("Đang tải danh sách phòng từ Firebase..."); // Thêm log
    const roomsRef = ref(database, 'cards');
    onValue(roomsRef, (snapshot) => {
        const dropdown = document.getElementById("room-dropdown");
        dropdown.innerHTML = ''; // Xóa các tùy chọn hiện tại

        snapshot.forEach(childSnapshot => {
            const roomNumber = childSnapshot.key; // Lấy số phòng từ khóa của mỗi child
            const option = document.createElement("option");
            option.value = roomNumber; // Gán giá trị cho option
            option.textContent = roomNumber; // Gán tên hiển thị cho option
            dropdown.appendChild(option); // Thêm option vào dropdown
        });

        // Chọn phòng mặc định là 101 (hoặc phòng đầu tiên nếu không có phòng nào)
        if (snapshot.size > 0) {
            dropdown.value = Object.keys(snapshot.val())[0]; // Chọn phòng đầu tiên
            loadCards(); // Tải thẻ theo phòng đã chọn ngay lập tức
        }
    }, (error) => {
        console.error("Lỗi khi tải danh sách phòng từ Firebase: ", error);
    });
}
// document.addEventListener("DOMContentLoaded", function () {
//     loadRoomNumbers(); // Tải các ID thẻ từ Firebase khi trang được tải
    
// });
// Hàm thêm thẻ mới vào Firebase
export function addCard() {
    const cardId = document.getElementById("card-id").value.trim();
    const name = document.getElementById("name").value.trim();
    const roomDropdown = document.getElementById("room-dropdown"); // Lấy dropdown phòng
    const selectedRoom = roomDropdown.value.trim(); // Lấy phòng được chọn

    if (cardId === "" || name === "" || selectedRoom === "") {
        alert("Vui lòng nhập ID thẻ, tên và chọn phòng.");
        return;
    }

    // Tham chiếu đến Firebase với phòng đã chọn
    const cardRef = ref(database, 'cards/' + selectedRoom + '/' + cardId);

    get(cardRef).then((snapshot) => {
        if (snapshot.exists()) {
            const existingName = snapshot.val().name;
            const confirmed = confirm(`ID thẻ này đã tồn tại với tên: ${existingName}. Bạn có chắc chắn muốn thay đổi thông tin không?`);
            if (!confirmed) {
                return;
            }
        }

        // Nếu thẻ không tồn tại hoặc người dùng đồng ý thay đổi, tiếp tục lưu thẻ vào Firebase
        set(cardRef, {
            name: name,
            flag: 0
        }).then(() => {
            console.log("Đã lưu ID thẻ và tên vào Firebase: " + cardId + ", " + name);
            alert("Đã thêm người dùng " + name + " thành công!");

            // Đặt lại dropdown về phòng mặc định (101)
            roomDropdown.value = selectedRoom;
            loadCards(); 
            document.getElementById("card-id").value = "";
            document.getElementById("name").value = "";
        }).catch((error) => {
            console.error("Lỗi khi lưu ID thẻ vào Firebase: ", error);
        });
    }).catch((error) => {
        console.error("Lỗi khi kiểm tra ID thẻ trong Firebase: ", error);
    });
}






// Hàm hiển thị dữ liệu từ Firebase
export function displayData(snapshot) {
    const dataContainer = document.getElementById('data-container');
    dataContainer.innerHTML = '';  // Xóa dữ liệu hiện tại

    // Tạo mảng để lưu trữ các đối tượng log
    const logs = [];

    snapshot.forEach(childSnapshot => {
        const log = childSnapshot.val();
        logs.push(log);  // Thêm đối tượng log vào mảng
    });
    
    // Sắp xếp mảng logs dựa trên thời gian
    logs.sort((a, b) => {
        const dateA = parseDate(a.time);
        const dateB = parseDate(b.time);
        return dateB - dateA;  // Sắp xếp từ gần nhất đến xa nhất
    });

    // Hiển thị dữ liệu đã sắp xếp
    logs.forEach(log => {
        const div = document.createElement('div');
        div.className = 'data-item';
        div.innerHTML = `<strong>User:</strong> ${log.user} <br> <br> <strong>Time:</strong> ${log.time} <br> <br> <strong>Id thẻ:</strong> ${log.uid} <br> <br> <strong>Phòng:</strong> ${log.room}` ;
        dataContainer.appendChild(div);
    });

    logs.length = 0;
}


export function parseDate(dateString) {
    const parts = dateString.split(/[\s/:]+/);  
    return new Date(parts[2], parts[1] - 1, parts[0], parts[3], parts[4], parts[5]);
}


// Tải lịch sử ra vào cửa
export function loadRFIDLogs() {
    const rfidRef = ref(database, 'rfid_logs');  // Điều chỉnh đường dẫn theo cấu trúc cơ sở dữ liệu của bạn
    onValue(rfidRef, (snapshot) => {
        console.log("Đang tải lịch sử RFID...");
        displayData(snapshot);
    }, (error) => {
        console.error("Lỗi khi tải lịch sử RFID từ Firebase: ", error);
    });
}

// Gọi hàm loadCards() và loadRFIDLogs() khi tải trang
// document.addEventListener("DOMContentLoaded", function () {
//     loadRFIDLogs(); // Tải lịch sử ra vào cửa khi trang được tải
// });
export function searchUsers() {
    const searchInput = document.getElementById("search-input").value.toLowerCase();
    const switches = document.querySelectorAll('.combined-wrapper');

    switches.forEach(switchWrapper => {
        const label = switchWrapper.querySelector('label');
        const userName = label.textContent.toLowerCase();

        // Hiện hoặc ẩn công tắc dựa trên tên người dùng
        if (userName.includes(searchInput)) {
            switchWrapper.style.display = 'flex'; // Hiển thị công tắc
        } else {
            switchWrapper.style.display = 'none'; // Ẩn công tắc
        }
    });
}   
export function searchHis() {
    const searchInput = document.getElementById("search-input2").value.toLowerCase();
    const dataItems = document.querySelectorAll('#data-container .data-item');

    dataItems.forEach(item => {
        const user = item.innerHTML.toLowerCase();
        // Kiểm tra xem phần tử có chứa chuỗi tìm kiếm không
        if (user.includes(searchInput)) {
            item.style.display = 'block'; // Hiển thị kết quả tìm kiếm
        } else {
            item.style.display = 'none'; // Ẩn nếu không khớp
        }
    });
} 
export function unlock() {
    fetch('http://192.168.137.27/unlock', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ action: 'unlock' })
    })
    .then(response => {
        if (response.ok) {
            alert('Mở khóa thành công!');
        } else {
            alert('Có lỗi xảy ra khi mở khóa!');
        }
    })
    .catch(error => {
        console.error('Lỗi:', error);
        alert('Có lỗi xảy ra khi mở khóa!');
    });
}

export function lock() {
    fetch('http://192.168.137.27/lock', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ action: 'lock' })
    })
    .then(response => {
        if (response.ok) {
            alert('Khóa cửa thành công!');
        } else {
            alert('Có lỗi xảy ra khi mở khóa!');
        }
    })
    .catch(error => {
        console.error('Lỗi:', error);
        alert('Có lỗi xảy ra khi mở khóa!');
    });
}
