const agents=[
{name:'Lead Finder',icon:'01',desc:'Discovers candidate businesses and flags likely no-website opportunities.'},
{name:'Lead Researcher',icon:'02',desc:'Enriches a lead with category, location, reviews, online presence and decision-maker clues.'},
{name:'Opportunity Scorer',icon:'03',desc:'Ranks leads by commercial opportunity so your calling time goes to the best prospects.'},
{name:'Sales Agent',icon:'04',desc:'Creates a short personalized call angle, objections and follow-up copy.'},
{name:'Follow-up Agent',icon:'05',desc:'Keeps warm prospects moving with next-action dates and suggested follow-ups.'}
];
let leads=JSON.parse(localStorage.getItem('websales-leads')||'null')||[
{name:'Aashish Business Consultant',category:'Business Consultant',city:'Muzaffarpur',phone:'',website:'no',reviews:43,status:'new',score:91,next:'Call today'},
{name:'Sample Dental Clinic',category:'Clinic',city:'Patna',phone:'',website:'no',reviews:87,status:'new',score:88,next:'Call today'},
{name:'Local Tax Consultant',category:'Consultant',city:'Darbhanga',phone:'',website:'unknown',reviews:51,status:'followup',score:72,next:'Follow up tomorrow'}
];
const $=s=>document.querySelector(s);const $$=s=>document.querySelectorAll(s);
function save(){localStorage.setItem('websales-leads',JSON.stringify(leads))}
function score(l){let s=0;if(l.website==='no')s+=30;else if(l.website==='unknown')s+=10;if(+l.reviews>=100)s+=20;else if(+l.reviews>=50)s+=15;else if(+l.reviews>=20)s+=10;if(l.category)s+=10;if(l.city)s+=10;return Math.min(99,s+15)}
function renderStats(){let total=leads.length, no=leads.filter(x=>x.website==='no').length,warm=leads.filter(x=>['interested','followup'].includes(x.status)).length,won=leads.filter(x=>x.status==='won').length;$('#stats').innerHTML=`<div class="stat"><b>${total}</b><span>Total leads</span></div><div class="stat"><b>${no}</b><span>No website</span></div><div class="stat"><b>${warm}</b><span>Warm prospects</span></div><div class="stat"><b>${won}</b><span>Deals won</span></div>`;$('#heroLeads').textContent=total}
function renderPriority(){let list=[...leads].sort((a,b)=>b.score-a.score).slice(0,3);$('#priorityLeads').innerHTML=list.map(l=>`<article class="lead-card"><div class="muted">${l.category||'Business'} · ${l.city}</div><h4>${l.name}</h4><div class="muted">${l.website==='no'?'No website detected':'Website status: '+l.website} · ${l.reviews||0} reviews</div><div class="card-row"><span class="badge">${l.status}</span><span class="score">${l.score}<small>/100</small></span></div></article>`).join('')||'<div class="lead-card">No leads yet. Add your first prospect.</div>'}
function renderTable(){let q=($('#searchLeads')?.value||'').toLowerCase(),f=$('#filterStatus')?.value||'all';let list=leads.filter(l=>(f==='all'||l.status===f)&&`${l.name} ${l.city}`.toLowerCase().includes(q)).sort((a,b)=>b.score-a.score);$('#leadTable').innerHTML=list.map((l,i)=>`<tr><td><b>${l.name}</b><div class="muted">${l.category||''}</div></td><td>${l.city}</td><td>${l.website==='no'?'❌ No':'⚠ '+l.website}</td><td><b>${l.score}</b></td><td><span class="badge">${l.status}</span></td><td><button class="ghost action" data-i="${leads.indexOf(l)}">${l.next||'Call'}</button></td></tr>`).join('')||'<tr><td colspan="6">No matching leads.</td></tr>'}
function renderAgents(){$('#agentList').innerHTML=agents.map(a=>`<article class="agent-card"><div class="agent-num">${a.icon}</div><div><h3>${a.name}</h3><p>${a.desc}</p></div></article>`).join('')}
function renderFollowups(){let list=leads.filter(l=>['followup','interested'].includes(l.status));$('#followupsList').innerHTML=list.length?list.map(l=>`<article class="follow-card"><span class="badge">${l.status}</span><h3>${l.name}</h3><div class="muted">${l.city} · Score ${l.score}</div><p class="muted">Next: ${l.next||'Contact prospect'}</p><button class="primary" onclick="advance(${leads.indexOf(l)})">Mark contacted</button></article>`).join(''):'<div class="follow-card"><h3>Queue is empty</h3><p class="muted">Interested leads will appear here.</p></div>'}
function render(){renderStats();renderPriority();renderTable();renderAgents();renderFollowups()}
function advance(i){leads[i].status='contacted';leads[i].next='Await response';save();render();toast('Lead updated')}
function toast(t){let e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800)}
function showView(id){$$('.view').forEach(x=>x.classList.remove('active-view'));$('#'+id).classList.add('active-view');$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===id));$('#pageTitle').textContent=id[0].toUpperCase()+id.slice(1)}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
$('#searchLeads').addEventListener('input',renderTable);$('#filterStatus').addEventListener('change',renderTable);
$('#addLead').onclick=()=>$('#leadModal').classList.add('open');$('#closeModal').onclick=$('#cancelModal').onclick=()=>$('#leadModal').classList.remove('open');
$('#leadForm').onsubmit=e=>{e.preventDefault();let f=new FormData(e.target);let l={name:f.get('name'),category:f.get('category'),city:f.get('city'),phone:f.get('phone'),website:f.get('website'),reviews:+f.get('reviews')||0,status:'new',score:0,next:'Call today'};l.score=score(l);leads.unshift(l);save();render();e.target.reset();$('#leadModal').classList.remove('open');toast('Lead added and scored')};
$('#runPipeline').onclick=()=>{leads=leads.map(l=>({...l,score:score(l)}));save();render();toast('5-agent pipeline refreshed')};
document.addEventListener('click',e=>{if(e.target.classList.contains('action')){let i=+e.target.dataset.i;leads[i].status=leads[i].status==='new'?'contacted':'followup';leads[i].next=leads[i].status==='followup'?'Follow up tomorrow':'Await response';save();render();toast('Next action updated')}});render();
