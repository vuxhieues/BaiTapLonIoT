#define BLYNK_TEMPLATE_ID "TMPL6lQgGj7kL"
#define BLYNK_TEMPLATE_NAME "RFID Door Lock"
#define BLYNK_AUTH_TOKEN "flPe_4x5PLa7a-Dz6PLYHQbEXxjK2pZE"
#include <FirebaseESP8266.h>

#define FIREBASE_HOST "https://esp8266-blynk-rfid-door-lock-default-rtdb.asia-southeast1.firebasedatabase.app/"  
#define FIREBASE_AUTH "gF3Dc6OBa692H1HPDfnUR2K6jWqam7rDDroJNTnd"       

FirebaseData firebaseData;
FirebaseConfig config;       
FirebaseAuth authF;           

#include <SPI.h>
#include <MFRC522.h>
#include <ESP8266WiFi.h>
#include <BlynkSimpleEsp8266.h>
#include <time.h>
#include <ESP8266WebServer.h>

#define SS_PIN 4  // sda
#define RST_PIN 2

int lock = D1;    

MFRC522 mfrc522(RST_PIN, SS_PIN);       
char auth[] ="flPe_4x5PLa7a-Dz6PLYHQbEXxjK2pZE";    

char ssid[] = "LapHieu";   
char pass[] = "23112003";   

ESP8266WebServer server(80); 
SimpleTimer timer;

String roomNumber = "101"; // Số phòng mặc định

const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 7 * 3600;  
const int daylightOffset_sec = 0;
unsigned long doorOpenStartTime = 0; 
const unsigned long doorOpenDuration = 5000;
bool isLockOpen = false;

void setup() {
    Serial.begin(9600);        
    pinMode(lock, OUTPUT);
    digitalWrite(lock, LOW);
    SPI.begin();                
    mfrc522.PCD_Init();        
    timer.setInterval(1000L, iot_rfid);

    // Kết nối Wi-Fi
    WiFi.begin(ssid, pass);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println(); 
    Serial.print("Địa chỉ IP: ");
    Serial.println(WiFi.localIP()); 

    server.on("/", HTTP_GET, handleRoot);
    server.on("/setRoom", HTTP_POST, handleSetRoom);
    server.on("/lock", HTTP_POST, lockHandler); 
    server.on("/unlock", HTTP_POST, unlockHandler);
    
    // Bắt đầu server
    server.begin();

    config.host = FIREBASE_HOST;
    config.api_key = "AIzaSyC4SQmxh8QYAXszHzzBeudI1ou7uzaHm04";  
    config.database_url = FIREBASE_HOST;  
    config.signer.tokens.legacy_token = FIREBASE_AUTH; 

    Firebase.begin(&config, &authF);

    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
}

void loop() {
    timer.run(); 
    server.handleClient(); 
    if (isLockOpen && (millis() - doorOpenStartTime >= doorOpenDuration)) {
        sendUpdateStatus();
    }   
}



void handleRoot() {
    // Hiển thị giao diện trang web để nhập số phòng
    String htmlPage = "<html>"
                      "<h1>Nhap so phong</h1>"
                      "<form action=\"/setRoom\" method=\"POST\">"
                      "So phong: <input type=\"text\" name=\"room\" value=\"" + roomNumber + "\">"
                      "<input type=\"submit\" value=\"Luu\">"
                      "</form>"
                      "</html>";

    server.send(200, "text/html", htmlPage);
}

void handleSetRoom() {
    // Lấy giá trị số phòng từ HTTP POST request
    if (server.hasArg("room")) {
        roomNumber = server.arg("room");
        Serial.print("Số phòng mới: ");
        Serial.println(roomNumber);
        server.send(200, "text/plain", "Da cap nhat so phong");
    } else {
        server.send(400, "text/plain", "Khong thanh cong!");
    }
}



void sendUpdateStatus() {
    WiFiClient client;
    if (client.connect("172.20.10.4", 5000)) { // Địa chỉ IP của frontend
        // Tạo JSON dữ liệu
        String jsonData = "{\"roomNumber\":\"" + roomNumber + "\",\"isLockOpen\":" + String(isLockOpen) + "}";
        
        // Tạo request với Content-Length đúng
        String json = "POST /receiveStatus HTTP/1.1\r\n";
        json += "Host: 192.168.1.12\r\n";
        json += "Content-Type: application/json\r\n";
        json += "Content-Length: " + String(jsonData.length()) + "\r\n"; // Độ dài của jsonData
        json += "Connection: close\r\n\r\n";
        
        client.print(json + jsonData); // Gửi header và JSON data
        delay(100); // Tạm dừng để đảm bảo dữ liệu được gửi đi
        client.stop(); // Đóng kết nối
    }
}



