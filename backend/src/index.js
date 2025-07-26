const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('FediStream backend API is running!');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
}); 