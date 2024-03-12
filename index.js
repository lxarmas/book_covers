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

client.connect();

// EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// CRUD Operations

// Create
app.post('/api/books', async (req, res) => {
  try {
    const { title, author, publication_date, user_id } = req.body;
    const result = await client.query(
      'INSERT INTO books (title, author, publication_date, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, author, publication_date, user_id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Read
app.get('/api/books', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM books');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update
app.put('/api/books/:id', async (req, res) => {
  try {
    const bookId = req.params.id;
    const { title, author, publication_date, user_id } = req.body;
    const result = await client.query(
      'UPDATE books SET title=$1, author=$2, publication_date=$3, user_id=$4 WHERE book_id=$5 RETURNING *',
      [title, author, publication_date, user_id, bookId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete
app.delete('/api/books/:id', async (req, res) => {
  try {
    const bookId = req.params.id;
    const result = await client.query('DELETE FROM books WHERE book_id = $1 RETURNING *', [bookId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route for the root URL
app.get('/', (req, res) => {
  res.render('index'); // Assuming you want to render the index.ejs file
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
