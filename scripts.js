// Simple local "database" using localStorage
const STORAGE_KEY = 'luaDeMelContribs_v1';

function readContribs(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error(e);
    return [];
  }
}

function saveContribs(arr){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function renderTable(){
  const tbody = document.querySelector('#contribTable tbody');
  tbody.innerHTML = '';
  const rows = readContribs();
  if(rows.length === 0){
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="4" style="color:#999;padding:12px">Nenhuma contribuição registrada ainda.</td>';
    tbody.appendChild(tr);
    return;
  }
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = <td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.email||'')}</td><td>R$ ${Number(r.amount).toFixed(2)}</td><td>${r.when}</td>;
    tbody.appendChild(tr);
  });
}

function addContrib(item){
  const arr = readContribs();
  arr.push(item);
  saveContribs(arr);
  renderTable();
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
  });
}

// Form handling
document.addEventListener('DOMContentLoaded', ()=>{
  renderTable();

  const form = document.getElementById('contribForm');
  const amountInput = document.getElementById('amount');

  // tier buttons
  document.querySelectorAll('.tier-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const v = btn.dataset.value;
      if(v === 'custom'){
        amountInput.value = '';
        amountInput.focus();
      } else {
        amountInput.value = Number(v).toFixed(2);
      }
    });
  });

  form.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    if(!name || !amount || isNaN(amount) || amount <= 0){
      alert('Por favor preencha nome e um valor válido (R$).');
      return;
    }
    const when = new Date().toLocaleString();
    addContrib({name, email, amount: Math.round(amount*100)/100, when});
    form.reset();
    amountInput.value = '';
    alert('Contribuição registrada localmente. Confirme o pagamento via PIX/transferência.');
  });

  // export CSV
  document.getElementById('exportCsv').addEventListener('click', ()=>{
    const rows = readContribs();
    if(rows.length === 0){ alert('Não há registros para exportar.'); return; }
    const header = ['Nome','E-mail','Valor (R$)','Data/Hora'];
    const lines = [header.join(',')];
    rows.forEach(r => {
      const line = [
        csvEscape(r.name),
        csvEscape(r.email||''),
        Number(r.amount).toFixed(2),
        csvEscape(r.when)
      ];
      lines.push(line.join(','));
    });
    const csv = lines.join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contribuicoes_lua_de_mel.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // clear local
  document.getElementById('clearStored').addEventListener('click', ()=>{
    if(confirm('Limpar registros armazenados localmente? Isso não apaga pagamentos que você já recebeu no banco.')) {
      localStorage.removeItem(STORAGE_KEY);
      renderTable();
    }
  });
});

// utils
function csvEscape(s){
  if(s == null) return '';
  s = String(s);
  if(s.includes('"') || s.includes(',') || s.includes('\n')) {
    return '"' + s.replace(/"/g,'""') + '"';
  }
  return s;
}