String getTime() {
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        Serial.println("Failed to obtain time");
        return "N/A";
    }
    
    // Trả về thời gian dạng chuỗi theo định dạng "DD/MM/YYYY HH:MM:SS"
    char timeStringBuff[25];
    strftime(timeStringBuff, sizeof(timeStringBuff), "%d/%m/%Y %H:%M:%S", &timeinfo);
    return String(timeStringBuff);
}

void logRFID(String uid, String userName) {
    String path = "/rfid_logs";
    String currentTime = getTime();
    
    // Tạo một đối tượng mới với key ngẫu nhiên trong nhánh "/rfid_logs"
    FirebaseJson json;
    json.set("uid", uid);
    json.set("user", userName);
    json.set("time", currentTime);
    json.set("room", roomNumber);
    if (Firebase.pushJSON(firebaseData, path, json)) {
        Serial.println("Dữ liệu đã được ghi vào Firebase");
    } else {
        Serial.println("Lỗi khi ghi dữ liệu vào Firebase");
        Serial.println(firebaseData.errorReason());
    }
}


void iot_rfid() {
    if (isLockOpen) {
        return;
    }
    MFRC522::MIFARE_Key key;
    for (byte i = 0; i < 6; i++) {
        key.keyByte[i] = 0xFF;
    }

    if (!mfrc522.PICC_IsNewCardPresent()) {
        return;
    }

    if (!mfrc522.PICC_ReadCardSerial()) {
        return;
    }

    String cardID = "";
    Serial.print("Card UID:");
    for (byte i = 0; i < mfrc522.uid.size; i++) {
        cardID += String(mfrc522.uid.uidByte[i]);
    }
    Serial.println(cardID);

    String cardPath = "/cards/" + roomNumber + "/" + cardID;

    Serial.println(cardPath);

    if (Firebase.getJSON(firebaseData, cardPath)) {
        if (firebaseData.dataType() == "json") {
            FirebaseJson json = firebaseData.jsonObject();
            FirebaseJsonData jsonData;

            String name = "";
            int flag = 0;

            if (json.get(jsonData, "name")) {
                name = jsonData.stringValue;
            } else {
                Serial.println("Không thể lấy thông tin 'name' từ JSON.");
            }

            if (json.get(jsonData, "flag")) {
                flag = jsonData.intValue;
            } else {
                Serial.println("Không thể lấy thông tin 'flag' từ JSON.");
            }
            if (flag == 1) {
                Serial.println(name + " đã quét thẻ.");
                logRFID(cardID, name);
                isLockOpen = true; 
                digitalWrite(lock, HIGH);
                doorOpenStartTime = millis();
                delay(3000);
                digitalWrite(lock, LOW);
                mfrc522.PCD_Init();
                isLockOpen = false;
                sendUpdateStatus();
            } else {
                Serial.println(name + " không có quyền truy cập.");
                logRFID(cardID, name + " không có quyền truy cập");
            }
        } else {
            Serial.println("Dữ liệu nhận được không phải là JSON.");
        }
    } else {
        Serial.println("Thẻ chưa được đăng ký.");
        logRFID(cardID, "Unknown");
        Serial.println("Lỗi khi truy cập Firebase: " + firebaseData.errorReason());
    }
}

void unlockHandler() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "POST");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    if (server.hasArg("action")) {
        String action = server.arg("action");
        
        if (action == "unlock" && !isLockOpen) {
            isLockOpen = true;
            digitalWrite(lock, HIGH);
            server.send(200, "text/plain", "Mở khóa thành công!");
            doorOpenStartTime = millis();
            Serial.print(doorOpenStartTime);
            mfrc522.PCD_Init();
        } 
        else {
            server.send(400, "text/plain", "Không thể thực hiện hành động này!");
        }
    } else {
        server.send(400, "text/plain", "Thiếu tham số 'action'!");
    }
}
void lockHandler() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "POST");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    if (server.hasArg("action")) {
         String action = server.arg("action");
        
        if (action == "lock" && isLockOpen) {
            isLockOpen = false;
            digitalWrite(lock, LOW);
            server.send(200, "text/plain", "Đóng khóa thành công!");
            sendUpdateStatus();
            mfrc522.PCD_Init();
        } 
        else {
            server.send(400, "text/plain", "Không thể thực hiện hành động này!");
        }
    } else {
        server.send(400, "text/plain", "Thiếu tham số 'action'!");
    }
}

