import { formatCurrency, renderRows } from "./transactions.js";

const palette = ["#9a83ff","#54cfa0","#538ce8","#f1a05e","#e36da9","#70c8d8","#c5a36c"];
const monthName = d => d.toLocaleDateString("pt-BR",{month:"short"}).replace(".","");
const sum = (items,type) => items.filter(t=>t.type===type).reduce((a,t)=>a+Number(t.amount),0);

export function renderDashboard(transactions) {
  const now = new Date();
  const currentMonth = transactions.filter(t => {
    const d = new Date(t.date+"T12:00:00");
    return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
  });
  const income = sum(transactions,"income"), expense = sum(transactions,"expense");
  const monthIncome = sum(currentMonth,"income"), monthExpense = sum(currentMonth,"expense");
  document.getElementById("balanceValue").textContent = formatCurrency(income-expense);
  document.getElementById("incomeValue").textContent = formatCurrency(monthIncome);
  document.getElementById("expenseValue").textContent = formatCurrency(monthExpense);
  document.getElementById("incomeCount").textContent = `${currentMonth.filter(t=>t.type==="income").length} entradas`;
  document.getElementById("expenseCount").textContent = `${currentMonth.filter(t=>t.type==="expense").length} saídas`;
  document.getElementById("balanceCaption").textContent = `${transactions.length} movimentações registradas`;
  document.getElementById("donutTotal").textContent = formatCompact(expense);
  const recent = [...transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  renderRows(recent,"recentTransactions");
  document.getElementById("recentEmpty").classList.toggle("hidden",recent.length>0);
  renderDonut(transactions);
  renderFlow(transactions);F
}
function formatCompact(n){return n>=1000?`R$ ${(n/1000).toFixed(1).replace(".",",")}k`:formatCurrency(n)}
function renderDonut(transactions){
  const expenses=transactions.filter(t=>t.type==="expense");
  const groups={}; expenses.forEach(t=>groups[t.category]=(groups[t.category]||0)+Number(t.amount));
  const sorted=Object.entries(groups).sort((a,b)=>b[1]-a[1]);
  const total=sorted.reduce((a,x)=>a+x[1],0);
  let current=0;
  const segments=sorted.map(([name,value],i)=>{const start=current;current+=total?value/total*100:0;return `${palette[i%palette.length]} ${start}% ${current}%`});
  document.getElementById("categoryDonut").style.background=total?`conic-gradient(${segments.join(",")})`:"#30364a";
  document.getElementById("categoryLegend").innerHTML=sorted.slice(0,4).map(([name,value],i)=>`<div class="legend-item"><i style="background:${palette[i%palette.length]}"></i>${name}<b>${Math.round(value/total*100)}%</b></div>`).join("") || '<span class="muted">Sem despesas registradas</span>';
}
function renderFlow(transactions){
  const canvas=document.getElementById("flowChart"); if(!canvas)return;
  const rect=canvas.getBoundingClientRect(), ratio=window.devicePixelRatio||1;
  canvas.width=Math.max(300,rect.width*ratio);canvas.height=Math.max(150,rect.height*ratio);
  const ctx=canvas.getContext("2d");ctx.scale(ratio,ratio);
  const w=rect.width,h=rect.height,pad={l:36,r:12,t:12,b:25},cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;
  const count=Number(document.getElementById("flowPeriod")?.value||6),months=[];
  for(let i=count-1;i>=0;i--){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);months.push({date:d,label:monthName(d),income:0,expense:0})}
  transactions.forEach(t=>{const d=new Date(t.date+"T12:00:00");const m=months.find(x=>x.date.getMonth()===d.getMonth()&&x.date.getFullYear()===d.getFullYear());if(m)m[t.type]+=Number(t.amount)});
  const max=Math.max(100,...months.flatMap(m=>[m.income,m.expense]))*1.15;
  ctx.clearRect(0,0,w,h);ctx.font="10px DM Sans";ctx.fillStyle="#777e91";ctx.strokeStyle="rgba(255,255,255,.08)";
  for(let i=0;i<4;i++){const y=pad.t+ch*i/3;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillText(`${Math.round(max*(1-i/3)/1000)}k`,2,y+3)}
  const draw=(key,color)=>{ctx.beginPath();months.forEach((m,i)=>{const x=pad.l+(months.length===1?cw/2:cw*i/(months.length-1));const y=pad.t+ch-(m[key]/max)*ch;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.strokeStyle=color;ctx.lineWidth=2;ctx.lineJoin="round";ctx.stroke();months.forEach((m,i)=>{const x=pad.l+(months.length===1?cw/2:cw*i/(months.length-1));const y=pad.t+ch-(m[key]/max)*ch;ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()})};
  draw("income","#9a83ff");draw("expense","#54cfa0");
  ctx.fillStyle="#858b9d";ctx.textAlign="center";months.forEach((m,i)=>ctx.fillText(m.label,pad.l+(months.length===1?cw/2:cw*i/(months.length-1)),h-5));
}
export function renderReports(transactions){
  const income=sum(transactions,"income"),expense=sum(transactions,"expense");
  document.getElementById("reportIncome").textContent=formatCurrency(income);
  document.getElementById("reportExpense").textContent=formatCurrency(expense);
  document.getElementById("reportResult").textContent=formatCurrency(income-expense);
  const groups={};transactions.filter(t=>t.type==="expense").forEach(t=>groups[t.category]=(groups[t.category]||0)+Number(t.amount));
  const total=Object.values(groups).reduce((a,b)=>a+b,0);
  document.getElementById("reportCategoryRows").innerHTML=Object.entries(groups).sort((a,b)=>b[1]-a[1]).map(([name,value])=>`<div><div class="report-row-head"><span>${name}</span><strong>${formatCurrency(value)} · ${total?Math.round(value/total*100):0}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${total?value/total*100:0}%"></div></div></div>`).join("")||'<p class="muted">Cadastre despesas para visualizar o relatório.</p>';
}
