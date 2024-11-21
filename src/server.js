import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const PORT = 5000;


app.use(cors());
app.use(bodyParser.json());


let currentRoomNumber = null;
let currentIsLockOpen = null;

app.post('/receiveStatus', (req, res) => {
    
    const { roomNumber, isLockOpen } = req.body;
    currentRoomNumber = roomNumber;
    currentIsLockOpen = isLockOpen; 
    console.log(currentRoomNumber);
    console.log(currentIsLockOpen);
    res.status(200).send('Status received successfully');                                 
});

app.get('/getStatus', (req, res) => {
    res.json({
        roomNumber: currentRoomNumber,
        isLockOpen: currentIsLockOpen
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
