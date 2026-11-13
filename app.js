/* JobProfitKit UK v1 | Everything runs inside the visitor's browser. */
(() => {
  'use strict';
  const STORAGE_KEY = 'trademarginuk-v1';
  const money = value => new Intl.NumberFormat('en-GB', {style:'currency', currency:'GBP'}).format(value);
  const n = value => { const x = Number(value); return Number.isFinite(x) ? Math.max(0, Math.min(100000000, x)) : 0; };
  const round = x => Math.round((x + Number.EPSILON) * 100) / 100;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => Math.random().toString(36).slice(2, 11);
  const demo = () => ({
    business: '', customer: '', job: 'Example property repair job', docType:'Estimate', reference:'EST-001',
    scope:'Repair the damaged surface, prepare the area, complete the finishing work and leave the work area tidy. Exact scope to be confirmed before acceptance.',
    overhead: 0, discount: 0, target: 35, vat: 'none', deposit: 20, valid: '30',
    items: [
      {id:uid(), name:'Materials & consumables', qty:1, cost:95, sell:135},
      {id:uid(), name:'Labour (hours)', qty:7, cost:18, sell:42},
      {id:uid(), name:'Travel & disposal', qty:1, cost:20, sell:45}
    ]
  });
  const cleanString = (x, max) => String(x ?? '').slice(0,max);
  function sanitize(raw) {
    if (!raw || !Array.isArray(raw.items)) throw new Error('Not a quote backup');
    const d=demo(), out={};
    for(const [k,max] of [['business',90],['customer',90],['job',130],['reference',35],['scope',1600]]) out[k]=cleanString(raw[k] ?? d[k],max);
    out.docType = ['Estimate','Quotation'].includes(raw.docType) ? raw.docType : 'Estimate';
    out.vat = ['none','0','5','20'].includes(String(raw.vat)) ? String(raw.vat) : 'none';
    out.valid = ['7','14','30','60'].includes(String(raw.valid)) ? String(raw.valid) : '30';
    out.overhead=n(raw.overhead); out.discount=n(raw.discount); out.target=Math.min(95,n(raw.target)); out.deposit=Math.min(100,n(raw.deposit));
    out.items=raw.items.slice(0,100).map(item=>({id:uid(),name:cleanString(item.name,140),qty:Math.min(100000,n(item.qty)),cost:n(item.cost),sell:n(item.sell)}));
    return out;
  }
  let state;
  try {const raw=localStorage.getItem(STORAGE_KEY); state=raw ? sanitize(JSON.parse(raw)):demo();}
  catch(e){state=demo();}
  const $=id=>document.getElementById(id);
  const fields=document.querySelectorAll('[data-field]');
  const persistedFields = ['business','customer','job','docType','reference','scope','overhead','discount','target','vat','deposit','valid'];
  const isNumberField = f => ['overhead','discount','target','deposit'].includes(f);
  function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));$('save-status').textContent='✓ Saved in this browser';}catch(e){$('save-status').textContent='Your browser is not allowing local saving. Download a backup.';}}
  function initFields(){fields.forEach(el=> {el.value=String(state[el.dataset.field]);});}
  function renderItems(){
    const root=$('items');root.replaceChildren();
    if(!state.items.length){root.innerHTML='<p class="hint">No items yet. Add something you need to charge for.</p>';return;}
    for(const item of state.items){
      const node=document.createElement('div');node.className='line-item';node.dataset.id=item.id;
      node.innerHTML=`<div class="item-name-wrapper"><span class="mobile-input-label">DESCRIPTION</span><input class="item-name" aria-label="Item description" data-key="name" maxlength="140" value="${esc(item.name)}" placeholder="Work or material" /></div>
        <div class="qty"><span class="mobile-input-label">QTY</span><input type="number" aria-label="Quantity for ${esc(item.name)}" min="0" max="100000" step="any" inputmode="decimal" data-key="qty" value="${item.qty}" /></div>
        <div><span class="mobile-input-label">COST £</span><input type="number" aria-label="Unit cost for ${esc(item.name)}" min="0" max="100000000" step="0.01" inputmode="decimal" data-key="cost" value="${item.cost}" /></div>
        <div><span class="mobile-input-label">CHARGE £</span><input type="number" aria-label="Selling price per unit for ${esc(item.name)}" min="0" max="100000000" step="0.01" inputmode="decimal" data-key="sell" value="${item.sell}" /></div>
        <button class="remove-item" type="button" data-remove="${esc(item.id)}" aria-label="Remove ${esc(item.name)}">×</button>`;
      root.append(node);
    }
  }
  function calc(){
    let subtotal=0, cost=0;
    const rows=state.items.map(item=>{const q=Math.min(100000,n(item.qty)),lineCost=round(q*n(item.cost)),lineSell=round(q*n(item.sell));subtotal=round(subtotal+lineSell);cost=round(cost+lineCost);return {name:item.name,qty:q,unitPrice:n(item.sell),total:lineSell};});
    cost=round(cost+n(state.overhead));
    const discount=round(Math.min(subtotal,n(state.discount)));
    const net=round(subtotal-discount);
    const vatRate=state.vat==='none'?0:Number(state.vat);
    const vatAmount=round(net*vatRate/100);
    const total=round(net+vatAmount);
    const profit=round(net-cost);
    const margin=net>0?profit/net*100:(cost>0?-100:0);
    const deposit=round(total*Math.min(100,n(state.deposit))/100);
    const target=Math.min(95,n(state.target));
    const targetPrice=cost/(1-target/100);
    return {rows,subtotal,cost,discount,net,vatRate,vatAmount,total,profit,margin,deposit,target,targetPrice};
  }
  function renderResults(){
    const x=calc();
    $('customer-total').textContent=money(x.total);
    $('subtotal').textContent=money(x.subtotal);
    $('discount-out').textContent=`−${money(x.discount)}`;
    $('vat-out').textContent=money(x.vatAmount);
    $('total-line').textContent=money(x.total);
    $('profit').textContent=money(x.profit);
    $('profit').parentElement.classList.toggle('loss',x.profit<0);
    $('margin').textContent=Number.isFinite(x.margin)?`${x.margin.toFixed(1)}%`:'—';
    $('target-out').textContent=`${x.target}%`;
    $('margin-fill').style.width=`${Math.max(0,Math.min(100,x.margin))}%`;
    $('costs').textContent=money(x.cost);
    $('deposit-out').textContent=money(x.deposit);
    let msg='';
    if(x.net===0 && x.cost===0) msg='Add a priced item to see your projected profit.';
    else if(x.net===0) msg='⚠ No selling price entered. Your entered costs are not covered.';
    else if(x.margin>=x.target) msg=`✓ You're above your ${x.target}% target based on entered costs.`;
    else msg=`To reach ${x.target}% margin, increase your price before VAT by about ${money(Math.max(0,x.targetPrice-x.net))}.`;
    $('target-message').textContent=msg;
    $('target-message').classList.toggle('warning',x.margin<x.target || x.net===0 && x.cost>0);
  }
  function update(){renderResults();persist();}
  fields.forEach(el=>el.addEventListener('input',()=>{
    const f=el.dataset.field;
    state[f]=isNumberField(f) ? n(el.value) : el.value;
    if(f==='target')state.target=Math.min(95,state.target);
    if(f==='deposit')state.deposit=Math.min(100,state.deposit);
    if(f==='vat'||f==='valid') state[f]=el.value;
    update();
  }));
  $('items').addEventListener('input',e=>{
    const key=e.target.dataset.key;if(!key)return;
    const wrapper=e.target.closest('.line-item'); if(!wrapper)return;
    const item=state.items.find(i=>i.id===wrapper.dataset.id);if(!item)return;
    item[key]=key==='name'?e.target.value:n(e.target.value);
    update();
  });
  $('items').addEventListener('click',e=>{
    const id=e.target.dataset.remove;if(!id)return;
    state.items=state.items.filter(i=>i.id!==id);renderItems();update();
  });
  $('add-item').addEventListener('click',()=>{if(state.items.length>=100)return toast('Maximum 100 items.');state.items.push({id:uid(),name:'New material or service',qty:1,cost:0,sell:0});renderItems();update();$('items').lastElementChild.querySelector('[data-key=name]').focus();});
  $('add-labour').addEventListener('click',()=>{if(state.items.length>=100)return toast('Maximum 100 items.');state.items.push({id:uid(),name:'Labour (hours)',qty:1,cost:0,sell:0});renderItems();update();$('items').lastElementChild.querySelector('[data-key=name]').focus();});
  $('reset').addEventListener('click',()=>{if(!confirm('Replace this quote with the example? Download a backup first if you need the current figures.'))return;state=demo();initFields();renderItems();update();toast('Example restored.');});
  function download(filename,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
  $('export-json').addEventListener('click',()=>{download('JobProfitKitUK-quote-backup.json',JSON.stringify({app:'JobProfitKit UK',version:1,date:new Date().toISOString(),...state},null,2),'application/json');toast('Backup downloaded.');});
  const csvCell = s => {let v=String(s??'');if(/^[=+@\-\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';};
  $('export-csv').addEventListener('click',()=>{
    const rows=[['Description','Quantity','Unit cost GBP','Unit selling price GBP','Total cost GBP','Total selling GBP'],...state.items.map(i=>[i.name,i.qty,i.cost,i.sell,round(i.qty*i.cost),round(i.qty*i.sell)])];
    const x=calc();rows.push(['Extra internal costs','',state.overhead,'',state.overhead,'']);rows.push(['Discount','','',state.discount,'',-x.discount]);rows.push(['Total net sale','','','','',x.net]);rows.push(['Total entered costs','','','',x.cost,'']);rows.push(['Projected profit','','','','',x.profit]);
    download('JobProfitKitUK-job-costs.csv','\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');toast('Private cost breakdown downloaded.');
  });
  function dateUk(d){return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});}
  function documentHtml(){
    const x=calc(),today=new Date(),expiry=new Date(today.getFullYear(),today.getMonth(),today.getDate()+Number(state.valid));
    const vatLabel=state.vat==='none'?'VAT not charged':`VAT (${x.vatRate}%)`;
    const fmt=money;
    const title=state.docType.toUpperCase();
    const table=x.rows.map(i=>`<tr><td>${esc(i.name||'Unnamed item')}</td><td>${esc(i.qty)}</td><td>${fmt(i.unitPrice)}</td><td>${fmt(i.total)}</td></tr>`).join('');
    return `<div class="customer-document"><div class="document-head"><div><h2>${esc(state.business||'Your business name')}</h2><div class="doc-meta">Prepared for: <strong>${esc(state.customer||'Customer')}</strong><br>Project: ${esc(state.job||'New job')}</div></div><div style="text-align:right"><strong>${title}</strong><div class="doc-meta">Ref: ${esc(state.reference||'—')}<br>Date: ${dateUk(today)}<br>Valid until: ${dateUk(expiry)}</div></div></div>
    <div class="doc-scope"><strong>Scope of work</strong><p>${esc(state.scope||'Work to be agreed with the customer.')}</p></div>
    <table class="doc-table"><thead><tr><th>Work / items</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead><tbody>${table||'<tr><td colspan="4">No items added yet</td></tr>'}</tbody></table>
    <div class="doc-totals"><div><span>Subtotal</span><span>${fmt(x.subtotal)}</span></div>${x.discount>0?`<div><span>Discount</span><span>−${fmt(x.discount)}</span></div>`:''}<div><span>${vatLabel}</span><span>${fmt(x.vatAmount)}</span></div><div class="doc-grand"><span>Total</span><span>${fmt(x.total)}</span></div>${x.deposit>0?`<div><span>Requested deposit (${state.deposit}%)</span><span>${fmt(x.deposit)}</span></div>`:''}</div>
    <div class="doc-note">This ${state.docType.toLowerCase()} is based on the described scope and prices above. Please confirm the scope, start date, access, payment arrangements, and any variations before work begins. ${state.docType==='Estimate'?'The final price may vary if the agreed scope changes.':'Quotation terms and any exclusions should be agreed before acceptance.'}</div><div class="doc-footer">Created with JobProfitKit UK · Independent tool; not an official HMRC service · Please verify details before issuing.</div></div>`;
  }
  const overlay=$('preview-overlay');
  function showPreview(){const html=documentHtml();$('customer-document').innerHTML=html; $('print-only').innerHTML=html;overlay.hidden=false;document.body.style.overflow='hidden';$('close-preview').focus();}
  function closePreview(){overlay.hidden=true;document.body.style.overflow='';$('show-quote').focus();}
  $('show-quote').addEventListener('click',showPreview);
  $('close-preview').addEventListener('click',closePreview);
  overlay.addEventListener('click',e=>{if(e.target===overlay)closePreview();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)closePreview();});
  $('print-quote').addEventListener('click',()=>{const x=calc();if(x.total<=0){toast('Add an item price before printing.');return;}$('print-only').innerHTML=documentHtml();window.print();});
  $('copy-summary').addEventListener('click',async()=>{
    const x=calc();const text=`JobProfitKit UK - ${state.job||'Job'}\nCustomer quote: ${money(x.total)}\nBefore VAT: ${money(x.net)}\nVAT charged: ${money(x.vatAmount)}\nEntered costs: ${money(x.cost)}\nProjected gross profit: ${money(x.profit)}\nGross margin: ${x.margin.toFixed(1)}%`;
    try {await navigator.clipboard.writeText(text);toast('Numbers copied (including your private costs).');}
    catch(e){toast('Copy unavailable in this browser. Export the costs CSV instead.');}
  });
  let toastTimer;
  function toast(message){const el=$('toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3500);}
  $('year').textContent=new Date().getFullYear();
  initFields();renderItems();renderResults();
  window.JobProfitKitTest={calc:()=>calc(),setState:raw=>{state=sanitize(raw);initFields();renderItems();update();},demo};
})();
