const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Enable CORS for frontend requests
app.use(express.json()); // Allow JSON parsing

// Hardcoded stamp data (replacing JSON-server)
const stamps = [
    { id: 1, name: "First Day Cover", year: 1975, category: "Commemorative", condition: "Mint", image: "images/item1.jpg" },
    { id: 2, name: "Royal Mail Stamp", year: 1980, category: "Definitive", condition: "Used", image: "images/item2.jpg" },
    { id: 3, name: "Christmas Edition", year: 1965, category: "Seasonal", condition: "Mint", image: "images/item3.jpg" },
    { id: 4, name: "Olympic Games", year: 1988, category: "Sports", condition: "Fair", image: "images/item4.jpg" },
    { id: 5, name: "Bird Series", year: 1992, category: "Nature", condition: "Excellent", image: "images/item5.jpg" },
    { id: 6, name: "Space Exploration", year: 1969, category: "Science", condition: "Mint", image: "images/item6.jpg" },
    { id: 7, name: "Queen Elizabeth II", year: 1953, category: "Definitive", condition: "Good", image: "images/item7.jpg" },
    { id: 8, name: "World Cup", year: 1966, category: "Sports", condition: "Fair", image: "images/item8.jpg" },
    { id: 9, name: "Endangered Species", year: 1995, category: "Nature", condition: "Mint", image: "images/item9.jpg" },
    { id: 10, name: "Maritime History", year: 1982, category: "Historical", condition: "Used", image: "images/item10.jpg" },
    { id: 11, name: "Railway Heritage", year: 1978, category: "Transport", condition: "Good", image: "images/item11.jpg" },
    { id: 12, name: "Flora Collection", year: 1990, category: "Nature", condition: "Excellent", image: "images/item12.jpg" },
    { id: 13, name: "Historical Figures", year: 1985, category: "Historical", condition: "Used", image: "images/item13.jpg" }
];


// API routes
app.get("/stamps", (req, res) => {
    res.json(stamps);
});

// Get a single stamp by ID
app.get("/stamps/:id", (req, res) => {
    const stampId = parseInt(req.params.id);
    const stamp = stamps.find(s => s.id === stampId);
    if (!stamp) {
        return res.status(404).json({ message: "Stamp not found" });
    }
    res.json(stamp);
});

// Post new stamp
app.post("/stamps", (req, res) => {
    const { name, year, category, condition, image } = req.body;

    if (!name || !year || !category || !condition || !image) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const newStamp = {
        id: stamps.length ? stamps[stamps.length - 1].id + 1 : 1,
        name,
        year,
        category,
        condition,
        image
    };
    stamps.push(newStamp);
    res.status(201).json(newStamp);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
