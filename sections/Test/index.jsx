import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Sun, Moon } from "lucide-react";
import data from "./resources.json"; // Your JSON file with resource data

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // Filter resources based on search term
  const filteredData = data
    .map((category) => ({
      ...category,
      items: category.items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((category) => category.items.length > 0);

  return (
    <div
      className={`max-w-7xl mx-auto p-6 ${
        darkMode ? "dark bg-gray-900" : "bg-gray-50"
      }`}
    >
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Hey there! Explore Web Dev Goodies!
        </h1>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <input
            type="text"
            placeholder="What do you need? Search me!"
            className="p-2 border rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {filteredData.length > 0 ? (
          filteredData.map((category, index) => (
            <Category key={index} category={category} />
          ))
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center">
            Oops! Nothing matches that search. Try something else!
          </p>
        )}
      </main>
    </div>
  );
}

function Category({ category }) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        {category.category} – Dive In!
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {category.items.map((item, index) => (
          <Resource key={index} item={item} />
        ))}
      </div>
    </section>
  );
}

function Resource({ item }) {
  // Fallback image URL (Tool icon from Flaticon)
  const fallbackImage = "https://cdn-icons-png.flaticon.com/512/274/274987.png";
  const [imageSrc, setImageSrc] = useState(
    item.logo || item.favIcon || fallbackImage
  );

  // Handle image loading errors
  const handleImageError = () => {
    if (imageSrc === item.logo && item.favIcon) {
      setImageSrc(item.favIcon); // Try favicon if logo fails
    } else {
      setImageSrc(fallbackImage); // Fall back to the tool icon if both fail
    }
  };

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-200"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <img
        src={imageSrc}
        alt={`${item.name} icon`}
        className="w-8 h-8 rounded"
        loading="lazy"
        onError={handleImageError}
      />
      <span className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex-1 truncate">
        {item.name}
      </span>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigator.clipboard.writeText(item.url);
          alert(`Copied ${item.name}’s link! Go use it!`);
        }}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label="Copy link"
      >
        <Copy size={16} />
      </button>
    </motion.a>
  );
}

export default App;
