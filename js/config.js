
// config.js
// Global configuration (editable).
// You can modify contestants, judges, and categories here.
// Admin changes are saved back to localStorage.

window.PAGEANT_DEFAULT_CONFIG = {
  contestants: [
    "Contestant 1",
    "Contestant 2",
    "Contestant 3",
    "Contestant 4",
    "Contestant 5",
    "Contestant 6"
  ],
  judges: [
    { id: 1, name: "Judge 1" }
    // To add more judges, duplicate judge1.html -> judge2.html and change constants in that file.
    // Then add { id: 2, name: "Judge 2" } here (or via Admin page).
  ],
  categories: {
    "Evening Gown": ["Elegance", "Fit", "Style", "Confidence", "Overall Presentation"],
    "Swimwear": ["Fitness", "Confidence", "Poise", "Stage Presence", "Overall Appeal"],
    "Talent": ["Skill Level", "Creativity", "Entertainment Value", "Stage Presence", "Originality"],
    "Interview": ["Articulation", "Intelligence", "Personality", "Confidence", "Relevance"],
    "National Costume": ["Creativity", "Cultural Representation", "Craftsmanship", "Presentation", "Authenticity"]
  }
};

(function initConfig(){
  const saved = localStorage.getItem("pageant_config_v2");
  if (saved) {
    try {
      window.CONFIG = JSON.parse(saved);
    } catch(e){
      window.CONFIG = JSON.parse(JSON.stringify(window.PAGEANT_DEFAULT_CONFIG));
    }
  } else {
    window.CONFIG = JSON.parse(JSON.stringify(window.PAGEANT_DEFAULT_CONFIG));
  }
})();

window.saveConfig = function(){
  localStorage.setItem("pageant_config_v2", JSON.stringify(window.CONFIG));
};

window.resetConfig = function(){
  localStorage.removeItem("pageant_config_v2");
  window.CONFIG = JSON.parse(JSON.stringify(window.PAGEANT_DEFAULT_CONFIG));
};
