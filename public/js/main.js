// Function to initialize the Google Books viewer with the given thumbnail URL
function initialize(thumbnailUrl) {
    const viewerCanvas = document.getElementById('viewerCanvas');
    viewerCanvas.innerHTML = ''; // Clear previous content if any
    const img = document.createElement('img');
    img.src = thumbnailUrl;
    img.alt = 'Book Thumbnail';
    img.style.width = '100%'; // Adjust the image size as needed
    viewerCanvas.appendChild(img);
}

// Function to fetch the thumbnail URL for a book from the server
async function fetchThumbnailUrl(title, author) {
    try {
        const response = await fetch(`/getBookData?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`);
        if (response.ok) {
            const bookData = await response.json();
            if (bookData && bookData.thumbnailUrl) {
                return bookData.thumbnailUrl;
            } else {
                throw new Error('Thumbnail URL not found for the book');
            }
        } else {
            throw new Error('Failed to fetch book data');
        }
    } catch (error) {
        throw new Error('Error fetching book data: ' + error.message);
    }
}

// Function to initialize the Google Books viewer with book data
async function initializeBookViewer(title, author) {
    try {
        const thumbnailUrl = await fetchThumbnailUrl(title, author);
        initialize(thumbnailUrl);
    } catch (error) {
        console.error('Error initializing book viewer:', error);
    }
}

// Function to delete a book by its ID
async function deleteBook(bookId) {
    try {
        const response = await fetch(`/books/${bookId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            console.log('Book deleted successfully');
            const deletedRow = document.getElementById(`deleteForm_${bookId}`).parentNode;
            deletedRow.remove();
        } else {
            console.error('Error deleting book');
        }
    } catch (error) {
        console.error('Error deleting book:', error);
    }
}

// Google Books API callback function
google.books.setOnLoadCallback(async function() {
    const bookCards = document.querySelectorAll( '.book-card' );
    
    // Loop through each book card
    bookCards.forEach(async bookCard => {
        console.log('BookCard:',bookCard)
        const titleElement = bookCard.querySelector( '.book-title' );
        console.log('TitleElement:',titleElement);
        const authorElement = bookCard.querySelector( '.author' );
        console.log('AuthorElement:',authorElement);
        
        if (titleElement && authorElement) {
            const title = titleElement.innerText.trim();
            const author = authorElement.innerText.trim();
            
            try {
                await initializeBookViewer(title, author);
            } catch (error) {
                console.error('Error initializing book viewer:', error);
            }
        } else {
            console.error('Title or author element not found for the book card');
        }
    });
});
