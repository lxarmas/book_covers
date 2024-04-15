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

// main.js

// Function to handle logout
function logout() {
  // Make an AJAX request to the logout route
  fetch('/logout', {
    method: 'POST', // Use POST method
    headers: {
      'Content-Type': 'application/json' // Specify JSON content type
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
