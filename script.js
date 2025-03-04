let storedItemsPerPage = localStorage.getItem('itemsPerPage');
let ITEMS_PER_PAGE = storedItemsPerPage ? parseInt(storedItemsPerPage) : 6; // Default value
console.log("ITEMS_PER_PAGE is set to:", ITEMS_PER_PAGE); // Debugging log

let storedPage = localStorage.getItem('currentPage'); // Load saved page number
let currentPage = storedPage ? parseInt(storedPage) : 1; // Default to 1 if nothing is saved

let currentSort = { field: 'name', ascending: true };
let currentCategory = 'all';
let collection = getStamps();
let isFirstLoad = true; 


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
function filterByCategory(category) {
    const searchTerm = document.getElementById('search-input').value.toLowerCase(); // Get search term
	
    // Get stamps and apply category filter
    let filteredCollection = getStamps().filter(stamp => 
        category === "all" || stamp.category === category
	);
	
    // If a search term is entered, apply it on top of category filtering
    if (searchTerm) {
        filteredCollection = filteredCollection.filter(stamp => 
            stamp.name.toLowerCase().includes(searchTerm)
		);
	}
	
    collection = filteredCollection; // Update global collection
    console.log("Filtered Collection after Category Change:", collection);
	
    displayCollection(); // Update UI
}



function highlightMatch(text, term) {
    if (!term) return text; 
    const regex = new RegExp(`(${term})`, "gi"); 
    return text.replace(regex, `<mark>$1</mark>`); 
}

function displayCollection() {
    const container = document.getElementById('collection-container');
    if (!container) return;
	
	const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginatedItems = collection.slice(start, end);
	
    container.innerHTML = ''; // Clear existing stamps
	
	
	
    if (paginatedItems.length === 0) {
        container.innerHTML = '<p style="text-align:center;">No results found.</p>';
		} else {
        paginatedItems.forEach(stamp => {
            const card = document.createElement('div');
            card.className = 'stamp-card';
            card.innerHTML = `
			<img src="${stamp.image}" alt="${stamp.name}" class="stamp-image">
			<div class="stamp-details">
			<h3>${highlightMatch(stamp.name, searchTerm)}</h3>
			<p>Year: ${stamp.year}</p>
			<p>Category: ${stamp.category}</p>
			<p>Condition: ${stamp.condition}</p>
			</div>
            `;
            container.appendChild(card);
		});
	}
	
    updatePagination();
    updatePageTitle();
}

let searchTerm = "";

function searchCollection() {
    searchTerm = document.getElementById('search-input').value.toLowerCase();
    const selectedCategory = document.getElementById('category-filter').value;
	
    // Filter by name first
    let filteredCollection = getStamps().filter(stamp => 
        stamp.name.toLowerCase().includes(searchTerm)
	);
	
    // If a category is selected, filter further
    if (selectedCategory !== "all") {
        filteredCollection = filteredCollection.filter(stamp => 
            stamp.category === selectedCategory
		);
	}
	
    collection = filteredCollection;
    currentPage = 1; 
    displayCollection(); 
}




function updateItemsPerPage(value) {
    ITEMS_PER_PAGE = parseInt(value);
    localStorage.setItem('itemsPerPage', ITEMS_PER_PAGE); // Save setting
    currentPage = 1; // Reset to first page
	localStorage.setItem('currentPage', currentPage); // Save reset page number
    displayCollection(); // Update UI instantly
}


// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(collection.length / ITEMS_PER_PAGE);
    
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

function resetSorting() {
    currentSort = { field: null, ascending: true }; // Reset sorting state
    collection = getStamps(); // Restore original collection from data.js
    displayCollection(); // Update UI
	
    // Reset sorting button text
    updateSortButtons();
}


// Add new stamp
function addStamp(event) {
	event.preventDefault();
	
	const form = event.target;
	const stamps = getStamps();
	const newStamp = {
		id: stamps.length + 1,
		name: form.name.value,
		year: parseInt(form.year.value),
		category: form.category.value,
		condition: form.condition.value,
		image: "images/dummy.jpg"
	};
	
	stamps.push(newStamp);
	saveStamps(stamps);
	collection = currentCategory === 'all' 
	? getStamps()
	: getStamps().filter(stamp => stamp.category === currentCategory);
	
	form.reset();
	alert('New stamp added successfully!');
	window.location.href = 'collection.html';
}


// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    collection = getStamps();
    
    const itemsPerPageDropdown = document.getElementById("items-per-page");
    if (itemsPerPageDropdown) {
        itemsPerPageDropdown.value = ITEMS_PER_PAGE;
	}
	
    displayCollection(); 
	
	// Initialize sort buttons
	document.querySelectorAll('.sort-btn')?.forEach(btn => {
		btn.addEventListener('click', () => sortCollection(btn.dataset.field));
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
		if (currentPage < Math.ceil(collection.length / ITEMS_PER_PAGE)) {
			currentPage++;
			localStorage.setItem('currentPage', currentPage); // Save page number
			displayCollection();
		}
	});
	
	
	// Add stamp form
	document.getElementById('add-stamp-form')?.addEventListener('submit', addStamp);
	
	document.getElementById('reset-sort-btn')?.addEventListener('click', resetSorting);
});
