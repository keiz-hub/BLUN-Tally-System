/ Auto-detect judge name from page title or default to "Judge 1"
let JUDGE_NAME = "Judge 1";
let scores = {};

// Auto-detect judge name from various sources
function detectJudgeName() {
  // Try to get from page title
  const titleMatch = document.title.match(/Judge\s+(\d+|[A-Za-z]+)/i);
  if (titleMatch) {
    JUDGE_NAME = titleMatch[0];
    return;
  }
  
  // Try to get from header h1
  const h1 = document.querySelector('h1');
  if (h1) {
    const h1Match = h1.textContent.match(/Judge\s+(\d+|[A-Za-z]+)/i);
    if (h1Match) {
      JUDGE_NAME = h1Match[0];
      return;
    }
  }
  
  // Try to get from any element with judge info
  const judgeElements = document.querySelectorAll('[data-judge], .judge-name, #judge-name');
  for (let element of judgeElements) {
    if (element.textContent || element.dataset.judge) {
      JUDGE_NAME = element.textContent || element.dataset.judge;
      return;
    }
  }
  
  // Try to get from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('judge')) {
    JUDGE_NAME = urlParams.get('judge');
    return;
  }
  
  // Try to get from filename if possible
  const path = window.location.pathname;
  const filenameMatch = path.match(/judge[-_]?(\d+|[a-zA-Z]+)/i);
  if (filenameMatch) {
    JUDGE_NAME = `Judge ${filenameMatch[1]}`;
    return;
  }
}

// Auto-detect contestants from the page
function detectContestants() {
  const contestants = [];
  const contestantElements = document.querySelectorAll('td:first-child, th:first-child');
  
  contestantElements.forEach(element => {
    const text = element.textContent.trim();
    if (text.toLowerCase().includes('contestant') && !contestants.includes(text)) {
      contestants.push(text);
    }
  });
  
  return contestants.length > 0 ? contestants : ["Contestant 1", "Contestant 2", "Contestant 3"];
}

// Auto-detect categories and subcategories from the page structure
function detectCategories() {
  const categories = [];
  const pages = document.querySelectorAll('.page');
  
  pages.forEach(page => {
    const pageId = page.id;
    if (pageId && pageId !== 'summary') {
      const table = page.querySelector('table');
      if (table) {
        const headers = table.querySelectorAll('th');
        const subcategories = [];
        
        headers.forEach((header, index) => {
          const headerText = header.textContent.trim();
          if (index > 0 && index < headers.length - 1 && headerText !== 'Category Total') {
            const subcategoryName = headerText.toLowerCase().replace(/\s+/g, '-');
            subcategories.push(subcategoryName);
            categories.push({
              name: `${pageId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${headerText}`,
              min: 1,
              max: 10
            });
          }
        });
      }
    }
  });
  
  return categories;
}

// Get detected data
const contestants = detectContestants();
const categories = detectCategories();

// Initialize scores object with localStorage support
function initializeScores() {
  const categoryMap = {
    'evening-gown': ['elegance', 'fit', 'style', 'poise', 'overall'],
    'talent': ['skill', 'creativity', 'stage-presence', 'entertainment', 'overall'],
    'interview': ['confidence', 'articulation', 'content', 'personality', 'overall'],
    'swimwear': ['fitness', 'confidence', 'posture', 'stage-walk', 'overall'],
    'question': ['quick-thinking', 'clarity', 'relevance', 'confidence', 'overall']
  };

  for (let contestant = 1; contestant <= 3; contestant++) {
    scores[contestant] = {};
    Object.keys(categoryMap).forEach(category => {
      scores[contestant][category] = {};
      categoryMap[category].forEach(subcategory => {
        // Load from localStorage if available
        const storageKey = `${JUDGE_NAME}_Contestant ${contestant}_${category}_${subcategory}`;
        const savedValue = localStorage.getItem(storageKey);
        scores[contestant][category][subcategory] = savedValue ? parseFloat(savedValue) : 0;
      });
    });
  }
  
  // Load saved values into inputs
  loadSavedValues();
}

