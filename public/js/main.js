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



// Function to delete a book by its ID
async function deleteBook(bookId,user_id) {
    try {
        const response = await fetch(`/books/${bookId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            console.log('Book deleted successfully');
            const deletedRow = document.getElementById(`deleteForm_${bookId}`).parentNode;
          deletedRow.remove();
           fetchUserBooks(user_id);
        } else {
            console.error('Error deleting book');
        }
    } catch (error) {
        console.error('Error deleting book:', error);
    }
}
function logout() {
 fetch('/logout', {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json' 
    }
  })
  .then(response => {
    // Check if the response status is OK
    if (response.ok) {
      // Redirect to the login page after successful logout
      window.location.href = '/';
    } else {
      // Handle error
      console.error('Logout failed:', response.statusText);
    }
  })
  .catch(error => {
    // Handle fetch error
    console.error('Logout failed:', error);
  });
}

async function fetchUserBooks() {
    try {
        const response = await fetch('/user/books');
        if (response.ok) {
            const dbData = await response.json();
            // Call the updateBooksReadHeader function with the fetched book data
            updateBooksReadHeader(dbData);
        } else {
            console.error('Failed to fetch user books:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching user books:', error);
    }
}

// Call the fetchUserBooks function to retrieve the user's book data
fetchUserBooks();

// Function to update the h2 dynamically
function updateBooksReadHeader(dbData) {
    const booksReadHeader = document.getElementById('booksReadHeader');
    booksReadHeader.textContent = `List of Books You Have Read (${dbData.length} books):`;
}