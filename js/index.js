
// index.js
function renderJudgeLinks(){
  const c = document.getElementById("judgeLinks");
  c.innerHTML = "";
  CONFIG.judges.forEach(j => {
    const a = document.createElement("a");
    const file = `judge${j.id}.html`; // convention
    a.href = file;
    a.textContent = j.name;
    a.className = "px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-center";
    c.appendChild(a);
  });
}

function renderResults(){
  const tbody = document.getElementById("resultsBody");
  tbody.innerHTML = "";
  const res = computeResults();
  res.forEach((r, idx)=>{
    const tr = document.createElement("tr");
    tr.className = "border-b border-white/10";
    let rankLabel = `${idx+1}`;
    if (idx===0) rankLabel = "🥇 1st";
    else if (idx===1) rankLabel = "🥈 2nd";
    else if (idx===2) rankLabel = "🥉 3rd";
    tr.innerHTML = `
      <td class="py-3 px-4">${rankLabel}</td>
      <td class="py-3 px-4 font-medium">${r.contestant}</td>
      <td class="py-3 px-4 font-bold text-purple-300">${r.total.toFixed(1)}</td>
      <td class="py-3 px-4">${r.average.toFixed(1)}</td>
    `;
    tbody.appendChild(tr);
  });
  const ts = new Date().toLocaleString();
  document.getElementById("lastUpdated").textContent = `Updated: ${ts}`;
}

document.getElementById("btnExport").addEventListener("click", ()=> exportResultsCSV());

renderJudgeLinks();
renderResults();
setInterval(renderResults, 5000); // auto-refresh every 5s
