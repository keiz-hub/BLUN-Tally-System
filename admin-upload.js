// Admin Upload Dashboard JavaScript
let uploadedFiles = [];
let processedData = {};
let compiledResults = {};
let allJudgesData = [];

// Categories mapping for validation
const EXPECTED_CATEGORIES = [
  'Evening Gown - Elegance',
  'Evening Gown - Fit', 
  'Evening Gown - Style',
  'Evening Gown - Poise',
  'Evening Gown - Overall',
  'Talent - Skill',
  'Talent - Creativity',
  'Talent - Stage Presence',
  'Talent - Entertainment',
  'Talent - Overall',
  'Interview - Confidence',
  'Interview - Articulation',
  'Interview - Content',
  'Interview - Personality',
  'Interview - Overall',
  'Swimwear - Fitness',
  'Swimwear - Confidence',
  'Swimwear - Posture',
  'Swimwear - Stage Walk',
  'Swimwear - Overall',
  'On-Stage Question - Quick Thinking',
  'On-Stage Question - Clarity',
  'On-Stage Question - Relevance',
  'On-Stage Question - Confidence',
  'On-Stage Question - Overall'
];

// Initialize drag and drop
function initializeDragDrop() {
  const uploadArea = document.getElementById('uploadArea');
  
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  
  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  });
}

// Handle file selection
function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  handleFiles(files);
}

// Handle files (from drag/drop or file input)
function handleFiles(files) {
  const csvFiles = files.filter(file => file.name.toLowerCase().endsWith('.csv'));
  
  if (csvFiles.length === 0) {
    showAlert('Please select CSV files only.', 'error');
    return;
  }
  
  csvFiles.forEach(file => {
    if (!uploadedFiles.find(f => f.name === file.name)) {
      uploadedFiles.push({
        file: file,
        name: file.name,
        size: file.size,
        uploadTime: new Date(),
        processed: false,
        judgeName: extractJudgeName(file.name),
        data: null
      });
    }
  });
  
  updateFilesList();
  updateButtons();
  showAlert(`${csvFiles.length} file(s) added successfully!`, 'success');
}

// Extract judge name from filename
function extractJudgeName(filename) {
  // Try to extract judge name from filename patterns like:
  // "Judge 1_complete_scores.csv", "judge-2-scores.csv", etc.
  const patterns = [
    /judge[\s_-]*(\d+)/i,
    /(\w+)[\s_-]*judge/i,
    /judge[\s_-]*(\w+)/i
  ];
  
  for (let pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      return `Judge ${match[1]}`;
    }
  }
  
  // Fallback: use filename without extension
  return filename.replace('.csv', '').replace(/[_-]/g, ' ');
}

