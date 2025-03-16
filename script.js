let itemsPerPage = localStorage.getItem('itemsPerPage') ? parseInt(localStorage.getItem('itemsPerPage')) : 6;
let currentPage = localStorage.getItem('currentPage') ? parseInt(localStorage.getItem('currentPage')) : 1;
let currentSort = { field: null, ascending: true };
let currentCategory = 'all';
let searchTerm = "";
let collection = [];
let currentlyFlippedCard = null;

// Get stamps from Express API
async function getStamps() {
    try {
        const response = await fetch("http://localhost:3000/stamps");
        if (!response.ok) throw new Error("Failed to fetch stamps");

        const stamps = await response.json();
        console.log("Fetched stamps", stamps) // Debugging log

        collection = stamps;

        return stamps;

    } catch (error) {
        console.error("Error fetching stamps:", error);
        return [];
    }
}

// Update page title to include current page number
function updatePageTitle() {
    document.title = `My Stamp Collection - Page ${currentPage}`;
}

// Sort function
function sortCollection(field) {
    const sortOrder = field === currentSort.field ? !currentSort.ascending : true;
    currentSort = { field, ascending: sortOrder };
	
    console.log("Sorting by:", field, "Order:", sortOrder ? "Ascending" : "Descending");
	
	// Define custom order for Condition sorting
    const conditionOrder = {
        "Mint": 5,
        "Excellent": 4,
        "Good": 3,
        "Fair": 2,
        "Used": 1
	};
	
    collection.sort((a, b) => {
        let comparison = 0;
		
        if (field === "condition") {
            // Use custom order for condition sorting
            comparison = conditionOrder[a.condition] - conditionOrder[b.condition];
			} else {
            // Default sorting for Name, Year, etc.
            if (a[field] < b[field]) comparison = -1;
            if (a[field] > b[field]) comparison = 1;
		}
		
        return sortOrder ? comparison : -comparison;
	});
	
    currentPage = 1; // Reset to Page 1 after sorting
    displayCollection(); // Update UI
    updateSortButtons(); // Update sorting icons
}



// Filter by category
async function filterByCategory(category) {
    searchTerm = document.getElementById('search-input').value.toLowerCase(); // Get search term

    // Get stamps and apply category filter
    try {
        const stamps = await getStamps();
        if (!stamps.length) return;

        const filteredCollection = stamps
            .filter(stamp => category === "all" || stamp.category === category)
            .filter(stamp => !searchTerm || stamp.name.toLowerCase().includes(searchTerm));

        collection = filteredCollection; // Update global collection
        console.log("Filtered Collection after Category Change:", collection);

        sortCollection(currentSort.field)

        displayCollection(); // Update UI

            } catch (error) {
        console.error("Error filtering by category:", error);
    }
}



function highlightMatch(text, term) {
    if (!term) return text; 
    const regex = new RegExp(`(${term})`, "gi"); 
    return text.replace(regex, `<mark>$1</mark>`); 
}

function displayCollection() {
    const container = document.getElementById('collection-container');
    if (!container) return;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedItems = collection.slice(start, end);

    container.innerHTML = ''; // Clear existing stamps

    if (paginatedItems.length === 0) {
        container.innerHTML = '<p style="text-align:center;">No results found.</p>';
    } else {
        paginatedItems.forEach(stamp => {
            const card = document.createElement('div');
            card.className = 'stamp-card';
            card.dataset.id = stamp.id;

            // Create the inner flip container
            card.innerHTML = `
                <div class="stamp-card-inner">
                    <div class="stamp-card-front">
                        <img src="${stamp.image}" alt="${stamp.name}" class="stamp-image">
                        <div class="stamp-details">
                            <h3>${highlightMatch(stamp.name, searchTerm)}</h3>
                            <p>Year: ${stamp.year}</p>
                            <p>Category: ${stamp.category}</p>
                            <p>Condition: ${stamp.condition}</p>
                        </div>
                    </div>
                    <div class="stamp-card-back">
                    <img src="${stamp.image}" alt="${stamp.name}" class="stamp-image">
                        <div class="stamp-actions">
                        <h3>Actions</h3>
                            <button class="edit-btn" data-id="${stamp.id}">Edit</button>
                            <button class="delete-btn" data-id="${stamp.id}">Delete</button>
                        </div>
                    </div>
                </div>
            `;

            // Add flip event listener
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('edit-btn') && !e.target.classList.contains('delete-btn')) {
                    handleCardFlip(card);
                }
            });

            container.appendChild(card);
        });

        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card flip
                handleEditStamp(btn.dataset.id);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card flip
                handleDeleteStamp(btn.dataset.id);
            });
        });
    }

    updatePagination();
    updatePageTitle();
}

