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

// Route for the root URL
app.get('/', async (req, res) => {
  try {
    const dbData = await fetchDataFromDatabase();
    res.render('index', { dbData });
  } catch (error) {
    handleError(res, error);
  }
});

// POST a new book with title and author only
app.post('/books', async (req, res) => {
    console.log('Received data:', req.body);
    const { title, author } = req.body;
    try {
        // Insert the new book into the database
        await client.query('INSERT INTO books (title, author) VALUES ($1, $2)', [title, author]);
        
        // Fetch the updated list of books from the database
        const dbData = await fetchDataFromDatabase();

        // Respond with the updated list of books
        res.status(201).render('index', { dbData });
    } catch (error) {
        handleError(res, error);
    }
});

// DELETE a book by ID
app.delete('/books/:book_id', async (req, res) => {
    const bookId = req.params.book_id;
    try {
        // Delete the book from the database
        await client.query('DELETE FROM books ');

        // Fetch the updated list of books from the database
        const dbData = await fetchDataFromDatabase();

        // Respond with the updated list of books
        res.status(200).json({ success: true, message: 'Book deleted successfully', data: dbData });
    } catch (error) {
        handleError(res, error);
    }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

async function fetchDataFromDatabase() {
  const { rows: dbData } = await client.query('SELECT * FROM books');
  return dbData;
}

function handleError(res, error) {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
}
