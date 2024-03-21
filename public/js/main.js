async function initialize(isbn) {
    var viewer = new google.books.DefaultViewer(document.getElementById('viewerCanvas'));
    viewer.load(`ISBN:${isbn}`);
}

google.books.setOnLoadCallback(async function() {
    // Get all elements with class 'book-card' (assuming each book card has this class)
    const bookCards = document.querySelectorAll('.book-card');

    // Loop through each book card
    bookCards.forEach(bookCard => {
        // Get the title and author of the book from the book card
        const title = bookCard.querySelector('.book-title').innerText.trim();
        const author = bookCard.querySelector('.author').innerText.trim();

        // Fetch the ISBN for the current book from the server
        fetchISBN(title, author)
            .then(isbn => {
                // Initialize the Google Books viewer with the fetched ISBN
                initialize(isbn);
            })
            .catch(error => {
                console.error('Error fetching ISBN:', error);
            });
    });
});

async function fetchISBN(title, author) {
    // Make a request to your server to fetch the ISBN for the given title and author
    // Example: '/getISBN?title=Title&author=Author'
    const response = await fetch(`/getISBN?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`);
    if (response.ok) {
        const data = await response.json();
        return data.isbn; // Assuming your server returns an object with the ISBN
    } else {
        throw new Error('Failed to fetch ISBN');
    }
}

async function deleteBook(bookId) {
    try {
        const response = await fetch(`/books/${bookId}`, {
            method: "DELETE",
        });

        if (response.ok) {
            // Handle success
            console.log("Book deleted successfully");
            // Optionally, you can remove the deleted book from the UI
            const deletedRow = document.getElementById(`deleteForm_${bookId}`)
                .parentNode;
            deletedRow.remove(); // Remove the entire list item
        } else {
            // Handle error
            console.error("Error deleting book");
        }
    } catch (error) {
        console.error("Error deleting book:", error);
    }
}
