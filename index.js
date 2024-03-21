// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Client } = require('pg');
const path = require('path');

// Create Express app
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

// Connect to PostgreSQL database
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
    // Fetch ISBN using Google Books API
    const isbn = await fetchISBN(title, author);

    // Update database with ISBN
    await client.query('INSERT INTO books (title, author, isbn) VALUES ($1, $2, $3)', [title, author, isbn]);

    let image_link = null; // Initialize cover image URL

    // Fetch cover image URL using ISBN if ISBN is available
    if (isbn) {
      image_link = await fetchCoverImageUrl(isbn);

      // Update database with cover image URL if it's available
      if (image_link) {
        await client.query('UPDATE books SET image_link = $1 WHERE isbn = $2', [image_link, isbn]);
      }
    }

    // Fetch data from the database
    const dbData = await fetchDataFromDatabase();
    
    // Render the page with updated data and the relevant book data
    const bookData = await fetchBookData(title, author,image_link); // Fetch additional book data
    res.status(201).render('index', { dbData, bookData }); // Pass both dbData and bookData to the template
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

// Function to fetch data from the database
async function fetchDataFromDatabase() {
  const { rows: dbData } = await client.query('SELECT * FROM books');
  return dbData;
}

// Function to fetch additional data from the API
async function fetchDataFromAPI(dbData) {
  // Implement logic to fetch additional data from the API if needed
  // For now, return the original data
  return dbData;
}



// Function to fetch the ISBN for a book from Google Books API
async function fetchISBN(title, author) {
  const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}&key=AIzaSyBAW0TEENq4KSNQkge3xHfBt-hQaTlwKCE`;
  try {
    const response = await axios.get(apiUrl);
    console.log('Google Books API response:', response.data); // Log the response
    const items = response.data.items;
    if (!items || items.length === 0) {
      console.error('No books found for the given search criteria');
      return null; // Return null if no books are found
    }
    const bookData = items[0]; // Get the first item from the array
    if (!bookData || !bookData.volumeInfo || !bookData.volumeInfo.industryIdentifiers || bookData.volumeInfo.industryIdentifiers.length === 0) {
      console.error('ISBN not found in book data');
      return null; // Return null if ISBN is not found
    }
    const isbnIdentifier = bookData.volumeInfo.industryIdentifiers.find(identifier => identifier.type === 'ISBN');
    if (!isbnIdentifier) {
      console.error('ISBN not found in book data');
      return null; // Return null if ISBN is not found
    }

    // Extract cover image URL
    const imageLink = bookData.volumeInfo.imageLinks?.thumbnail || '';

    return { isbn: isbnIdentifier.identifier, imageLink };
  } catch (error) {
    console.error('Error fetching ISBN:', error);
    throw error; // Rethrow the error to be caught by the caller
  }
}


// Function to fetch additional book data from Google Books API
async function fetchBookData(title, author) {
  const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}&key=AIzaSyBAW0TEENq4KSNQkge3xHfBt-hQaTlwKCE`;
  try {
    const response = await axios.get(apiUrl);
    console.log('Google Books API response:', response.data); // Log the response
    const items = response.data.items;
    if (!items || items.length === 0) {
      console.error('No books found for the given search criteria');
      return null;
    }
    return items[0]; // Return the first book item
  } catch (error) {
    console.error('Error fetching book data:', error);
    return null;
  }
}


// Function to fetch the cover image URL for a book using the ISBN
async function fetchCoverImageUrl(isbn) {
  const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=AIzaSyBAW0TEENq4KSNQkge3xHfBt-hQaTlwKCE`;
  try {
    const response = await axios.get(apiUrl);
    console.log('Google Books API response:', response.data); // Log the response

    const items = response.data.items;
    if (!items || items.length === 0) {
      console.error('No book found for the given ISBN');
      throw new Error('No book found for the given ISBN');
    }

    const bookData = items[0];
    if (!bookData || !bookData.volumeInfo || !bookData.volumeInfo.imageLinks || !bookData.volumeInfo.imageLinks.thumbnail) {
      console.error('Cover image URL not found in book data');
      throw new Error('Cover image URL not found for the given book');
    }

    return bookData.volumeInfo.imageLinks.thumbnail;
  } catch (error) {
    console.error('Error fetching cover image URL:', error);
    throw error;
  }
}

// Function to handle errors
function handleError(res, error) {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
}
