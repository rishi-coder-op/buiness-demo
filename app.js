const agents=[
{name:'Lead Finder',icon:'01',desc:'Finds candidate Bihar businesses and filters out food businesses.'},
{name:'Lead Researcher',icon:'02',desc:'Checks public business details, website status, reviews and contact information.'},
{name:'Opportunity Scorer',icon:'03',desc:'Ranks prospects by website opportunity and calling priority.'},
{name:'Sales Agent',icon:'04',desc:'Creates a personalized opening, value angle and objection response.'},
{name:'Follow-up Agent',icon:'05',desc:'Tracks warm prospects and tells you the next action.'}
];
const seed=[
{name:'Aashish Business Consultant',category:'Business Consultant',city:'Muzaffarpur',phone:'',website:'no',reviews:43,status:'new',score:91,next:'Call today'},
{name:'Niwas Kumar Advocate',category:'Law Firm',city:'Bihar Sharif',phone:'+91 99346 57567',website:'unknown',reviews:221,status:'new',score:86,next:'Verify website, then call'},
{name:'Activelife Physiotherapy Clinics',category:'Physiotherapy',city:'Jehanabad',phone:'+91 74850 59804',website:'unknown',reviews:0,status:'new',score:70,next:'Verify website, then call'},
{name:'AshaVastu Consultants LLP',category:'Engineering Consultant',city:'Patna',phone:'+91 95041 24683',website:'unknown',reviews:0,status:'new',score:68,next:'Verify website, then call'},
{name:'Samadhan',category:'Law Firm',city:'Bihar Sharif',phone:'',website:'unknown',reviews:0,status:'new',score:66,next:'Verify website, then call'},
{name:'Rahman',category:'Real Estate Agency',city:'Bihar Sharif',phone:'',website:'unknown',reviews:0,status:'new',score:66,next:'Verify website, then call'},
{name:'RS Engineers and Consultants Patna',category:'Engineering Consultant',city:'Patna',phone:'+91 94718 09703',website:'unknown',reviews:0,status:'new',score:68,next:'Verify website, then call'},
{name:'R. Kumar Law Chambers',category:'Law Firm',city:'Lakhisarai',phone:'+91 94728 73969',website:'unknown',reviews:48,status:'new',score:79,next:'Verify website, then call'},
{name:'Vinod Bihari & Associates',category:'Tax Consultant',city:'Mahnar',phone:'+91 94304 16859',website:'unknown',reviews:0,status:'new',score:67,next:'Verify website, then call'},
{name:'India Medical Agencies',category:'Pharmacy',city:'Bihar Sharif',phone:'+91 79037 25318',website:'unknown',reviews:0,status:'new',score:62,next:'Verify website, then call'},
{name:'Ashirvad Agencies',category:'Wholesaler',city:'Bihar Sharif',phone:'',website:'unknown',reviews:4,status:'new',score:63,next:'Verify website, then call'}
];
let leads=JSON.parse(localStorage.getItem('websales-leads')||'null')||seed;
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
function save(){localStorage.setItem('websales-leads',JSON.stringify(leads))}
function score(l){let s=15;if(l.website==='no')s+=30;else if(l.website==='unknown')s+=10;if(+l.reviews>=100)s+=20;else if(+l.reviews>=50)s+=15;else if(+l.reviews>=20)s+=10;if(l.category)s+=10;if(l.city)s+=10;return Math.min(99,s)}
function renderStats(){let total=leads.length,no=leads.filter(x=>x.website==='no').length,warm=leads.filter(x=>['interested','followup'].includes(x.status)).length,won=leads.filter(x=>x.status==='won').length;$('#stats').innerHTML=`<div class="stat"><b>${total}</b><span>Total leads</span></div><div class="stat"><b>${no}</b><span>No website</span></div><div class="stat"><b>${warm}</b><span>Warm prospects</span></div><div class="stat"><b>${won}</b><span>Deals won</span></div>`;$('#heroLeads').textContent=total}
function renderPriority(){let list=[...leads].sort((a,b)=>b.score-a.score).slice(0,3);$('#priorityLeads').innerHTML=list.map(l=>`<article class="lead-card"><div class="muted">${l.category||'Business'} · ${l.city}</div><h4>${l.name}</h4><div class="muted">${l.website==='no'?'No website recorded':'Website: needs verification'} · ${l.reviews||0} reviews</div><div class="card-row"><span class="badge">${l.status}</span><span class="score">${l.score}<small>/100</small></span></div><p class="muted">${l.next}</p></article>`).join('')||'<div class="lead-card">No leads yet.</div>'}
function renderTable(){let q=($('#searchLeads')?.value||'').toLowerCase(),f=$('#filterStatus')?.value||'all';let list=leads.filter(l=>(f==='all'||l.status===f)&&`${l.name} ${l.city} ${l.category}`.toLowerCase().includes(q)).sort((a,b)=>b.score-a.score);$('#leadTable').innerHTML=list.map(l=>`<tr><td><b>${l.name}</b><div class="muted">${l.category||''}</div></td><td>${l.city}</td><td>${l.website==='no'?'❌ No':'⚠ Verify'}</td><td><b>${l.score}</b></td><td><span class="badge">${l.status}</span></td><td>${l.phone?`<a class="phone" href="tel:${l.phone}">${l.phone}</a>`:''}<button class="ghost action" data-i="${leads.indexOf(l)}">${l.next||'Call'}</button></td></tr>`).join('')||'<tr><td colspan="6">No matching leads.</td></tr>'}
function renderAgents(){$('#agentList').innerHTML=agents.map(a=>`<article class="agent-card"><div class="agent-num">${a.icon}</div><div><h3>${a.name}</h3><p>${a.desc}</p></div><span class="status-dot">READY</span></article>`).join('')}
function renderFollowups(){let list=leads.filter(l=>['followup','interested'].includes(l.status));$('#followupsList').innerHTML=list.length?list.map(l=>`<article class="follow-card"><span class="badge">${l.status}</span><h3>${l.name}</h3><div class="muted">${l.city} · Score ${l.score}</div><p class="muted">Next: ${l.next||'Contact prospect'}</p><button class="primary" onclick="advance(${leads.indexOf(l)})">Mark contacted</button></article>`).join(''):'<div class="follow-card"><h3>Queue is empty</h3><p class="muted">Warm leads will appear here.</p></div>'}
function render(){renderStats();renderPriority();renderTable();renderAgents();renderFollowups()}
function advance(i){leads[i].status='contacted';leads[i].next='Await response';save();render();toast('Lead updated')}
function toast(t){let e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800)}
function showView(id){$$('.view').forEach(x=>x.classList.remove('active-view'));$('#'+id).classList.add('active-view');$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===id));$('#pageTitle').textContent=id[0].toUpperCase()+id.slice(1)}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
$('#searchLeads').addEventListener('input',renderTable);$('#filterStatus').addEventListener('change',renderTable);
$('#addLead').onclick=()=>$('#leadModal').classList.add('open');$('#closeModal').onclick=$('#cancelModal').onclick=()=>$('#leadModal').classList.remove('open');
$('#leadForm').onsubmit=e=>{e.preventDefault();let f=new FormData(e.target);let l={name:f.get('name'),category:f.get('category'),city:f.get('city'),phone:f.get('phone'),website:f.get('website'),reviews:+f.get('reviews')||0,status:'new',score:0,next:'Call today'};l.score=score(l);leads.unshift(l);save();render();e.target.reset();$('#leadModal').classList.remove('open');toast('Lead added and scored')};
$('#runPipeline').onclick=()=>{leads=leads.map(l=>({...l,score:score(l)}));save();render();toast('Pipeline refreshed')};
document.addEventListener('click',e=>{if(e.target.classList.contains('action')){let i=+e.target.dataset.i;leads[i].status=leads[i].status==='new'?'contacted':'followup';leads[i].next=leads[i].status==='followup'?'Follow up tomorrow':'Await response';save();render();toast('Next action updated')}});render();