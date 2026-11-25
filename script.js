(() => {
  "use strict";
  const STORAGE_KEY = "midia-patrimonio-v1";
  const initialAssets = [
    ["HDMI","Cabos e conexões",6],
    ["Cabo A pra B","Cabos e conexões",2],
    ["Cabo fonte PTZ","Cabos e conexões",1],
    ["Gabinete","Computadores e periféricos",1],
    ["Monitor","Computadores e periféricos",1],
    ["Mouse","Computadores e periféricos",3],
    ["Mousepad","Computadores e periféricos",2],
    ["Teclado","Computadores e periféricos",1],
    ["TV","Vídeo e câmeras",3],
    ["Controle de TV","Vídeo e câmeras",2],
    ["Controle de câmera PTZ","Vídeo e câmeras",1],
    ["Estabilizador","Energia",1],
    ["Webcam Spedal","Vídeo e câmeras",1],
    ["Câmera PTZ","Vídeo e câmeras",1],
    ["Cabo de rede","Cabos e conexões",2],
    ["Splitter HDMI 1x4","Vídeo e câmeras",1],
    ["Cabo fonte do splitter","Cabos e conexões",1],
    ["Cabo VGA","Cabos e conexões",1],
    ["Organizador","Acessórios",1],
    ["Mesinha dos obreiros","Mobiliário",1],
    ["Mesa","Mobiliário",1]
  ].map((item,index) => ({
    id: "a" + (index + 1),
    name: item[0], category: item[1], quantity: item[2],
    patrimony: "", url: "", condition: item[0] === "Estabilizador" ? "Danificado" : "Não informado",
    notes: item[0] === "Estabilizador" ? "Informado como quebrado na relação inicial." : ""
  }));

  let state = loadState();
  let toastTimer;
  const $ = (id) => document.getElementById(id);
  const money = (value) => Number(value || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const uid = () => "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  function safeUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try { const parsed = new URL(raw); return ["http:","https:"].includes(parsed.protocol) ? parsed.href : ""; }
    catch { return ""; }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.assets) && Array.isArray(parsed.purchases)) return parsed;
      }
    } catch (error) { console.warn("Não foi possível ler os dados locais.", error); }
    return {assets: initialAssets, purchases: []};
  }
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      document.querySelector(".save-state").innerHTML = "<i></i> Salvo neste dispositivo";
    } catch (error) {
      showToast("Não foi possível salvar. Exporte um backup e libere espaço no navegador.");
      console.error(error);
    }
  }
  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }
  function categoryOptions() {
    const categories = [...new Set(state.assets.map(a => a.category).filter(Boolean))].sort();
    const select = $("categoryFilter");
    const current = select.value;
    select.innerHTML = '<option value="">Todas as categorias</option>' + categories.map(c => '<option value="' + escapeHTML(c) + '">' + escapeHTML(c) + '</option>').join("");
    select.value = categories.includes(current) ? current : "";
  }
  function setView(name) {
    document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + name));
    document.querySelectorAll(".nav-link[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === name));
    const labels = {overview:"Visão geral",inventory:"Inventário",purchases:"Plano de compras"};
    $("breadcrumbCurrent").textContent = labels[name] || labels.overview;
    $("sidebar").classList.remove("open");
    window.scrollTo({top:0,behavior:"smooth"});
    if (document.body.classList.contains("presentation-mode")) exitPresentation();
  }
  function conditionClass(condition) {
    return {"Bom":"condition-good","Regular":"condition-regular","Danificado":"condition-damaged","Em manutenção":"condition-maintenance"}[condition] || "condition-unknown";
  }
  function renderInventory() {
    categoryOptions();
    const query = $("inventorySearch").value.trim().toLocaleLowerCase("pt-BR");
    const category = $("categoryFilter").value;
    const condition = $("conditionFilter").value;
    const rows = state.assets.filter(a =>
      (!query || (a.name + " " + a.patrimony + " " + a.category).toLocaleLowerCase("pt-BR").includes(query)) &&
      (!category || a.category === category) && (!condition || a.condition === condition)
    );
    $("inventoryResultCount").textContent = rows.length + (rows.length === 1 ? " registro" : " registros");
    $("inventoryEmpty").classList.toggle("hidden", rows.length > 0);
    $("inventoryBody").innerHTML = rows.map(a => `
      <tr data-asset-row="${escapeHTML(a.id)}">
        <td><input class="inline-field patrimony-input" data-asset-field="patrimony" data-id="${escapeHTML(a.id)}" aria-label="Número patrimonial" value="${escapeHTML(a.patrimony || "")}" placeholder="Digitar patrimônio"></td>
        <td><input class="inline-field name-field" data-asset-field="name" data-id="${escapeHTML(a.id)}" aria-label="Nome do equipamento" value="${escapeHTML(a.name)}"><input class="inline-field note-field" data-asset-field="notes" data-id="${escapeHTML(a.id)}" value="${escapeHTML(a.notes || "")}" placeholder="Observação (opcional)" aria-label="Observações do equipamento"></td>
        <td><select class="inline-field" data-asset-field="category" data-id="${escapeHTML(a.id)}">${["Cabos e conexões","Computadores e periféricos","Vídeo e câmeras","Áudio","Energia","Mobiliário","Acessórios","Outros"].map(c=>'<option '+(a.category===c?'selected':'')+'>'+c+'</option>').join("")}</select></td>
        <td><input class="inline-field qty-input" data-asset-field="quantity" data-id="${escapeHTML(a.id)}" type="number" min="1" step="1" value="${Number(a.quantity)}" aria-label="Quantidade"></td>
        <td><select class="inline-field" data-asset-field="condition" data-id="${escapeHTML(a.id)}">${["Não informado","Bom","Regular","Danificado","Em manutenção"].map(c=>'<option '+((a.condition||"Não informado")===c?'selected':'')+'>'+c+'</option>').join("")}</select></td>
        <td><div class="link-editor"><input class="inline-field url-field" data-asset-field="url" data-id="${escapeHTML(a.id)}" type="url" value="${escapeHTML(a.url || "")}" placeholder="Colar link aqui"><a class="open-link ${a.url ? "" : "is-disabled"}" href="${a.url ? escapeHTML(a.url) : "#"}" target="_blank" rel="noopener noreferrer" ${a.url ? "" : 'aria-disabled="true"'}>↗ Abrir</a></div></td>
        <td><div class="row-actions"><button class="icon-button delete-button" data-delete-asset="${escapeHTML(a.id)}" title="Excluir" aria-label="Excluir">×</button></div></td>
      </tr>`).join("");
    $("inventoryNavCount").textContent = state.assets.length;
  }
  function priorityClass(priority) { return {"Alta":"high","Média":"medium","Baixa":"low"}[priority] || "medium"; }
  function renderPurchases() {
    const query = $("purchaseSearch").value.trim().toLocaleLowerCase("pt-BR");
    const priority = $("priorityFilter").value;
    const status = $("purchaseStatusFilter").value;
    const rows = state.purchases.filter(p =>
      (!query || (p.name + " " + (p.notes || "")).toLocaleLowerCase("pt-BR").includes(query)) &&
      (!priority || p.priority === priority) && (!status || p.status === status)
    ).sort((a,b) => ({"Alta":0,"Média":1,"Baixa":2}[a.priority] - {"Alta":0,"Média":1,"Baixa":2}[b.priority]));
    $("purchasesBody").innerHTML = rows.map(p => {
      const total = Number(p.quantity) * Number(p.value);
      return `<tr data-purchase-row="${escapeHTML(p.id)}">
        <td><select class="inline-field priority-field" data-purchase-field="priority" data-id="${escapeHTML(p.id)}"><option ${p.priority==="Alta"?"selected":""}>Alta</option><option ${p.priority==="Média"?"selected":""}>Média</option><option ${p.priority==="Baixa"?"selected":""}>Baixa</option></select></td>
        <td><input class="inline-field name-field" data-purchase-field="name" data-id="${escapeHTML(p.id)}" value="${escapeHTML(p.name)}" aria-label="Nome do item"><input class="inline-field note-field" data-purchase-field="notes" data-id="${escapeHTML(p.id)}" value="${escapeHTML(p.notes || "")}" placeholder="Observação (opcional)" aria-label="Observações da compra"></td>
        <td><input class="inline-field qty-input" data-purchase-field="quantity" data-id="${escapeHTML(p.id)}" type="number" min="1" step="1" value="${Number(p.quantity)}" aria-label="Quantidade"></td>
        <td><input class="inline-field money-input" data-purchase-field="value" data-id="${escapeHTML(p.id)}" type="number" min="0" step="0.01" value="${Number(p.value)}" aria-label="Valor unitário em reais"></td>
        <td class="money" data-purchase-total="${escapeHTML(p.id)}">${money(total)}</td>
        <td><select class="inline-field" data-purchase-field="status" data-id="${escapeHTML(p.id)}"><option ${p.status==="Pendente"?"selected":""}>Pendente</option><option ${p.status==="Comprado"?"selected":""}>Comprado</option></select></td>
        <td><div class="link-editor"><input class="inline-field url-field" data-purchase-field="url" data-id="${escapeHTML(p.id)}" type="url" value="${escapeHTML(p.url || "")}" placeholder="Colar link aqui"><a class="open-link ${p.url ? "" : "is-disabled"}" href="${p.url ? escapeHTML(p.url) : "#"}" target="_blank" rel="noopener noreferrer" ${p.url ? "" : 'aria-disabled="true"'}>↗ Abrir</a></div></td>
        <td><div class="row-actions"><button class="icon-button delete-button" data-delete-purchase="${escapeHTML(p.id)}" title="Excluir" aria-label="Excluir">×</button></div></td>
      </tr>`;
    }).join("");
    $("purchasesEmpty").classList.toggle("hidden", rows.length > 0);
    $("purchaseResultCount").textContent = rows.length + (rows.length === 1 ? " item" : " itens");
    $("purchaseNavCount").textContent = state.purchases.length;
    const total = state.purchases.reduce((sum,p) => sum + Number(p.quantity) * Number(p.value),0);
    $("purchaseTotal").textContent = money(total);
    $("purchaseCount").textContent = state.purchases.length;
    $("highPriorityCount").textContent = state.purchases.filter(p => p.priority === "Alta" && p.status !== "Comprado").length;
    $("purchasedCount").textContent = state.purchases.filter(p => p.status === "Comprado").length;
  }
  function renderOverview() {
    const assets = state.assets;
    $("statTypes").textContent = assets.length;
    $("statUnits").textContent = assets.reduce((n,a) => n + Number(a.quantity),0);
    $("statPending").textContent = assets.filter(a => !String(a.patrimony || "").trim()).length;
    $("statDamaged").textContent = assets.filter(a => ["Danificado","Em manutenção"].includes(a.condition)).length;
    const purchases = [...state.purchases].filter(p => p.status !== "Comprado").sort((a,b) => ({"Alta":0,"Média":1,"Baixa":2}[a.priority] - {"Alta":0,"Média":1,"Baixa":2}[b.priority])).slice(0,4);
    $("overviewPurchases").innerHTML = purchases.length ? purchases.map(p => `<div class="mini-row"><div><strong>${escapeHTML(p.name)}</strong><small>${escapeHTML(p.priority)} prioridade · ${Number(p.quantity)} un.</small></div><span class="mini-value">${money(Number(p.quantity)*Number(p.value))}</span></div>`).join("") : '<div class="empty-hint">Nenhuma compra planejada. Cadastre as necessidades no plano de compras.</div>';
    const conditions = ["Bom","Regular","Danificado","Em manutenção","Não informado"];
    const total = assets.reduce((n,a) => n + Number(a.quantity),0) || 1;
    $("conditionSummary").innerHTML = conditions.map(c => {
      const count = assets.filter(a => a.condition === c).reduce((n,a) => n + Number(a.quantity),0);
      return `<div class="condition-line"><span>${c}</span><div class="track"><span style="width:${Math.round(count/total*100)}%"></span></div><b>${count}</b></div>`;
    }).join("");
  }
  function render() { renderInventory(); renderPurchases(); renderOverview(); $("footerYear").textContent = new Date().getFullYear(); }
  function openModal(id) { $(id).classList.remove("hidden"); document.body.style.overflow = "hidden"; }
  function closeModal(id) { $(id).classList.add("hidden"); document.body.style.overflow = ""; }
  function editAsset(id) {
    const a = state.assets.find(x => x.id === id);
    if (!a) return;
    $("assetModalTitle").textContent = "Editar equipamento";
    $("assetId").value = a.id; $("assetName").value = a.name; $("assetCategory").value = a.category;
    $("assetQuantity").value = a.quantity; $("assetPatrimony").value = a.patrimony || ""; $("assetUrl").value = a.url || "";
    $("assetCondition").value = a.condition || "Não informado"; $("assetNotes").value = a.notes || "";
    openModal("assetModal");
  }
  function editPurchase(id) {
    const p = state.purchases.find(x => x.id === id);
    if (!p) return;
    $("purchaseModalTitle").textContent = "Editar compra";
    $("purchaseId").value = p.id; $("purchaseName").value = p.name; $("purchasePriority").value = p.priority;
    $("purchaseQuantity").value = p.quantity; $("purchaseValue").value = p.value;
    $("purchaseStatus").value = p.status; $("purchaseUrl").value = p.url || ""; $("purchaseNotes").value = p.notes || "";
    openModal("purchaseModal");
  }
  function resetAssetForm() { $("assetForm").reset(); $("assetId").value = ""; $("assetQuantity").value = 1; $("assetModalTitle").textContent = "Adicionar equipamento"; }
  function resetPurchaseForm() { $("purchaseForm").reset(); $("purchaseId").value = ""; $("purchaseQuantity").value = 1; $("purchasePriority").value = "Média"; $("purchaseStatus").value = "Pendente"; $("purchaseModalTitle").textContent = "Adicionar compra"; }

  document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click",() => setView(b.dataset.view)));
  document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click",() => setView(b.dataset.go)));
  $("mobileMenu").addEventListener("click",() => $("sidebar").classList.toggle("open"));
  $("addAssetButton").addEventListener("click",() => { resetAssetForm(); openModal("assetModal"); });
  $("addPurchaseButton").addEventListener("click",() => { resetPurchaseForm(); openModal("purchaseModal"); });
  document.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click",() => closeModal(b.dataset.close)));
  document.querySelectorAll(".modal-backdrop").forEach(backdrop => backdrop.addEventListener("click",e => { if (e.target === backdrop) closeModal(backdrop.id); }));
  $("assetForm").addEventListener("submit",e => {
    e.preventDefault();
    const id = $("assetId").value;
    const record = {id:id || uid(),name:$("assetName").value.trim(),category:$("assetCategory").value,quantity:Math.max(1,Number($("assetQuantity").value)),patrimony:$("assetPatrimony").value.trim(),url:safeUrl($("assetUrl").value),condition:$("assetCondition").value,notes:$("assetNotes").value.trim()};
    if (!record.name || !record.category) return;
    if (id) state.assets = state.assets.map(a => a.id === id ? record : a); else state.assets.push(record);
    saveState(); render(); closeModal("assetModal"); showToast(id ? "Equipamento atualizado." : "Equipamento adicionado.");
  });
  $("purchaseForm").addEventListener("submit",e => {
    e.preventDefault();
    const id = $("purchaseId").value;
    const record = {id:id || uid(),name:$("purchaseName").value.trim(),priority:$("purchasePriority").value,quantity:Math.max(1,Number($("purchaseQuantity").value)),value:Math.max(0,Number($("purchaseValue").value)),status:$("purchaseStatus").value,url:safeUrl($("purchaseUrl").value),notes:$("purchaseNotes").value.trim()};
    if (!record.name) return;
    if (id) state.purchases = state.purchases.map(p => p.id === id ? record : p); else state.purchases.push(record);
    saveState(); render(); closeModal("purchaseModal"); showToast(id ? "Compra atualizada." : "Compra adicionada.");
  });
  function savePatrimonyField(input, notify = false) {
    const asset = state.assets.find(a => a.id === input.dataset.patrimony);
    if (!asset) return;
    const value = input.value.trim();
    if (asset.patrimony === value) return;
    asset.patrimony = value;
    saveState();
    renderOverview();
    if (notify) showToast("Número patrimonial salvo.");
  }
  // O número patrimonial é editado diretamente na célula, sem abrir o formulário do lápis.
  $("inventoryBody").addEventListener("input",e => {
    const input = e.target.closest("[data-patrimony]");
    if (input) savePatrimonyField(input);
  });
  $("inventoryBody").addEventListener("change",e => {
    const input = e.target.closest("[data-patrimony]");
    if (input) {
      savePatrimonyField(input, true);
      input.value = input.value.trim();
    }
  });
  $("inventoryBody").addEventListener("keydown",e => {
    const input = e.target.closest("[data-patrimony]");
    if (input && e.key === "Enter") {
      e.preventDefault();
      input.blur();
    }
  });
  function updateInlineField(kind, input) {
    const id = input.dataset.id;
    const field = input.dataset[kind + "Field"];
    const list = kind === "asset" ? state.assets : state.purchases;
    const record = list.find(item => item.id === id);
    if (!record || !field) return;
    let value = input.value;
    if (field === "url") {
      value = safeUrl(value);
      if (input.value.trim() && !value) {
        input.setCustomValidity("Insira um link começando com https:// ou http://");
        input.reportValidity();
        return;
      }
      input.setCustomValidity("");
    } else if (field === "quantity") {
      value = Math.max(1, Math.floor(Number(value) || 1));
      input.value = value;
    } else if (field === "value") {
      value = Math.max(0, Number(value) || 0);
      input.value = value;
    } else {
      value = String(value).trim();
    }
    if (record[field] === value) return;
    record[field] = value;
    saveState();
    if (kind === "asset") renderOverview();
    else {
      const row = input.closest("tr");
      const totalCell = row && row.querySelector("[data-purchase-total]");
      if (totalCell) totalCell.textContent = money(Number(record.quantity) * Number(record.value));
      const urlLink = row && row.querySelector(".open-link");
      if (urlLink && field === "url") {
        urlLink.href = value || "#";
        urlLink.classList.toggle("is-disabled", !value);
        urlLink.setAttribute("aria-disabled", value ? "false" : "true");
      }
      renderOverview();
      const total = state.purchases.reduce((sum,p) => sum + Number(p.quantity) * Number(p.value),0);
      $("purchaseTotal").textContent = money(total);
      $("highPriorityCount").textContent = state.purchases.filter(p => p.priority === "Alta" && p.status !== "Comprado").length;
      $("purchasedCount").textContent = state.purchases.filter(p => p.status === "Comprado").length;
    }
    if (field === "url") {
      const row = input.closest("tr");
      const link = row && row.querySelector(".open-link");
      if (link) {
        link.href = value || "#";
        link.classList.toggle("is-disabled", !value);
        link.setAttribute("aria-disabled", value ? "false" : "true");
      }
    }
    showToast("Alteração salva.");
  }
  $("inventoryBody").addEventListener("change",e => {
    const input = e.target.closest("[data-asset-field]");
    if (input) updateInlineField("asset", input);
  });
  $("purchasesBody").addEventListener("change",e => {
    const input = e.target.closest("[data-purchase-field]");
    if (input) updateInlineField("purchase", input);
  });
  $("inventoryBody").addEventListener("keydown",e => {
    if (e.key === "Enter" && e.target.matches("[data-asset-field]")) {
      e.preventDefault(); e.target.blur();
    }
  });
  $("purchasesBody").addEventListener("keydown",e => {
    if (e.key === "Enter" && e.target.matches("[data-purchase-field]")) {
      e.preventDefault(); e.target.blur();
    }
  });

  $("inventoryBody").addEventListener("click",e => {
    const edit = e.target.closest("[data-edit-asset]");
    const del = e.target.closest("[data-delete-asset]");
    if (edit) editAsset(edit.dataset.editAsset);
    if (del) {
      const asset = state.assets.find(a => a.id === del.dataset.deleteAsset);
      if (asset && confirm('Excluir "' + asset.name + '" do inventário?')) {
        state.assets = state.assets.filter(a => a.id !== asset.id); saveState(); render(); showToast("Equipamento excluído.");
      }
    }
  });
  $("purchasesBody").addEventListener("click",e => {
    const edit = e.target.closest("[data-edit-purchase]");
    const del = e.target.closest("[data-delete-purchase]");
    if (edit) editPurchase(edit.dataset.editPurchase);
    if (del) {
      const purchase = state.purchases.find(p => p.id === del.dataset.deletePurchase);
      if (purchase && confirm('Excluir "' + purchase.name + '" do plano de compras?')) {
        state.purchases = state.purchases.filter(p => p.id !== purchase.id); saveState(); render(); showToast("Compra removida.");
      }
    }
  });
  ["inventorySearch","categoryFilter","conditionFilter"].forEach(id => $(id).addEventListener(id === "inventorySearch" ? "input" : "change",renderInventory));
  ["purchaseSearch","priorityFilter","purchaseStatusFilter"].forEach(id => $(id).addEventListener(id === "purchaseSearch" ? "input" : "change",renderPurchases));

  $("backupButton").addEventListener("click",() => {
    const blob = new Blob([JSON.stringify({app:"Patrimônio da Mídia",version:1,exportedAt:new Date().toISOString(),...state},null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = "backup-patrimonio-midia-" + new Date().toISOString().slice(0,10) + ".json"; link.click(); URL.revokeObjectURL(url);
    showToast("Backup exportado.");
  });
  $("importFile").addEventListener("change",async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.assets) || !Array.isArray(data.purchases)) throw new Error("Formato inválido");
      if (!confirm("Importar este backup substituirá os dados atuais deste navegador. Deseja continuar?")) return;
      state = {assets:data.assets,purchases:data.purchases}; saveState(); render(); showToast("Backup importado com sucesso.");
    } catch(error) { showToast("Arquivo inválido. Selecione um backup exportado por este sistema."); }
    finally { e.target.value = ""; }
  });

  function exitPresentation() {
    document.body.classList.remove("presentation-mode");
    const exit = document.querySelector(".presentation-exit"); if (exit) exit.remove();
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(()=>{});
  }
  $("presentationButton").addEventListener("click",async() => {
    document.body.classList.add("presentation-mode");
    const exit = document.createElement("button"); exit.className = "presentation-exit"; exit.textContent = "Sair da apresentação ×";
    exit.addEventListener("click",exitPresentation); document.body.appendChild(exit);
    try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch(error) { /* Tela cheia pode não ser permitida pelo navegador. */ }
  });
  document.addEventListener("keydown",e => { if (e.key === "Escape" && document.body.classList.contains("presentation-mode") && !document.fullscreenElement) exitPresentation(); });
  document.addEventListener("fullscreenchange",() => { if (!document.fullscreenElement && document.body.classList.contains("presentation-mode")) exitPresentation(); });

  render();
})();