// Load saved values into input fields
function loadSavedValues() {
  document.querySelectorAll('.score-input').forEach(input => {
    const contestant = input.dataset.contestant;
    const category = input.dataset.category;
    const subcategory = input.dataset.subcategory;
    const storageKey = `${JUDGE_NAME}_Contestant ${contestant}_${category}_${subcategory}`;
    const savedValue = localStorage.getItem(storageKey);
    if (savedValue) {
      input.value = savedValue;
    }
  });
  
  // Update all totals after loading
  updateAllTotals();
}

// Show specific page
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Remove active class from all tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected page
  document.getElementById(pageId).classList.add('active');
  
  // Add active class to selected tab
  event.target.classList.add('active');
  
  // Update summary if on summary page
  if (pageId === 'summary') {
    updateSummary();
  }
}

// Calculate category total
function calculateCategoryTotal(contestant, category) {
  let total = 0;
  Object.values(scores[contestant][category]).forEach(score => {
    total += parseFloat(score) || 0;
  });
  return total;
}

// Calculate grand total
function calculateGrandTotal(contestant) {
  let total = 0;
  Object.keys(scores[contestant]).forEach(category => {
    total += calculateCategoryTotal(contestant, category);
  });
  return total;
}

// Update all totals
function updateAllTotals() {
  // Update category totals
  document.querySelectorAll('.category-total').forEach(cell => {
    const contestant = cell.dataset.contestant;
    const category = cell.dataset.category;
    const total = calculateCategoryTotal(contestant, category);
    cell.textContent = total.toFixed(1);
  });
  
  // Update progress indicators
  updateProgressIndicators();
  
  // Update summary if visible
  if (document.getElementById('summary').classList.contains('active')) {
    updateSummary();
  }
}

// Update progress indicators
function updateProgressIndicators() {
  const categoryList = ['evening-gown', 'talent', 'interview', 'swimwear', 'question'];
  
  categoryList.forEach(category => {
    let hasScores = false;
    for (let contestant = 1; contestant <= 3; contestant++) {
      Object.values(scores[contestant][category]).forEach(score => {
        if (parseFloat(score) > 0) {
          hasScores = true;
        }
      });
    }
    
    const tab = document.querySelector(`[onclick="showPage('${category}')"] .progress-indicator`);
    if (tab) {
      if (hasScores) {
        tab.classList.add('show');
      } else {
        tab.classList.remove('show');
      }
    }
  });
}

// Update summary page
function updateSummary() {
  for (let contestant = 1; contestant <= 3; contestant++) {
    const categoryList = ['evening-gown', 'talent', 'interview', 'swimwear', 'question'];
    
    categoryList.forEach(category => {
      const categoryTotal = calculateCategoryTotal(contestant, category);
      const element = document.getElementById(`summary-${category}-${contestant}`);
      if (element) {
        element.textContent = categoryTotal.toFixed(1);
      }
    });
    
    const grandTotal = calculateGrandTotal(contestant);
    const totalElement = document.getElementById(`summary-total-${contestant}`);
    const cardElement = document.getElementById(`total-${contestant}`);
    
    if (totalElement) totalElement.textContent = grandTotal.toFixed(1);
    if (cardElement) cardElement.textContent = grandTotal.toFixed(1);
  }
}

