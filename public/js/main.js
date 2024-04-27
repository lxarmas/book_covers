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


async function deleteBook(bookId) {
    try {
        const response = await fetch(`/books/${bookId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            console.log('Book deleted successfully');
            const deletedRow = document.getElementById(`deleteForm_${bookId}`).parentNode;
            deletedRow.remove();

            // Update the book count based on the current count
            const currentCount = parseInt(document.getElementById('bookCount').innerText);
            document.getElementById('bookCount').innerText = currentCount - 1;
        } else {
            // Handle non-200 HTTP status codes
            const errorData = await response.json();
            throw new Error(`Failed to delete book: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error deleting book:', error.message);
        // Display error message to the user or handle it gracefully
        alert('An error occurred while deleting the book. Please try again later.');
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
//click on book for book_description
document.addEventListener('DOMContentLoaded', function() {
  const bookImages = document.querySelectorAll('.book-image');
  
  bookImages.forEach(image => {
    image.addEventListener('click', function() {
      const descriptionContainer = this.parentElement.nextElementSibling.querySelector( '.description-container' );
      descriptionContainer.style.display = descriptionContainer.style.display === 'none' ? 'block' : 'none';
        descriptionContainer.classList.toggle('zoomed');
      
    });
  });
});
