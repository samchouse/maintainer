import express from 'express';
import bodyParser from 'body-parser';
import localtunnel from 'localtunnel';

export const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

(async () => {
    const tunnel = await localtunnel({ port: 3000, subdomain: 'mtbot' });

    console.log(tunnel.url);
})();