// Handle card flip
function handleCardFlip(card) {
    // Check if card is already flipped
    const isFlipped = card.classList.contains('flipped');

    // If we have a different card already flipped, flip it back first
    if (currentlyFlippedCard && currentlyFlippedCard !== card) {
        currentlyFlippedCard.classList.remove('flipped');
        clearTimeout(parseInt(currentlyFlippedCard.dataset.flipTimeout));
    }

    // If flipping to back side
    if (!isFlipped) {
        card.classList.add('flipped');
        currentlyFlippedCard = card; // Track this as the current flipped card

        // Store the timeout ID on the card element
        card.dataset.flipTimeout = setTimeout(() => {
            card.classList.remove('flipped');
            currentlyFlippedCard = null; // Clear the reference
        }, 5000); // Flip back after 5 seconds
    } else {
        // If flipping to front side, clear the timeout
        card.classList.remove('flipped');
        clearTimeout(parseInt(card.dataset.flipTimeout));
        currentlyFlippedCard = null; // Clear the reference
    }
}

// Close any flipped cards when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.stamp-card')) {
        if (currentlyFlippedCard) {
            currentlyFlippedCard.classList.remove('flipped');
            clearTimeout(parseInt(currentlyFlippedCard.dataset.flipTimeout));
            currentlyFlippedCard = null; // Clear the reference
        }
    }
});

// Delete stamp function
async function handleDeleteStamp(id) {
    if (confirm('Are you sure you want to delete this stamp?')) {
        try {
            const response = await fetch(`http://localhost:3000/stamps/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete stamp');

            await getStamps(); // Refresh the collection
            displayCollection(); // Update UI

            alert('Stamp deleted successfully!');
        } catch (error) {
            console.error('Error deleting stamp:', error);
            alert('Failed to delete stamp');
        }
    }
}

// Edit stamp function
function handleEditStamp(id) {
    const stamp = collection.find(s => s.id == id);
    if (!stamp) return;

    // Create modal for editing
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Edit Stamp</h2>
            <form id="edit-stamp-form">
                <input type="hidden" id="edit-id" value="${stamp.id}">
                
                <div class="form-group">
                    <label for="edit-name">Name:</label>
                    <input type="text" id="edit-name" value="${stamp.name}" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-year">Year:</label>
                    <input type="number" id="edit-year" value="${stamp.year}" min="1800" max="2025" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-category">Category:</label>
                    <select id="edit-category" required>
                        <option value="Commemorative" ${stamp.category === 'Commemorative' ? 'selected' : ''}>Commemorative</option>
                        <option value="Definitive" ${stamp.category === 'Definitive' ? 'selected' : ''}>Definitive</option>
                        <option value="Seasonal" ${stamp.category === 'Seasonal' ? 'selected' : ''}>Seasonal</option>
                        <option value="Sports" ${stamp.category === 'Sports' ? 'selected' : ''}>Sports</option>
                        <option value="Nature" ${stamp.category === 'Nature' ? 'selected' : ''}>Nature</option>
                        <option value="Historical" ${stamp.category === 'Historical' ? 'selected' : ''}>Historical</option>
                        <option value="Transport" ${stamp.category === 'Transport' ? 'selected' : ''}>Transport</option>
                        <option value="Science" ${stamp.category === 'Science' ? 'selected' : ''}>Science</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="edit-condition">Condition:</label>
                    <select id="edit-condition" required>
                        <option value="Mint" ${stamp.condition === 'Mint' ? 'selected' : ''}>Mint</option>
                        <option value="Excellent" ${stamp.condition === 'Excellent' ? 'selected' : ''}>Excellent</option>
                        <option value="Good" ${stamp.condition === 'Good' ? 'selected' : ''}>Good</option>
                        <option value="Fair" ${stamp.condition === 'Fair' ? 'selected' : ''}>Fair</option>
                        <option value="Used" ${stamp.condition === 'Used' ? 'selected' : ''}>Used</option>
                    </select>
                </div>
                
                <button type="submit" class="btn">Save Changes</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal event
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });

    // Form submit event
    modal.querySelector('#edit-stamp-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const updatedStamp = {
            name: document.getElementById('edit-name').value,
            year: parseInt(document.getElementById('edit-year').value),
            category: document.getElementById('edit-category').value,
            condition: document.getElementById('edit-condition').value,
            image: stamp.image // Keep the same image
        };

        try {
            const response = await fetch(`http://localhost:3000/stamps/${stamp.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedStamp)
            });

            if (!response.ok) throw new Error('Failed to update stamp');

            await getStamps(); // Refresh collection
            displayCollection(); // Update UI

            document.body.removeChild(modal);
            alert('Stamp updated successfully!');
        } catch (error) {
            console.error('Error updating stamp:', error);
            alert('Failed to update stamp');
        }
    });
}

