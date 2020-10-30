if (process.env.WEBHOOK_URL === undefined) {
    throw Error('WEBHOOK_URL is undefined');
}

import SmeeClient from 'smee-client';
import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.post('/payload', (req, res) => {
    console.log(req.body);
    res.status(200).end();
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const smee = new SmeeClient({
    source: process.env.WEBHOOK_URL,
    target: 'http://localhost:3000/payload',
    logger: console
});

smee.start();
