import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

let users = {};
let gameResults = {};
let status = {};

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'controlPanel.html'));
});

app.post('/game/user', (req, res) => {
    const { name, phone } = req.body;
    let existingUser = Object.values(users).find(user => user.phone === phone);

    if (existingUser) {
        const userId = Object.keys(users).find(key => users[key] === existingUser);
        const gameResult = gameResults[userId];

        if (gameResult && (gameResult.points !== null || gameResult.reward !== null)) {
            const currentDate = new Date();
            const playDate = new Date(gameResult.date);
            const oneDay = 5 * 60 * 1000; // 1 day 24 * 60 * 60 * 1000
            if (currentDate - playDate < oneDay) {
                const nextPlayTime = new Date(playDate.getTime() + oneDay);
                return res.status(400).json({ error: `Thanks for supporting, but one user can only play once per day. Next play available on: ${nextPlayTime.toLocaleString()}` });
            } else {
                const userId = Date.now().toString();
                users[userId] = { name, phone };
                return res.status(201).json({ userId });
            }
        }

        return res.status(200).json({ userId });
    }

    const userId = Date.now().toString();
    users[userId] = { name, phone };

    res.status(201).json({ userId });
});



app.get('/game/users', (req, res) => {
    res.status(200).json(users);
});

app.post('/game/game-result', (req, res) => {
    const { userId, date, points, status, reward } = req.body;
    gameResults[userId] = { date, points, status, reward };
    res.json({ message: 'Result recorded' });
});

app.get('/game/game-result/:userId', (req, res) => {
    const userId = req.params.userId;
    if (gameResults[userId]) {
        res.json(gameResults[userId]);
    } else {
        res.status(404).json({ message: 'No result found' });
    }
});
app.get('/game/all-info', (req, res) => {
    const allInfo = Object.keys(users).map(userId => {
        return {
            userId,
            Name: users[userId].name,
            Phone: users[userId].phone,
            PlayDate: gameResults[userId]?.date || null,
            Points: gameResults[userId]?.points || null,
            Reward: gameResults[userId]?.reward || null
        };
    });
    res.status(200).json(allInfo);
});
app.post('/game/submission-status', (req, res) => {
    const { start, end } = req.body;
    if (start !== "") {
        status.start = start;
    }

    if (end !== "") {
        status.end = end;
    }
    res.json({ message: 'Submission status updated' });
});

app.get('/game/submission-status', (req, res) => {
    res.status(200).json(status);
});

app.get('/img/drop-n-catch', (req, res) => {
    const imageConfig = {
        "background": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fbg.png?alt=media&token=ca767ac0-05a9-4af4-acd8-a024388a6c50",
        "item1": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fapple.png?alt=media&token=abf0a4e5-982c-4c37-ac9f-57002e54f144",
        "item2": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Forange.png?alt=media&token=5d3b5180-1b03-4005-bfae-08021a8341a0",
        "item3": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fmango.png?alt=media&token=6de7043e-0115-487d-9568-11bcbb953bbd",
        "debuff": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2FrottenApple.png?alt=media&token=efac5825-1524-4d92-a5d5-a3285e16ed8f",
        "basket": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fbasket.png?alt=media&token=d9e6531f-66cc-40f3-bf0e-3e7719cbb016"
    };
    res.status(200).json(imageConfig);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
