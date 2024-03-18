const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
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
    const booksData = await fetchDataFromAPI(dbData);
    res.render('index', { dbData, booksData });
  } catch (error) {
    handleError(res, error);
  }
});

// POST a new book with title and author only
app.post('/books', async (req, res) => {
  console.log('Received data:', req.body);
  const { title, author } = req.body;
  try {
    const coverImageUrl = await fetchCoverImageUrl(title, author);
    await client.query('INSERT INTO books (title, author, cover_image_url) VALUES ($1, $2, $3)', [title, author, coverImageUrl]);
    const dbData = await fetchDataFromDatabase();
    const booksData = await fetchDataFromAPI(dbData);
    res.status(201).render('index', { dbData, booksData });
  } catch (error) {
    handleError(res, error);
  }
});

// DELETE a book by ID
app.delete('/books/:book_id', async (req, res) => {
  const bookId = req.params.book_id;
  try {
    await client.query('DELETE FROM books WHERE book_id = $1', [bookId]);
    const dbData = await fetchDataFromDatabase();
    const booksData = await fetchDataFromAPI(dbData);
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

async function fetchDataFromAPI(dbData) {
  // Here you can implement logic to fetch additional data from the API if needed
  // For now, you can simply return an empty array or the original data
  return dbData;
}

async function fetchCoverImageUrl(title, author) {
  const apiUrl = `https://freebooks-api2.p.rapidapi.com/fetchEbooks/${encodeURIComponent(title)}%20${encodeURIComponent(author)}`;
  const options = {
    method: 'GET',
    url: apiUrl,
    headers: {
      'X-RapidAPI-Key': '7c4831f9bemsh413f77d704f66f7p175f27jsna06ed15ef5b8',
      'X-RapidAPI-Host': 'freebooks-api2.p.rapidapi.com'
    }
  };
  const response = await axios.request(options);
  // Assuming the API response contains the cover image URL in 'coverImage' property
  return response.data.coverImage;
}

function handleError(res, error) {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
}
