window.onload = function() {
  const table = document.getElementById("judgeTable");
  const thead = table.querySelector("thead tr");

  // Add category headers
  categories.forEach(cat => {
    const th = document.createElement("th");
    th.textContent = cat.name;
    thead.appendChild(th);
  });

  // Add Total column
  const totalTh = document.createElement("th");
  totalTh.textContent = "Total";
  thead.appendChild(totalTh);

  // Populate rows
  const tbody = table.querySelector("tbody");
  contestants.forEach((contestant, rowIndex) => {
    const tr = document.createElement("tr");
    const tdName = document.createElement("td");
    tdName.textContent = contestant;
    tr.appendChild(tdName);

    let inputs = [];
    categories.forEach((cat, colIndex) => {
  const td = document.createElement("td");
  const input = document.createElement("input");
  input.type = "number";
  input.min = cat.min;
  input.max = cat.max;
  input.value = localStorage.getItem(`${JUDGE_NAME}_${contestant}_${cat.name}`) || "";
  
  // Restrict values dynamically
  input.oninput = () => {
    let val = parseFloat(input.value);
    if (val < cat.min) input.value = cat.min;
    if (val > cat.max) input.value = cat.max;
    localStorage.setItem(`${JUDGE_NAME}_${contestant}_${cat.name}`, input.value);
    updateTotal();
  };
  td.appendChild(input);
  tr.appendChild(td);
  inputs.push(input);
});


    const tdTotal = document.createElement("td");
    tdTotal.className = "total-cell";
    tr.appendChild(tdTotal);
    tbody.appendChild(tr);

    function updateTotal() {
      let sum = 0;
      inputs.forEach(input => sum += parseFloat(input.value) || 0);
      tdTotal.textContent = sum.toFixed(2);
    }
    updateTotal();
  });
};

// Export scores to CSV
function exportCSV() {
  let rows = [];
  let header = ["Contestant", ...categories.map(c => c.name), "Total"];
  rows.push(header);

  document.querySelectorAll("#judgeTable tbody tr").forEach(tr => {
    let row = [];
    row.push(tr.cells[0].textContent); // contestant name
    let sum = 0;
    categories.forEach((cat, idx) => {
      let val = tr.cells[idx+1].querySelector("input").value || "0";
      row.push(val);
      sum += parseFloat(val);
    });
    row.push(sum.toFixed(2));
    rows.push(row);
  });

  let csvContent = rows.map(e => e.join(",")).join("\\n");
  let blob = new Blob([csvContent], { type: "text/csv" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${JUDGE_NAME}_scores.csv`;
  link.click();
}
