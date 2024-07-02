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

app.get('/img/match-three', (req, res) => {
    const imageConfig = {
        "background": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fbakery-shop.png?alt=media&token=a6cb3dcc-8d86-4c9c-bb53-a539271d0230",
        "fieldBackground": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fbg.png?alt=media&token=ca767ac0-05a9-4af4-acd8-a024388a6c50",
        "item1": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fgemstones1.png?alt=media&token=de6371dd-53bb-4ee0-ac3e-ba3ced1d5121",
        "item2": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fgemstones3.png?alt=media&token=4476cd80-783c-4a35-8503-5987a71a7006",
        "item3": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fgemstones4.png?alt=media&token=3f6303e4-c98e-4437-a997-80cc195788f6",
        "item4": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fgemstones2.png?alt=media&token=dcfe9d7f-8400-4c22-aa19-dac935f94db9",
        "matchEffect": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Ffire.png?alt=media&token=9d87b281-b20c-474d-92c4-f4724aea7957",
        "selectEffect": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fbox-frame.png?alt=media&token=f7ace9e3-364f-4948-999c-3a88ac382543"
    };
    res.status(200).json(imageConfig);
});
app.get('/img/scratch-n-win', (req, res) => {
    const imageConfig = {
        "background": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fbakery-shop.png?alt=media&token=a6cb3dcc-8d86-4c9c-bb53-a539271d0230",
        "Reward: apple": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fapple.png?alt=media&token=abf0a4e5-982c-4c37-ac9f-57002e54f144",
        "Reward: orange": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Forange.png?alt=media&token=5d3b5180-1b03-4005-bfae-08021a8341a0",
        "Reward3": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fmango.png?alt=media&token=6de7043e-0115-487d-9568-11bcbb953bbd",
        "Reward4": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fgemstones2.png?alt=media&token=dcfe9d7f-8400-4c22-aa19-dac935f94db9",
        "stopBtn1": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fstop-btn-1.png?alt=media&token=7187134a-5e4d-4c3a-9b0b-c91864f12b15",
        "stopBtn2": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fstop-btn-2.png?alt=media&token=c069210e-b3ca-477a-934d-85a66e2727a2",
        "coverImage": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fbackground.png?alt=media&token=2e3e48a0-d335-4045-a08f-9ef7aeb38ad8",
        "box": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fstarburst.png?alt=media&token=7847ad35-8ad9-4b3e-bcaa-e0a8ded86c63",
        "boxHighlight": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fyellow-starburst.png?alt=media&token=7dc056b6-17e2-4419-981b-495f70170a23"
    };
    res.status(200).json(imageConfig);
});
app.get('/img/spin-n-win', (req, res) => {
    const imageConfig = {
        "background": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fbakery-shop.png?alt=media&token=a6cb3dcc-8d86-4c9c-bb53-a539271d0230",
        "Reward: apple": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fapple.png?alt=media&token=abf0a4e5-982c-4c37-ac9f-57002e54f144",
        "Reward: orange": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Forange.png?alt=media&token=5d3b5180-1b03-4005-bfae-08021a8341a0",
        "Reward: mango": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fmango.png?alt=media&token=6de7043e-0115-487d-9568-11bcbb953bbd",
        "Reward: gem": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fgemstones2.png?alt=media&token=dcfe9d7f-8400-4c22-aa19-dac935f94db9",
        "Reward: basket": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fbasket.png?alt=media&token=d9e6531f-66cc-40f3-bf0e-3e7719cbb016",
        "pin": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fpin.png?alt=media&token=c432c166-61a4-4d29-8f13-e3f18a482597",
        "starburst": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fyellow-starburst.png?alt=media&token=7dc056b6-17e2-4419-981b-495f70170a23",
        "wheelOutline": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fwheel.png?alt=media&token=8d0ac889-0d45-4ba9-b4cc-e682490c0927"
    };
    res.status(200).json(imageConfig);
});
app.get('/img/quiz', (req, res) => {
    const imageConfig = {
        "background": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fbakery-shop.png?alt=media&token=a6cb3dcc-8d86-4c9c-bb53-a539271d0230",
        "bonusBackground": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Frobot.png?alt=media&token=5641c1f0-efb9-4191-90ff-9c3ffc6a53c5",
        "btn1": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fbtn-blue.png?alt=media&token=3fcb304c-f726-4553-9cd2-42011d2a2c73",
        "btn2": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fbtn-orange.png?alt=media&token=4ad5c5ac-55f2-4a98-8963-e71b8364db21",
        "btn3": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fbtn-green.png?alt=media&token=dd68d561-2790-43b0-a37e-6c497ea5f86a",
        "correct": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fcorrect-ans.png?alt=media&token=4a3bcfae-3051-450e-9a35-bf978a87f838",
        "wrong": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fwrong-ans.png?alt=media&token=e1e78f1c-aa0c-45b5-8b6a-d75e3f38ff59"
    };
    res.status(200).json(imageConfig);
});
app.get('/img/dodgeball', (req, res) => {
    const imageConfig = {
        "background": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Ffloor.png?alt=media&token=608f79c6-14f5-4485-937e-9ab9945d03fd",
        "border": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Ffence.png?alt=media&token=b38d379a-4120-4f5a-96e3-f30115fc9faf",
        "heart": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fheart.png?alt=media&token=b7f32048-b029-4374-bcfb-75c4177eadfc",
        "ball": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fball.png?alt=media&token=ab612565-8817-4b02-99fd-91e928e752ad",
        "buff": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2FbuffBall.png?alt=media&token=864172a8-ee96-454a-94ff-507be0e9bde7",
        "debuff": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2FdebuffBall.png?alt=media&token=23247be3-21d4-4243-a787-baf06a4a43fa",
        "playerF1": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Ffront-walk-null.png?alt=media&token=b31e0806-ddfa-4120-b731-c97dae9e5756",
        "playerF2": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Ffront-walk-left.png?alt=media&token=7e8454fd-b52a-45a6-aa2f-8152b9f19e9a",
        "playerF3": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Ffront-walk-right.png?alt=media&token=98df2245-fad1-498a-a240-0fc734157c97",
        "playerB1": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fback-walk-null.png?alt=media&token=23587399-3e5b-4613-a01d-343c979a3d64",
        "playerB2": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fback-walk-left.png?alt=media&token=9e18409f-7cf3-46d6-9962-445fb2c79c96",
        "playerB3": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fback-walk-right.png?alt=media&token=6cfda10d-60b7-4be8-a87a-5b79d927ab44"
    };
    res.status(200).json(imageConfig);
});
app.get('/img/shake-n-win', (req, res) => {
    const imageConfig = {
        "background": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fbakery-shop.png?alt=media&token=a6cb3dcc-8d86-4c9c-bb53-a539271d0230",
        "shakeItem": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2FgiftBox.png?alt=media&token=bbc99aca-180f-45ec-b44f-499127409b7f",
        "shakeWinEffect": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fexplosion-effect.png?alt=media&token=29bbc541-076a-4e1b-8a79-c00a9ad30d06",
        "Reward: apple": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fapple.png?alt=media&token=abf0a4e5-982c-4c37-ac9f-57002e54f144",
        "Reward: orange": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Forange.png?alt=media&token=5d3b5180-1b03-4005-bfae-08021a8341a0",
        "Reward: mango": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fmango.png?alt=media&token=6de7043e-0115-487d-9568-11bcbb953bbd",
        "Reward: gem": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fgemstones2.png?alt=media&token=dcfe9d7f-8400-4c22-aa19-dac935f94db9",
        "Reward: basket": "http://localhost:3000/v0/b/storytelling-384d1.appspot.com/o/game%2Fbasket.png?alt=media&token=d9e6531f-66cc-40f3-bf0e-3e7719cbb016"
    };
    res.status(200).json(imageConfig);
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
