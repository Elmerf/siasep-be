const express = require('express');
const cors = require('cors');

const app = express();
const corsOptions = {
  origin: 'http://localhost:8080/',
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json('Welcome to Admin REST APIs');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`this server is running on port ${PORT}`);
});
