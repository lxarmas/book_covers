const express = require('express');
const bodyParser = require( 'body-parser' );
const session = require( 'express-session' ); // Import express-session
const crypto = require('crypto'); // Import the crypto module

const axios = require('axios');
const { Client } = require('pg');
const path = require('path');

const app = express();
const port = 3000;

// Generate a random secret key
const secretKey = crypto.randomBytes(32).toString('hex');

// Configure express-session middleware with the secret key
app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use( bodyParser.urlencoded( { extended: true } ) );

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
    const user_id = req.session.user_id; 
    const dbData = await fetchDataFromDatabase(user_id);
    res.render('home.ejs', { user_id, dbData });
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/login", (req, res) => {
  res.render("login.ejs",);
});

app.get("/register", (req, res) => {
  res.render("register.ejs", );
});

app.post("/register", async (req, res) => {
  const { username, password, first_name , last_name } = req.body;

  console.log("Received data:", { username, password, first_name, last_name });

  try {
    const checkResult = await client.query("SELECT * FROM users WHERE username = $1", [username]);

    if (checkResult.rows.length > 0) {
      res.send("Username already exists. Try logging in.");
    } else {
      const result = await client.query("INSERT INTO users (username, password, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING user_id", [username, password, first_name, last_name]);

      // Logging the result and user_id
      console.log("Result:", result.rows);
      const user_id = result.rows[0].user_id;
      console.log( "User ID:", user_id );
      const users = { first_name, last_name };
      console.log("Users:", users);
      const dbData = await fetchDataFromDatabase(user_id);
      res.render("books.ejs", { user_id, dbData, users });
      }
  } catch (err) {
  console.log(err);
  res.status(500).send("Internal Server Error");
  }
});



app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  try {
    const result = await client.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedPassword = user.password;

      if (password === storedPassword) {
        const user_id = user.user_id;

        // Retrieve first_name and last_name from the user object
        const { first_name, last_name } = user;
        const users = { first_name, last_name };

        const dbData = await fetchDataFromDatabase(user_id);
        // console.log("Database Data,logIN:", dbData); // Add this line for debugging
        res.render( "books.ejs", { user_id, dbData, users } );
       
      } else {
        res.send("Incorrect Password");
      }
    } else {
      res.send("User not found");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});


app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Error logging out');
    } else {
      res.redirect('/'); 
    }
  });
});

app.post('/books', async (req, res) => {
  const { title, author, user_id } = req.body;
  try {
    const bookData = await fetchBookData( title, author, user_id );
    //  console.log("bookData_logIn",bookData)
    if (!bookData) {
      res.status(404).send('Book not found');
      return;
    }
    const thumbnailUrl = bookData.volumeInfo.imageLinks ? bookData.volumeInfo.imageLinks.thumbnail : null;
    const descriptionBook = bookData.volumeInfo.description ? bookData.volumeInfo.description : '';

        // console.log("Description:", descriptionBook);
    await client.query('INSERT INTO books (title, author, image_link, user_id,description_book) VALUES ($1, $2, $3, $4,$5)', [title, author, thumbnailUrl, user_id,descriptionBook]);
    
    // Fetch the user's data including first_name from the database
    const userData = await client.query('SELECT first_name FROM users WHERE user_id = $1', [user_id]);
    const first_name = userData.rows[0].first_name;

    const dbData = await fetchDataFromDatabase(user_id);
    res.status(201).render('books', { user_id: user_id, dbData: dbData, users: { first_name: first_name } });

  } catch (error) {
    handleError(res, error);
  }
});




async function fetchDataFromDatabase(user_id) {
  try {
    const { rows: dbData } = await client.query('SELECT * FROM books WHERE user_id = $1', [user_id]);
    return dbData;
  } catch (error) {
    console.error('Error fetching data from database:', error);
    throw error; // Rethrow the error to handle it in the calling function
  }
}

async function fetchBookData( title, author ) {
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
app.delete('/books/:book_id', async (req, res) => {
  const bookId = req.params.book_id;
  const user_id = req.session.user_id; // Retrieve the user_id from the session
  try {
    await client.query('DELETE FROM books WHERE book_id = $1', [bookId]);
    const updatedBookCount = await fetchBookCount(user_id); // Fetch updated book count
    res.status(200).json({ success: true, message: 'Book deleted successfully', bookCount: updatedBookCount });
  } catch (error) {
    handleError(res, error);
  }
});

async function fetchBookCount(user_id) {
  try {
    const result = await client.query('SELECT COUNT(*) FROM books WHERE user_id = $1', [user_id]);
    return result.rows[0].count;
  } catch (error) {
    throw error;
  }
}

function handleError(res, error) {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
}



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});