const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// PostgreSQL Client
const client = new Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'book_notes_db',
  password: process.env.DB_PASSWORD || '12345aa',
  port: process.env.DB_PORT || 5432,
});

client.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(error => console.error('Error connecting to PostgreSQL database:', error));


// EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// GET all books
app.get('/books', async (req, res) => {
  try {
    // Fetch data from the database
    const { rows: dbData } = await client.query('SELECT * FROM books');

    // Render the EJS template with data
    res.render('books', { dbData });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST a new book with title and author only
app.post('/api/books', async (req, res) => {
    console.log('Received data:', req.body);
    const { title, author } = req.body;
  try {
    await client.query('INSERT INTO books (title, author) VALUES ($1, $2)', [title, author]);
    res.status(201).send('Book added successfully');
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route for the root URL
app.get('/', (req, res) => {
  res.render('index.ejs'); // Assuming you want to render the index.ejs file
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