// Handle score input with localStorage and validation
document.addEventListener('input', function(e) {
  if (e.target.classList.contains('score-input')) {
    const contestant = e.target.dataset.contestant;
    const category = e.target.dataset.category;
    const subcategory = e.target.dataset.subcategory;
    let value = parseFloat(e.target.value) || 0;
    
    // Validate input range (1-10)
    if (value < 1 && value !== 0) {
      value = 1;
      e.target.value = 1;
    }
    if (value > 10) {
      value = 10;
      e.target.value = 10;
    }
    
    // Update scores object
    scores[contestant][category][subcategory] = value;
    
    // Save to localStorage
    const storageKey = `${JUDGE_NAME}_Contestant ${contestant}_${category}_${subcategory}`;
    localStorage.setItem(storageKey, value.toString());
    
    // Update category total
    const categoryTotal = calculateCategoryTotal(contestant, category);
    const totalElement = document.querySelector(`.category-total[data-contestant="${contestant}"][data-category="${category}"]`);
    if (totalElement) {
      totalElement.textContent = categoryTotal.toFixed(1);
    }
    
    // Visual feedback
    e.target.style.borderColor = '#667eea';
    setTimeout(() => {
      e.target.style.borderColor = '#e2e8f0';
    }, 1000);
    
    // Update progress indicators
    updateProgressIndicators();
    
    // Update summary if on summary page
    if (document.getElementById('summary').classList.contains('active')) {
      updateSummary();
    }
  }
});

// Export CSV function (enhanced version)
function exportCSV() {
  let rows = [];
  let header = ["Contestant", ...categories.map(c => c.name), "Total"];
  rows.push(header);

  // Build data rows
  for (let contestant = 1; contestant <= 3; contestant++) {
    let row = [];
    row.push(`Contestant ${contestant}`);
    let sum = 0;
    
    categories.forEach(cat => {
      // Extract category and subcategory from name
      const parts = cat.name.split(' - ');
      const categoryName = parts[0].toLowerCase().replace(/\s+/g, '-').replace('on-stage-question', 'question');
      const subcategoryName = parts[1].toLowerCase().replace(/\s+/g, '-');
      
      const value = scores[contestant][categoryName] && scores[contestant][categoryName][subcategoryName] 
        ? scores[contestant][categoryName][subcategoryName] 
        : 0;
      
      row.push(value);
      sum += parseFloat(value);
    });
    
    row.push(sum.toFixed(2));
    rows.push(row);
  }

  let csvContent = rows.map(e => e.join(",")).join("\n");
  let blob = new Blob([csvContent], { type: "text/csv" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${JUDGE_NAME}_complete_scores.csv`;
  link.click();
  
  // Success feedback
  const button = event.target;
  const originalText = button.innerHTML;
  button.innerHTML = '✅ Exported!';
  button.style.background = '#48bb78';
  setTimeout(() => {
    button.innerHTML = originalText;
    button.style.background = '';
  }, 2000);
}

// Clear all scores
function clearAllScores() {
  if (confirm('Are you sure you want to clear all scores from all categories?')) {
    // Clear input fields
    document.querySelectorAll('.score-input').forEach(input => {
      input.value = '';
    });
    
    // Clear category totals
    document.querySelectorAll('.category-total').forEach(cell => {
      cell.textContent = '0';
    });
    
    // Clear localStorage
    categories.forEach(cat => {
      contestants.forEach(contestant => {
        const parts = cat.name.split(' - ');
        const categoryName = parts[0].toLowerCase().replace(/\s+/g, '-').replace('on-stage-question', 'question');
        const subcategoryName = parts[1].toLowerCase().replace(/\s+/g, '-');
        const storageKey = `${JUDGE_NAME}_${contestant}_${categoryName}_${subcategoryName}`;
        localStorage.removeItem(storageKey);
      });
    });
    
    // Reset scores object
    initializeScores();
    updateProgressIndicators();
    updateSummary();
  }
}

// Initialize on page load (compatible with both DOMContentLoaded and window.onload)
window.onload = function() {
  detectJudgeName(); // Detect judge name first
  initializeScores();
  updateProgressIndicators();
  updateAllTotals();
};

// Backup initialization
document.addEventListener('DOMContentLoaded', function() {
  detectJudgeName(); // Detect judge name first
  if (!scores || Object.keys(scores).length === 0) {
    initializeScores();
    updateProgressIndicators();
    updateAllTotals();
  }
});
