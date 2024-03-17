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