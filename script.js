let itemsPerPage = localStorage.getItem('itemsPerPage') ? parseInt(localStorage.getItem('itemsPerPage')) : 6;
let currentPage = localStorage.getItem('currentPage') ? parseInt(localStorage.getItem('currentPage')) : 1;
let currentSort = { field: 'name', ascending: true };
let currentCategory = 'all';
let searchTerm = "";
let collection = [];

// Get stamps from Express API
async function getStamps() {
    try {
        const response = await fetch("http://localhost:3000/stamps");
        if (!response.ok) throw new Error("Failed to fetch stamps");
        collection = await response.json();
        console.log("Fetched stamps:", collection); // Debugging log
        displayCollection();
    } catch (error) {
        console.error("Error fetching stamps:", error);
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

async function searchCollection() {
    searchTerm = document.getElementById('search-input').value.toLowerCase();
    const selectedCategory = document.getElementById('category-filter').value;

    try {
        const stamps = await getStamps();
        const filteredCollection = stamps
            .filter(stamp => selectedCategory === "all" || stamp.category === selectedCategory)
            .filter(stamp => !searchTerm || stamp.name.toLowerCase().includes(searchTerm));

        collection = filteredCollection;
        console.log("Filtered Collection after Search:", collection);

        sortCollection(currentSort.field)

        currentPage = 1;
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

function resetSorting() {
    currentSort = { field: null, ascending: true }; // Reset sorting state
    collection = getStamps(); // Restore original collection from data.js
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
document.addEventListener("DOMContentLoaded", () => {
    collection = getStamps();
    
    const itemsPerPageDropdown = document.getElementById("items-per-page");
    if (itemsPerPageDropdown) {
        itemsPerPageDropdown.value = itemsPerPage;
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
		if (currentPage < Math.ceil(collection.length / itemsPerPage)) {
			currentPage++;
			localStorage.setItem('currentPage', currentPage); // Save page number
			displayCollection();
		}
	});
	
	
	// Add stamp form
	document.getElementById('add-stamp-form')?.addEventListener('submit', addStamp);
	
	document.getElementById('reset-sort-btn')?.addEventListener('click', resetSorting);
});
