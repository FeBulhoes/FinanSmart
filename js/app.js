import { categories } from "./data.js";
import { formatCurrency, renderRows, populateCategories } from "./transactions.js";
import { renderDashboard, renderReports } from "./dashboard.js";

let transactions = [];
let toastTimer;
const $ = id => document.getElementById(id);
const sorted = list => [...list].sort((a, b) => b.date.localeCompare(a.date));

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function updateAll() {
  renderDashboard(transactions);
  renderReports(transactions);

  $("incomePageTotal").textContent = formatCurrency(
    transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
  );

  $("expensePageTotal").textContent = formatCurrency(
    transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  );

  renderRows(sorted(transactions), "allTransactions", { actions: true });
  renderRows(sorted(transactions.filter(t => t.type === "income")), "incomeTransactions", { actions: true, hideType: true });
  renderRows(sorted(transactions.filter(t => t.type === "expense")), "expenseTransactions", { actions: true, hideType: true });

  $("listEmpty").classList.toggle("hidden", transactions.length > 0);
  $("incomeEmpty").classList.toggle("hidden", transactions.some(t => t.type === "income"));
  $("expenseEmpty").classList.toggle("hidden", transactions.some(t => t.type === "expense"));

  fillCategoryFilter();
}

function fillCategoryFilter() {
  const select = $("categoryFilter");
  const old = select.value;

  select.innerHTML = '<option value="all">Todas as categorias</option>' +
    [...new Set([...categories.income, ...categories.expense])]
      .map(c => `<option>${c}</option>`).join("");

  select.value = old;
}

function navigate(page) {
  document.querySelectorAll(".page").forEach(p =>
    p.classList.toggle("active", p.id === `page-${page}`)
  );

  document.querySelectorAll(".nav-link").forEach(b =>
    b.classList.toggle("active", b.dataset.page === page)
  );

  $("sidebar").classList.remove("open");

  if (page === "dashboard") renderDashboard(transactions);
}

function openModal(type = "income", item = null) {
  $("transactionForm").reset();
  $("formError").classList.add("hidden");
  $("transactionId").value = item?.id || "";
  $("transactionType").value = item?.type || type;

  populateCategories($("transactionType").value, "category");

  $("modalTitle").textContent = item ? "Editar transação" : "Adicionar transação";
  $("description").value = item?.description || "";
  $("amount").value = item?.amount || "";
  $("date").value = item?.date || new Date().toISOString().slice(0, 10);
  $("notes").value = item?.notes || "";

  $("transactionModal").classList.remove("hidden");
  $("description").focus();
}

function closeModal() {
  $("transactionModal").classList.add("hidden");
}