async function searchCollection() {
    searchTerm = document.getElementById('search-input').value.toLowerCase();
    const selectedCategory = document.getElementById('category-filter').value;

    try {
        const stamps = await getStamps();
        if (!stamps.length) return;

        const filteredCollection = stamps
            .filter(stamp => selectedCategory === "all" || stamp.category === selectedCategory)
            .filter(stamp => !searchTerm || stamp.name.toLowerCase().includes(searchTerm));

        collection = filteredCollection;
        console.log("Filtered Collection after Search:", collection);

        sortCollection(currentSort.field)

        displayCollection();

    } catch (error) {
        console.error("Error filtering by search term:", error);
    }
}




function updateItemsPerPage(value) {
    itemsPerPage = parseInt(value);
    localStorage.setItem('itemsPerPage', itemsPerPage); // Save setting
    currentPage = 1; // Reset to first page
	localStorage.setItem('currentPage', currentPage); // Save reset page number
    displayCollection(); // Update UI instantly
}


// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(collection.length / itemsPerPage);
    
    // Get button elements
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
	
    // Update text to show current page
    document.getElementById('current-page').textContent = `Page ${currentPage} of ${totalPages}`;
	
    // Disable "Previous" if on first page
    if (currentPage === 1) {
        prevBtn.disabled = true;
        prevBtn.style.opacity = "0.5"; // Grey out
        prevBtn.style.cursor = "not-allowed";
		} else {
        prevBtn.disabled = false;
        prevBtn.style.opacity = "1";
        prevBtn.style.cursor = "pointer";
	}
	
    // Disable "Next" if on the last page
    if (currentPage >= totalPages) {
        nextBtn.disabled = true;
        nextBtn.style.opacity = "0.5"; // Grey out
        nextBtn.style.cursor = "not-allowed";
		} else {
        nextBtn.disabled = false;
        nextBtn.style.opacity = "1";
        nextBtn.style.cursor = "pointer";
	}
}

// Update sort button indicators
function updateSortButtons() {
    const buttons = document.querySelectorAll('.sort-btn');
    buttons.forEach(btn => {
        const field = btn.dataset.field;
        if (field === currentSort.field) {
            btn.textContent = `${btn.dataset.label} ${currentSort.ascending ? '↑' : '↓'}`;
			} else {
            btn.textContent = btn.dataset.label;
		}
	});
}

async function resetFilters() {
    currentSort = { field: null, ascending: true }; // Reset sorting state
    currentCategory = "all";
    searchTerm = "";

    document.getElementById('category-filter').value = "all";
    document.getElementById('search-input').value = "";

    collection = await getStamps(); // Restore original collection from data.js

    currentPage = 1;
    displayCollection(); // Update UI
	
    // Reset sorting button text
    updateSortButtons();
}


// Add new stamp
async function addStamp(event) {
    event.preventDefault();

    const form = event.target;
    const newStamp = {
        name: form.name.value,
        year: parseInt(form.year.value),
        category: form.category.value,
        condition: form.condition.value,
        image: "images/dummy.jpg"
    };

    try {
        const response = await fetch("http://localhost:3000/stamps", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newStamp)
        });

        if (!response.ok) throw new Error("Failed to add stamp");

        const createdStamp = await response.json();
        console.log("Stamp added:", createdStamp); // Debugging log

        await getStamps(); // Refresh collection from API
        form.reset();
        alert("New stamp added successfully!");
        window.location.href = "collection.html"; // Redirect to collection
    } catch (error) {
        console.error("Error adding stamp:", error);
    }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", async () => {
     await getStamps();
    
    const itemsPerPageDropdown = document.getElementById("items-per-page");
    if (itemsPerPageDropdown) {
        itemsPerPageDropdown.value = itemsPerPage;
	}
	
    displayCollection(); 
	
	// Initialize sort buttons
	document.querySelectorAll('.sort-btn')?.forEach(btn => {
		btn.addEventListener('click', () => sortCollection(btn.dataset.field, currentSort.ascending));
	});
	
	displayCollection();
	
	// Pagination events
	document.getElementById('prev-btn')?.addEventListener('click', () => {
		if (currentPage > 1) {
			currentPage--;
			localStorage.setItem('currentPage', currentPage); // Save page number
			displayCollection();
		}
	});
	
	document.getElementById('next-btn')?.addEventListener('click', () => {
		if (currentPage < Math.ceil(collection.length / itemsPerPage)) {
			currentPage++;
			localStorage.setItem('currentPage', currentPage); // Save page number
			displayCollection();
		}
	});
	
	
	// Add stamp form
	document.getElementById('add-stamp-form')?.addEventListener('submit', addStamp);
	
	document.getElementById('reset-sort-btn')?.addEventListener('click', resetFilters);
});
