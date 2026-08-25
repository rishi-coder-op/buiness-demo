exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({error:'POST only'}) };
  try {
    const { leads=[] } = JSON.parse(event.body || '{}');
    const input=leads.slice(0,50);
    const results=[];
    for(const lead of input){
      const website=lead.websiteUri||'';
      let reachable=false, statusCode=null, title='', metaDescription='';
      if(website){
        try{
          const r=await fetch(website,{redirect:'follow',headers:{'User-Agent':'Mozilla/5.0 WebSalesAI Research Bot'}});
          statusCode=r.status;reachable=r.ok;
          const html=(await r.text()).slice(0,300000);
          title=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]?.replace(/\s+/g,' ').trim()||'';
          metaDescription=(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)||[])[1]?.trim()||'';
        }catch{}
      }
      const issues=[];
      if(!website)issues.push('No website listed');
      else if(!reachable)issues.push('Website unreachable or blocked');
      if(website&&reachable&&!metaDescription)issues.push('Missing meta description');
      if(website&&reachable&&title.length<5)issues.push('Weak/missing page title');
      if(!lead.phone)issues.push('Phone not listed');
      if(!lead.email)issues.push('Email not listed');
      const researchScore=Math.min(100,(website?25:55)+(reachable?10:0)+(lead.phone?10:0)+(lead.email?10:0)+(lead.address?10:0)+(lead.contactCount?Math.min(10,lead.contactCount*3):0)+(issues.length?0:15));
      const verdict=!website?'CALL — website opportunity':(!reachable?'CALL — website needs verification':issues.length>=2?'CALL — website audit opportunity':'REVIEW — website exists');
      results.push({...lead,websiteReachable:reachable,statusCode,title,metaDescription,issues,researchScore,verdict,researchStatus:'researched'});
    }
    return {statusCode:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify({results,source:'WebSales AI Agent 02'})};
  }catch(e){return {statusCode:500,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:e.message||'Research failed'})};}
};
