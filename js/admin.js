
// admin.js
const STATIC_PASSWORD = "BLUN2025!"; // <-- change this
const loginGate = document.getElementById("loginGate");
const adminContent = document.getElementById("adminContent");
const loginMsg = document.getElementById("loginMsg");
document.getElementById("btnLogin").addEventListener("click", ()=>{
  const p = (document.getElementById("adminPass").value || "").trim();
  if (p === STATIC_PASSWORD){
    sessionStorage.setItem("admin_logged_in", "1");
    loginGate.classList.add("hidden");
    adminContent.classList.remove("hidden");
    renderAll();
  } else {
    loginMsg.textContent = "Wrong password.";
  }
});

(function checkLoggedIn(){
  if (sessionStorage.getItem("admin_logged_in")==="1"){
    loginGate.classList.add("hidden");
    adminContent.classList.remove("hidden");
    renderAll();
  }
})();

function renderJudgeList(){
  const box = document.getElementById("judgeList");
  box.innerHTML = "";
  CONFIG.judges.forEach(j => {
    const row = document.createElement("div");
    row.className = "flex items-center justify-between bg-white/10 rounded px-3 py-2";
    row.innerHTML = `<span>${j.name} (ID ${j.id})</span>
      <button class="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-sm">Remove</button>`;
    row.querySelector("button").addEventListener("click", ()=>{
      if (confirm("Remove this judge? Scores from this judge will be kept but hidden unless you delete them manually via browser storage.")){
        CONFIG.judges = CONFIG.judges.filter(x => x.id !== j.id);
        saveConfig();
        renderAll();
      }
    });
    box.appendChild(row);
  });
}

function renderContestantList(){
  const box = document.getElementById("contestantList");
  box.innerHTML = "";
  CONFIG.contestants.forEach(name => {
    const row = document.createElement("div");
    row.className = "flex items-center justify-between bg-white/10 rounded px-3 py-2";
    row.innerHTML = `<span>${name}</span>
      <button class="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-sm">Remove</button>`;
    row.querySelector("button").addEventListener("click", ()=>{
      if (confirm("Remove this contestant and delete their scores from all judges?")){
        // delete all their scores
        CONFIG.judges.forEach(j => {
          localStorage.removeItem(`judge${j.id}_${name}`);
        });
        CONFIG.contestants = CONFIG.contestants.filter(x => x !== name);
        saveConfig();
        renderAll();
      }
    });
    box.appendChild(row);
  });
}

document.getElementById("addJudge").addEventListener("click", ()=>{
  const name = (document.getElementById("judgeName").value || "").trim();
  if (!name) return;
  const maxId = CONFIG.judges.reduce((m,j)=> Math.max(m,j.id), 0) || 0;
  CONFIG.judges.push({ id: maxId+1, name });
  document.getElementById("judgeName").value = "";
  saveConfig();
  renderAll();
  alert("Judge added. Duplicate judge1.html to judge" + (maxId+1) + ".html then open that file and set JUDGE_ID/JUDGE_NAME to match.");
});

document.getElementById("addContestant").addEventListener("click", ()=>{
  const name = (document.getElementById("contestantName").value || "").trim();
  if (!name) return;
  if (CONFIG.contestants.includes(name)){
    alert("Contestant already exists.");
    return;
  }
  CONFIG.contestants.push(name);
  document.getElementById("contestantName").value = "";
  saveConfig();
  renderAll();
});

document.getElementById("btnExport").addEventListener("click", ()=> exportResultsCSV());
document.getElementById("btnClear").addEventListener("click", ()=>{
  if (confirm("Clear ALL scores from ALL judges? This cannot be undone.")){
    // iterate likely keys
    CONFIG.judges.forEach(j => {
      CONFIG.contestants.forEach(c => localStorage.removeItem(`judge${j.id}_${c}`));
    });
    alert("Cleared.");
    renderResults();
  }
});
document.getElementById("btnResetConfig").addEventListener("click", ()=>{
  if (confirm("Reset config to defaults? Judges beyond #1 will disappear (scores remain in storage).")){
    resetConfig();
    renderAll();
  }
});

function renderResults(){
  const tbody = document.getElementById("resultsBody");
  tbody.innerHTML = "";
  const res = computeResults();
  res.forEach((r, idx)=>{
    const tr = document.createElement("tr");
    tr.className = "border-b border-white/10";
    const rankLabel = idx===0?"🥇 1st": idx===1?"🥈 2nd": idx===2?"🥉 3rd": (idx+1);
    const detailsBtnId = `btn_${idx}`;
    tr.innerHTML = `
      <td class="py-3 px-4">${rankLabel}</td>
      <td class="py-3 px-4 font-medium">${r.contestant}</td>
      <td class="py-3 px-4 font-bold text-purple-300">${r.total.toFixed(1)}</td>
      <td class="py-3 px-4">${r.average.toFixed(1)}</td>
      <td class="py-3 px-4"><button id="${detailsBtnId}" class="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-sm">Details</button></td>`;
    tbody.appendChild(tr);
    document.getElementById(detailsBtnId).addEventListener("click", ()=>{
      let msg = `Details for ${r.contestant}\n\n`;
      CONFIG.judges.forEach(j => {
        if (r.perJudge[j.id]){
          msg += `${j.name}:\n`;
          Object.keys(CONFIG.categories).forEach(cat => {
            const v = r.perJudge[j.id][cat] ?? 0;
            msg += `  ${cat}: ${Number(v).toFixed(1)}\n`;
          });
          msg += "\n";
        }
      });
      alert(msg);
    });
  });
}

function renderAll(){
  renderJudgeList();
  renderContestantList();
  renderResults();
}