function normalizeSearch(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getFilteredTransactions(query = "", type = "all", category = "all") {
  const normalizedQuery = normalizeSearch(query);

  return sorted(transactions).filter(transaction => {
    const description = normalizeSearch(transaction.description);
    const matchesSearch = !normalizedQuery || description.includes(normalizedQuery);
    const matchesType = type === "all" || transaction.type === type;
    const matchesCategory = category === "all" || transaction.category === category;

    return matchesSearch && matchesType && matchesCategory;
  });
}

function filterTransactions() {
  const query = $("transactionSearch").value;
  const type = $("typeFilter").value;
  const category = $("categoryFilter").value;
  const filtered = getFilteredTransactions(query, type, category);

  renderRows(filtered, "allTransactions", { actions: true });
  renderRows(filtered.filter(t => t.type === "income"), "incomeTransactions", { actions: true, hideType: true });
  renderRows(filtered.filter(t => t.type === "expense"), "expenseTransactions", { actions: true, hideType: true });

  $("listEmpty").textContent = filtered.length ? "" : "Nenhuma transação encontrada.";
  $("listEmpty").classList.toggle("hidden", filtered.length > 0);
  $("incomeEmpty").textContent = filtered.some(t => t.type === "income")
    ? ""
    : query ? "Nenhuma receita encontrada para essa busca." : "Nenhuma receita cadastrada.";
  $("expenseEmpty").textContent = filtered.some(t => t.type === "expense")
    ? ""
    : query ? "Nenhuma despesa encontrada para essa busca." : "Nenhuma despesa cadastrada.";

  $("incomeEmpty").classList.toggle("hidden", filtered.some(t => t.type === "income"));
  $("expenseEmpty").classList.toggle("hidden", filtered.some(t => t.type === "expense"));
}

function handleGlobalSearch(value) {
  $("transactionSearch").value = value;
  $("typeFilter").value = "all";
  $("categoryFilter").value = "all";

  const results = getFilteredTransactions(value);
  const hasIncome = results.some(t => t.type === "income");
  const hasExpense = results.some(t => t.type === "expense");

  filterTransactions();

  if (value.trim() && hasIncome && !hasExpense) {
    navigate("income");
  } else if (value.trim() && hasExpense && !hasIncome) {
    navigate("expenses");
  } else {
    navigate("transactions");
  }
}

function handleSubmit(event) {
  event.preventDefault();

  const description = $("description").value.trim();
  const amount = Number($("amount").value);
  const date = $("date").value;
  const type = $("transactionType").value;

  let error = "";

  if (description.length < 2) error = "Informe uma descrição com pelo menos 2 caracteres.";
  else if (!Number.isFinite(amount) || amount <= 0) error = "Informe um valor maior que zero.";
  else if (!date) error = "Selecione a data da movimentação.";
  else if (new Date(date + "T12:00:00") > new Date(new Date().toDateString())) {
    error = "A data não pode estar no futuro.";
  }

  if (error) {
    $("formError").textContent = error;
    $("formError").classList.remove("hidden");
    return;
  }

  const id = $("transactionId").value;

  const item = {
    id: id ? Number(id) : Date.now(),
    description,
    amount,
    date,
    type,
    category: $("category").value,
    notes: $("notes").value.trim()
  };

  if (id) {
    transactions = transactions.map(t => t.id === Number(id) ? item : t);
    showToast("Transação atualizada com sucesso.");
  } else {
    transactions.push(item);
    showToast("Transação cadastrada com sucesso.");
  }

  closeModal();
  updateAll();
  filterTransactions();
}

function handleTableAction(event) {
  const edit = event.target.closest("[data-edit]");
  const del = event.target.closest("[data-delete]");

  if (edit) {
    const item = transactions.find(t => t.id === Number(edit.dataset.edit));
    if (item) openModal(item.type, item);
  }

  if (del) {
    const id = Number(del.dataset.delete);
    const item = transactions.find(t => t.id === id);

    if (item && confirm(`Deseja excluir "${item.description}"?`)) {
      transactions = transactions.filter(t => t.id !== id);
      updateAll();
      filterTransactions();
      showToast("Transação excluída.");
    }
  }
}

document.querySelectorAll(".nav-link").forEach(b =>
  b.addEventListener("click", () => navigate(b.dataset.page))
);

document.querySelectorAll("[data-go]").forEach(b =>
  b.addEventListener("click", () => navigate(b.dataset.go))
);

$("addTransactionTop").addEventListener("click", () => openModal());
$("addTransactionList").addEventListener("click", () => openModal());

document.querySelectorAll("[data-add-type]").forEach(b =>
  b.addEventListener("click", () => openModal(b.dataset.addType))
);

$("closeModal").addEventListener("click", closeModal);
$("cancelModal").addEventListener("click", closeModal);

$("transactionModal").addEventListener("click", e => {
  if (e.target === $("transactionModal")) closeModal();
});

$("transactionForm").addEventListener("submit", handleSubmit);

$("transactionType").addEventListener("change", e =>
  populateCategories(e.target.value, "category")
);

document.addEventListener("click", e => {
  if (e.target.closest("[data-edit],[data-delete]")) handleTableAction(e);
});

$("transactionSearch").addEventListener("input", () => {
  $("globalSearch").value = $("transactionSearch").value;
  filterTransactions();
});

$("typeFilter").addEventListener("change", filterTransactions);
$("categoryFilter").addEventListener("change", filterTransactions);

$("globalSearch").addEventListener("input", e => {
  handleGlobalSearch(e.target.value);
});

$("flowPeriod").addEventListener("change", () => renderDashboard(transactions));

$("mobileMenu").addEventListener("click", () =>
  $("sidebar").classList.toggle("open")
);

$("notificationButton").addEventListener("click", () =>
  showToast("Nenhuma notificação nova.")
);

function openSettingsTab(tab) {
  navigate(`settings-${tab}`);
  $("profileDropdown").classList.add("hidden");
  $("profileMore").setAttribute("aria-expanded", "false");
}

$("profileMore").addEventListener("click", () => {
  const dropdown = $("profileDropdown");
  dropdown.classList.toggle("hidden");

  $("profileMore").setAttribute(
    "aria-expanded",
    String(!dropdown.classList.contains("hidden"))
  );
});

document.querySelectorAll("[data-settings-tab]").forEach(button =>
  button.addEventListener("click", () =>
    openSettingsTab(button.dataset.settingsTab)
  )
);

document.addEventListener("click", event => {
  if (!event.target.closest(".profile-menu-wrap")) {
    $("profileDropdown").classList.add("hidden");
    $("profileMore").setAttribute("aria-expanded", "false");
  }
});

// CARREGAR CONFIGURAÇÕES
function loadSettings() {
  try {
    const profile = JSON.parse(
      localStorage.getItem("finansmartProfile") || "{}"
    );

    const notifications = JSON.parse(
      localStorage.getItem("finansmartNotifications") || "{}"
    );

    $("profileName").value = profile.name || "";
    $("profileEmail").value = profile.email || "";
    $("profileCpf").value = profile.cpf || "";
    $("profilePhone").value = profile.phone || "";

    $("notifyTransactions").checked = notifications.transactions !== false;
    $("notifySummary").checked = notifications.summary !== false;

  } catch (error) {
    console.warn("Não foi possível carregar as configurações salvas.", error);
  }
}

// SALVAR DADOS DO PERFIL
$("saveProfile").addEventListener("click", () => {
  const profile = {
    name: $("profileName").value.trim(),
    email: $("profileEmail").value.trim(),
    cpf: $("profileCpf").value.trim(),
    phone: $("profilePhone").value.trim()
  };

  localStorage.setItem("finansmartProfile", JSON.stringify(profile));

  showToast("Dados salvos neste navegador.");
});

$("saveNotifications").addEventListener("click", () => {
  localStorage.setItem(
    "finansmartNotifications",
    JSON.stringify({
      transactions: $("notifyTransactions").checked,
      summary: $("notifySummary").checked
    })
  );

  showToast("Preferências salvas neste navegador.");
});

window.addEventListener("resize", () => {
  if ($("page-dashboard").classList.contains("active")) {
    renderDashboard(transactions);
  }
});

populateCategories("income", "category");
loadSettings();
updateAll();