import { categories } from "./data.js";

export function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {style:"currency",currency:"BRL"});
}
export function formatDate(value) {
  if (!value) return "—";
  const [y,m,d] = value.split("-");
  return `${d}/${m}/${y}`;
}
export function populateCategories(type, selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = categories[type].map(c => `<option value="${c}">${c}</option>`).join("");
}
export function renderRows(items, targetId, options = {}) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const withActions = Boolean(options.actions);
  target.innerHTML = items.map(t => `
    <tr>
      <td><div class="transaction-name"><span class="transaction-avatar">${t.type === "income" ? "↗" : "↙"}</span><strong>${escapeHTML(t.description)}</strong></div></td>
      <td>${escapeHTML(t.category)}</td><td>${formatDate(t.date)}</td>
      <td class="${t.type === "income" ? "amount-income" : "amount-expense"}">${t.type === "income" ? "+" : "−"} ${formatCurrency(t.amount)}</td>
      ${options.hideType ? "" : `<td><span class="type-pill ${t.type === "expense" ? "expense" : ""}">${t.type === "income" ? "Receita" : "Despesa"}</span></td>`}
      ${withActions ? `<td><div class="row-actions"><button class="small-action" data-edit="${t.id}">Editar</button><button class="small-action" data-delete="${t.id}">Excluir</button></div></td>` : ""}
    </tr>`).join("");
}
export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