// Update files list display
function updateFilesList() {
  const container = document.getElementById('uploadedFiles');
  
  if (uploadedFiles.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = uploadedFiles.map((fileInfo, index) => `
    <div class="file-item">
      <div class="file-info">
        <div class="file-icon">${fileInfo.processed ? '✅' : '📄'}</div>
        <div class="file-details">
          <h4>${fileInfo.name}</h4>
          <p>Judge: ${fileInfo.judgeName} • Size: ${formatFileSize(fileInfo.size)} • ${fileInfo.processed ? 'Processed' : 'Pending'}</p>
        </div>
      </div>
      <div class="file-actions">
        <button class="remove-btn" onclick="removeFile(${index})">Remove</button>
      </div>
    </div>
  `).join('');
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Remove file
function removeFile(index) {
  uploadedFiles.splice(index, 1);
  updateFilesList();
  updateButtons();
  
  if (uploadedFiles.length === 0) {
    clearProcessedData();
  }
}

// Update button states
function updateButtons() {
  const processBtn = document.getElementById('processBtn');
  const clearBtn = document.getElementById('clearBtn');
  const exportFinalBtn = document.getElementById('exportFinalBtn');
  const exportDetailedBtn = document.getElementById('exportDetailedBtn');
  
  const hasFiles = uploadedFiles.length > 0;
  const hasProcessedData = Object.keys(compiledResults).length > 0;
  
  processBtn.disabled = !hasFiles;
  clearBtn.disabled = !hasFiles;
  exportFinalBtn.disabled = !hasProcessedData;
  exportDetailedBtn.disabled = !hasProcessedData;
}

// Process all uploaded files
async function processAllFiles() {
  if (uploadedFiles.length === 0) {
    showAlert('No files to process.', 'warning');
    return;
  }
  
  const processBtn = document.getElementById('processBtn');
  processBtn.innerHTML = '🔄 Processing...';
  processBtn.disabled = true;
  
  try {
    allJudgesData = [];
    
    for (let fileInfo of uploadedFiles) {
      if (!fileInfo.processed) {
        const csvText = await readFileAsText(fileInfo.file);
        const parsedData = parseCSV(csvText, fileInfo.judgeName);
        
        if (parsedData) {
          fileInfo.data = parsedData;
          fileInfo.processed = true;
          allJudgesData.push(parsedData);
        }
      }
    }
    
    compileAllResults();
    updateAllDisplays();
    updateFilesList();
    updateButtons();
    
    showAlert(`Successfully processed ${uploadedFiles.length} file(s)!`, 'success');
    
  } catch (error) {
    showAlert(`Error processing files: ${error.message}`, 'error');
  } finally {
    processBtn.innerHTML = '🔄 Process All Files';
    processBtn.disabled = false;
  }
}

// Read file as text
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Parse CSV data
function parseCSV(csvText, judgeName) {
  try {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Invalid CSV format');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1);
    
    const judgeData = {
      judgeName: judgeName,
      contestants: {},
      categories: headers.slice(1, -1), // Exclude 'Contestant' and 'Total' columns
      rawData: []
    };
    
    dataRows.forEach(row => {
      const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length >= headers.length) {
        const contestant = values[0];
        const scores = values.slice(1, -1).map(v => parseFloat(v) || 0);
        const total = parseFloat(values[values.length - 1]) || 0;
        
        judgeData.contestants[contestant] = {
          scores: scores,
          total: total,
          categories: {}
        };
        
        // Map scores to categories
        scores.forEach((score, index) => {
          if (index < judgeData.categories.length) {
            judgeData.contestants[contestant].categories[judgeData.categories[index]] = score;
          }
        });
        
        judgeData.rawData.push({
          contestant: contestant,
          scores: scores,
          total: total
        });
      }
    });
    
    return judgeData;
    
  } catch (error) {
    throw new Error(`Failed to parse CSV for ${judgeName}: ${error.message}`);
  }
}

// Compile results from all judges
function compileAllResults() {
  compiledResults = {};
  
  // Get all unique contestants
  const allContestants = new Set();
  allJudgesData.forEach(judgeData => {
    Object.keys(judgeData.contestants).forEach(contestant => {
      allContestants.add(contestant);
    });
  });
  
  // Get all unique categories
  const allCategories = new Set();
  allJudgesData.forEach(judgeData => {
    judgeData.categories.forEach(category => {
      allCategories.add(category);
    });
  });
  
  // Initialize compiled results
  Array.from(allContestants).forEach(contestant => {
    compiledResults[contestant] = {
      totalScore: 0,
      averageScore: 0,
      judgeCount: 0,
      categoryScores: {},
      judgeScores: {}
    };
    
    Array.from(allCategories).forEach(category => {
      compiledResults[contestant].categoryScores[category] = {
        scores: [],
        average: 0,
        total: 0
      };
    });
  });
  
  // Compile scores from all judges
  allJudgesData.forEach(judgeData => {
    Object.keys(judgeData.contestants).forEach(contestant => {
      const contestantData = judgeData.contestants[contestant];
      
      compiledResults[contestant].judgeScores[judgeData.judgeName] = {
        total: contestantData.total,
        categories: contestantData.categories
      };
      
      compiledResults[contestant].judgeCount++;
      compiledResults[contestant].totalScore += contestantData.total;
      
      // Add category scores
      Object.keys(contestantData.categories).forEach(category => {
        const score = contestantData.categories[category];
        if (compiledResults[contestant].categoryScores[category]) {
          compiledResults[contestant].categoryScores[category].scores.push({
            judge: judgeData.judgeName,
            score: score
          });
        }
      });
    });
  });
  
  // Calculate averages
  Object.keys(compiledResults).forEach(contestant => {
    const data = compiledResults[contestant];
    
    if (data.judgeCount > 0) {
      data.averageScore = data.totalScore / data.judgeCount;
    }
    
    Object.keys(data.categoryScores).forEach(category => {
      const categoryData = data.categoryScores[category];
      if (categoryData.scores.length > 0) {
        categoryData.total = categoryData.scores.reduce((sum, item) => sum + item.score, 0);
        categoryData.average = categoryData.total / categoryData.scores.length;
      }
    });
  });
}

// Show page
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
  
  // Update page content if needed
  if (pageId !== 'upload' && Object.keys(compiledResults).length > 0) {
    updateAllDisplays();
  }
}

