const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Client } = require('pg');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');


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

app.get('/', async (req, res) => {
  try {
    const dbData = await fetchDataFromDatabase();
    res.render('home.ejs', { dbData });
  } catch (error) {
    handleError(res, error);
  }
});



// app.get("/", (req, res) => {
//   res.render("home.ejs");
// });

app.get("/login", (req, res) => {
  res.render("login.ejs",);
});

app.get("/register", (req, res) => {
  res.render("register.ejs", );
});

app.post( "/register", async ( req, res ) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await client.query( "SELECT * FROM users WHERE username =$1", 
      [username],
     );
    if ( checkResult.rows.length > 0 ) {
      res.send( "username already exists.Try to logging in." );
    } else {
      const result = await client.query(
        "INSERT INTO users (username,password) VALUES ($1,$2)",
        [username, password]
      );
      const dbData = await fetchDataFromDatabase();
      res.render( "books.ejs", {dbData} )
    }
  } catch ( err ) {
    console.log(err)
  }
});

app.post( "/login", async ( req, res ) => {
   const username = req.body.username;
  const password = req.body.password;
  try {
    const result = await client.query( "SELECT * FROM users WHERE username = $1", [
      username,
    ] );
    if ( result.rows.length > 0 ) {
      const user = result.rows[0];
      const storedPassword = user.password;

      if ( password === storedPassword ) {
         const dbData = await fetchDataFromDatabase();
        res.render( "books.ejs", {dbData} );
      } else {
        res.send( "Incorrect Password" );
      }     
    } else {
      res.send( "User not found" );
  }
  } catch ( err ) {
    console.log( err );
  }
});



app.post('/books', async (req, res) => {
  const { title, author } = req.body;
  try {
    const bookData = await fetchBookData(title, author);
    if (!bookData) {
      res.status(404).send('Book not found');
      return;
    }
    const thumbnailUrl = bookData.volumeInfo.imageLinks ? bookData.volumeInfo.imageLinks.thumbnail : null;
    await client.query('INSERT INTO books (title, author, image_link) VALUES ($1, $2, $3)', [title, author, thumbnailUrl]);
    const dbData = await fetchDataFromDatabase();
    res.status(201).render('books', { dbData });
  } catch (error) {
    handleError(res, error);
  }
});

app.delete('/books/:book_id', async (req, res) => {
  const bookId = req.params.book_id;
  try {
    await client.query('DELETE FROM books WHERE book_id = $1', [bookId]);
    const dbData = await fetchDataFromDatabase();
    res.status(200).json({ success: true, message: 'Book deleted successfully', data: dbData });
  } catch (error) {
    handleError(res, error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

async function fetchDataFromDatabase() {
  const { rows: dbData } = await client.query('SELECT * FROM books');
  return dbData;
}

async function fetchBookData(title, author) {
  const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}`;
  try {
    const response = await axios.get(apiUrl);
    const items = response.data.items;
    if (!items || items.length === 0) {
      console.error('No books found for the given search criteria');
      return null;
    }
    return items[0];
  } catch (error) {
    console.error('Error fetching book data:', error);
    return null;
  }
}

function handleError(res, error) {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
}
