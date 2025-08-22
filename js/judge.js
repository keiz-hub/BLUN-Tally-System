
// judge.js
(function(){
  const sel = document.getElementById("contestantSelect");
  const form = document.getElementById("formArea");
  const status = document.getElementById("status");

  function populateContestants(){
    sel.innerHTML = '<option value="">Select Contestant</option>';
    CONFIG.contestants.forEach(cn=>{
      const o = document.createElement("option");
      o.value = cn; o.textContent = cn;
      sel.appendChild(o);
    });
  }

  function buildForm(){
    form.innerHTML = "";
    Object.entries(CONFIG.categories).forEach(([cat, subs])=>{
      const card = document.createElement("div");
      card.className = "bg-white/10 rounded-xl p-5";
      let inner = `<h3 class="text-xl font-bold mb-3 border-b border-white/20 pb-2">${cat}</h3>`;
      subs.forEach(sub=>{
        inner += `
          <div class="mb-3">
            <label class="block text-sm mb-1">${sub}</label>
            <input type="number" min="0" max="10" step="0.1"
              class="w-full bg-white/20 text-white rounded px-3 py-2 border border-white/30"
              data-category="${cat}" data-subcategory="${sub}" placeholder="0-10">
          </div>`;
      });
      inner += `<div class="mt-3 p-2 bg-white/10 rounded"><span class="font-medium">Category Total: </span><span id="total-${cat.replace(/\s+/g,'')}">0.0</span></div>`;
      card.innerHTML = inner;
      form.appendChild(card);
    });

    form.addEventListener("input", ()=>{
      Object.keys(CONFIG.categories).forEach(cat=>{
        const inputs = form.querySelectorAll(`input[data-category="${cat}"]`);
        let t = 0;
        inputs.forEach(i => t += Number(i.value)||0);
        const el = document.getElementById(`total-${cat.replace(/\s+/g,'')}`);
        if (el) el.textContent = t.toFixed(1);
      });
    });
  }

  function loadExisting(contestant){
    const data = getScore(JUDGE_ID, contestant);
    if (!data) return;
    Object.entries(data).forEach(([cat, subs])=>{
      Object.entries(subs).forEach(([sub, val])=>{
        const inp = form.querySelector(`input[data-category="${cat}"][data-subcategory="${sub}"]`);
        if (inp) inp.value = Number(val);
      });
    });
    // trigger totals refresh
    form.dispatchEvent(new Event("input"));
  }

  function gatherScores(){
    const scores = {};
    Object.entries(CONFIG.categories).forEach(([cat, subs])=>{
      scores[cat] = {};
      subs.forEach(sub=>{
        const inp = form.querySelector(`input[data-category="${cat}"][data-subcategory="${sub}"]`);
        scores[cat][sub] = Number(inp.value)||0;
      });
    });
    return scores;
  }

  document.getElementById("btnSave").addEventListener("click", ()=>{
    const contestant = sel.value;
    if (!contestant){
      alert("Please select a contestant first.");
      return;
    }
    const scores = gatherScores();
    saveScore(JUDGE_ID, contestant, scores);
    status.textContent = `Saved scores for ${contestant} as ${JUDGE_NAME}.`;
    setTimeout(()=> status.textContent="", 2000);
  });

  sel.addEventListener("change", ()=>{
    buildForm();
    if (sel.value) loadExisting(sel.value);
  });

  // init
  populateContestants();
  buildForm();
})();