// Update all displays
function updateAllDisplays() {
  updateOverview();
  updateRankings();
  updateDetailedScores();
}

// Update overview
function updateOverview() {
  const contestants = Object.keys(compiledResults);
  const judges = allJudgesData.length;
  const categories = allJudgesData.length > 0 ? allJudgesData[0].categories.length : 0;
  
  let leadingContestant = '-';
  let highestScore = 0;
  
  contestants.forEach(contestant => {
    if (compiledResults[contestant].averageScore > highestScore) {
      highestScore = compiledResults[contestant].averageScore;
      leadingContestant = contestant;
    }
  });
  
  document.getElementById('totalJudges').textContent = judges;
  document.getElementById('totalContestants').textContent = contestants.length;
  document.getElementById('totalCategories').textContent = categories;
  document.getElementById('leadingContestant').textContent = leadingContestant;
  
  // Update overview content
  const overviewContent = document.getElementById('overviewContent');
  
  if (contestants.length === 0) {
    overviewContent.innerHTML = `
      <div class="empty-state">
        <h3>No Data Available</h3>
        <p>Upload judge score files to see the competition overview</p>
      </div>
    `;
    return;
  }
  
  const categories = allJudgesData.length > 0 ? allJudgesData[0].categories : [];
  
  overviewContent.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Contestant</th>
          ${categories.map(cat => `<th>${cat}</th>`).join('')}
          <th>Average Total</th>
          <th>Judge Count</th>
        </tr>
      </thead>
      <tbody>
        ${contestants.map(contestant => {
          const data = compiledResults[contestant];
          return `
            <tr>
              <td><strong>${contestant}</strong></td>
              ${categories.map(category => {
                const categoryData = data.categoryScores[category];
                return `<td>${categoryData ? categoryData.average.toFixed(1) : '0.0'}</td>`;
              }).join('')}
              <td class="average-score">${data.averageScore.toFixed(1)}</td>
              <td>${data.judgeCount}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

// Update rankings
function updateRankings() {
  const rankingsContent = document.getElementById('rankingsContent');
  const contestants = Object.keys(compiledResults);
  
  if (contestants.length === 0) {
    rankingsContent.innerHTML = `
      <div class="empty-state">
        <h3>No Rankings Available</h3>
        <p>Process judge score files to generate final rankings</p>
      </div>
    `;
    return;
  }
  
  // Sort contestants by average score
  const sortedContestants = contestants.sort((a, b) => {
    return compiledResults[b].averageScore - compiledResults[a].averageScore;
  });
  
  rankingsContent.innerHTML = `
    <table class="ranking-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Contestant</th>
          <th>Average Score</th>
          <th>Total Score</th>
          <th>Judge Count</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${sortedContestants.map((contestant, index) => {
          const rank = index + 1;
          const data = compiledResults[contestant];
          
          let rankClass = '';
          let crown = '';
          if (rank === 1) {
            rankClass = 'rank-1';
            crown = '<span class="crown">👑</span>';
          } else if (rank === 2) {
            rankClass = 'rank-2';
            crown = '<span class="crown">🥈</span>';
          } else if (rank === 3) {
            rankClass = 'rank-3';
            crown = '<span class="crown">🥉</span>';
          }
          
          return `
            <tr class="${rankClass}">
              <td>${crown}${rank}</td>
              <td><strong>${contestant}</strong></td>
              <td>${data.averageScore.toFixed(2)}</td>
              <td>${data.totalScore.toFixed(2)}</td>
              <td>${data.judgeCount}</td>
              <td>${data.judgeCount > 0 ? 'Complete' : 'Pending'}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

// Update detailed scores
function updateDetailedScores() {
  const detailedContent = document.getElementById('detailedContent');
  const contestants = Object.keys(compiledResults);
  
  if (contestants.length === 0 || allJudgesData.length === 0) {
    detailedContent.innerHTML = `
      <div class="empty-state">
        <h3>No Detailed Scores Available</h3>
        <p>Upload and process judge files to view detailed scoring breakdown</p>
      </div>
    `;
    return;
  }
  
  const categories = allJudgesData[0].categories;
  
  detailedContent.innerHTML = `
    <div class="detailed-scores">
      <table>
        <thead>
          <tr>
            <th rowspan="2">Judge</th>
            <th rowspan="2">Contestant</th>
            ${categories.map(category => `<th>${category}</th>`).join('')}
            <th rowspan="2">Total</th>
          </tr>
        </thead>
        <tbody>
          ${allJudgesData.map(judgeData => {
            return Object.keys(judgeData.contestants).map(contestant => {
              const contestantData = judgeData.contestants[contestant];
              return `
                <tr>
                  <td>${judgeData.judgeName}</td>
                  <td><strong>${contestant}</strong></td>
                  ${categories.map(category => {
                    const score = contestantData.categories[category] || 0;
                    return `<td>${score > 0 ? score.toFixed(1) : '-'}</td>`;
                  }).join('')}
                  <td class="average-score">${contestantData.total.toFixed(1)}</td>
                </tr>
              `;
            }).join('');
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Export final results
function exportFinalResults() {
  const contestants = Object.keys(compiledResults);
  if (contestants.length === 0) {
    showAlert('No data to export.', 'warning');
    return;
  }
  
  const sortedContestants = contestants.sort((a, b) => {
    return compiledResults[b].averageScore - compiledResults[a].averageScore;
  });
  
  const categories = allJudgesData.length > 0 ? allJudgesData[0].categories : [];
  
  let csvContent = `Rank,Contestant,Average Score,Total Score,Judge Count,${categories.join(',')}\n`;
  
  sortedContestants.forEach((contestant, index) => {
    const rank = index + 1;
    const data = compiledResults[contestant];
    
    const categoryScores = categories.map(category => {
      const categoryData = data.categoryScores[category];
      return categoryData ? categoryData.average.toFixed(2) : '0.00';
    });
    
    const row = [
      rank,
      contestant,
      data.averageScore.toFixed(2),
      data.totalScore.toFixed(2),
      data.judgeCount,
      ...categoryScores
    ];
    
    csvContent += row.join(',') + '\n';
  });
  
  downloadCSV(csvContent, 'pageant_final_results.csv');
}

// Export detailed report
function exportDetailedReport() {
  if (allJudgesData.length === 0) {
    showAlert('No data to export.', 'warning');
    return;
  }
  
  const categories = allJudgesData[0].categories;
  let csvContent = `Judge,Contestant,${categories.join(',')},Total\n`;
  
  allJudgesData.forEach(judgeData => {
    Object.keys(judgeData.contestants).forEach(contestant => {
      const contestantData = judgeData.contestants[contestant];
      
      const categoryScores = categories.map(category => {
        const score = contestantData.categories[category] || 0;
        return score.toFixed(2);
      });
      
      const row = [
        judgeData.judgeName,
        contestant,
        ...categoryScores,
        contestantData.total.toFixed(2)
      ];
      
      csvContent += row.join(',') + '\n';
    });
  });
  
  downloadCSV(csvContent, 'pageant_detailed_report.csv');
}

// Download CSV helper
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
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

// Clear all files
function clearAllFiles() {
  if (confirm('Are you sure you want to remove all uploaded files?')) {
    uploadedFiles = [];
    clearProcessedData();
    updateFilesList();
    updateButtons();
    showAlert('All files cleared.', 'success');
  }
}

// Clear processed data
function clearProcessedData() {
  processedData = {};
  compiledResults = {};
  allJudgesData = [];
  
  // Reset displays
  document.getElementById('overviewContent').innerHTML = `
    <div class="empty-state">
      <h3>No Data Available</h3>
      <p>Upload judge score files to see the competition overview</p>
    </div>
  `;
  
  document.getElementById('rankingsContent').innerHTML = `
    <div class="empty-state">
      <h3>No Rankings Available</h3>
      <p>Process judge score files to generate final rankings</p>
    </div>
  `;
  
  document.getElementById('detailedContent').innerHTML = `
    <div class="empty-state">
      <h3>No Detailed Scores Available</h3>
      <p>Upload and process judge files to view detailed scoring breakdown</p>
    </div>
  `;
}

// Show alert
function showAlert(message, type) {
  const alertContainer = document.getElementById('alertContainer');
  const alertClass = `alert-${type}`;
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert ${alertClass}`;
  alertDiv.textContent = message;
  
  alertContainer.appendChild(alertDiv);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.parentNode.removeChild(alertDiv);
    }
  }, 5000);
}

// Initialize on page load
window.onload = function() {
  initializeDragDrop();
  updateButtons();
};

// Backup initialization
document.addEventListener('DOMContentLoaded', function() {
  initializeDragDrop();
  updateButtons();
});
