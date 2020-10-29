const SmeeClient = require('smee-client');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.post('/payload', (req: { body: any }, res: { status: (arg0: number) => { (): any; new(): any; end: { (): void; new(): any } } }) => {
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
