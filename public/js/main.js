document.addEventListener('DOMContentLoaded', function() {
    const deleteForms = document.querySelectorAll('.book-list form');

    deleteForms.forEach(form => {
        form.addEventListener('submit', async function(event) {
            event.preventDefault(); // Prevent form submission
            
            const bookId = form.dataset.bookId;
            
            try {
                const response = await fetch('/books/' + bookId, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    // Remove the deleted book from the UI
                    const deletedRow = form.closest('li'); // Get the closest parent li element
                    deletedRow.remove(); // Remove the entire row
                } else {
                    console.error('Error deleting book');
                }
            } catch (error) {
                console.error('Error deleting book:', error);
            }
        });
    });
});
