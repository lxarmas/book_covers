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

client.connect();

// EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// CRUD Operations (your existing CRUD operations)
app.get('/books', async (req, res) => {
  try {
    // Fetch data from your database
    const dbResult = await client.query('SELECT * FROM books');

    // Fetch data from the Open Library Covers API (using the .json endpoint)
    const apiDataPromises = dbResult.rows.map(async (book) => {
      const isbn = book.isbn; // Assuming you have an 'isbn' column in your database
      const coverResponse = await axios.get(`https://covers.openlibrary.org/b/isbn/${isbn}.json`);
      return {
        bookId: book.book_id, // Assuming you have a 'book_id' column in your database
        coverUrl: coverResponse.data.large ? coverResponse.data.large : null,
        title: coverResponse.data.title,
        author: coverResponse.data.author_name ? coverResponse.data.author_name.join(', ') : 'Unknown Author',
        // Add more relevant information based on the coverResponse data
      };
    });

    const apiData = await Promise.all(apiDataPromises);

    // Render the EJS template with data
    res.render('books', { dbData: dbResult.rows, apiData });

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API Integration - GET endpoint for book covers
app.get('/api/book-covers/:isbn', async (req, res) => {
  const isbn = req.params.isbn;

  try {
    // Make a GET request to the Open Library Covers API
    const response = await axios.get(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`);

    // Send the image data as a response
    res.set('Content-Type', 'image/jpeg');
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching book cover:', error);
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
