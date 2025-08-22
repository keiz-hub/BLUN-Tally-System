
// storage.js
// Helpers for storing and computing scores using localStorage.

function scoreKey(judgeId, contestant){
  return `judge${judgeId}_${contestant}`;
}

window.getScore = function(judgeId, contestant){
  const raw = localStorage.getItem(scoreKey(judgeId, contestant));
  return raw ? JSON.parse(raw) : null;
};

window.saveScore = function(judgeId, contestant, scores){
  localStorage.setItem(scoreKey(judgeId, contestant), JSON.stringify(scores));
};

window.clearScore = function(judgeId, contestant){
  localStorage.removeItem(scoreKey(judgeId, contestant));
};

// Compute results across all judges
window.computeResults = function(){
  const results = []; // { contestant, total, average, judgeCount, perJudge: {id: {categoryTotals}} }

  CONFIG.contestants.forEach(contestant => {
    let total = 0;
    let judgeCount = 0;
    const perJudge = {};

    CONFIG.judges.forEach(j => {
      const s = getScore(j.id, contestant);
      if (s){
        judgeCount++;
        const perCatTotals = {};
        Object.keys(CONFIG.categories).forEach(cat => {
          const subs = CONFIG.categories[cat];
          const t = subs.reduce((sum, sub)=> sum + (Number(s?.[cat]?.[sub] || 0)), 0);
          perCatTotals[cat] = t;
          total += t;
        });
        perJudge[j.id] = perCatTotals;
      }
    });

    if (judgeCount > 0){
      results.push({
        contestant,
        total,
        average: total / judgeCount,
        judgeCount,
        perJudge
      });
    }
  });

  results.sort((a,b)=> b.total - a.total);
  return results;
};

window.exportResultsCSV = function(filename="pageant_results.csv"){
  const results = computeResults();
  let csv = "Rank,Contestant,Total,Average,";

  // category/judge headers
  Object.keys(CONFIG.categories).forEach(cat => {
    CONFIG.judges.forEach(j => {
      csv += `${cat} (${j.name}),`;
    });
  });
  csv += "\n";

  results.forEach((r, idx)=>{
    csv += `${idx+1},${r.contestant},${r.total.toFixed(1)},${r.average.toFixed(1)},`;
    Object.keys(CONFIG.categories).forEach(cat => {
      CONFIG.judges.forEach(j => {
        const val = r.perJudge?.[j.id]?.[cat] ?? 0;
        csv += `${Number(val).toFixed(1)},`;
      });
    });
    csv += "\n";
  });

  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
