exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({error:'POST only'}) };
  try {
    const { state='Bihar', city='All Bihar', category='Any business', count=50, excludeFood=true } = JSON.parse(event.body || '{}');
    const limit=Math.min(Math.max(Number(count)||50,1),50);
    const place=city==='All Bihar'?state:`${city}, ${state}`;
    const wanted=category==='Any business'?['office','lawyer','consultant','doctor','clinic','real estate agency','coaching centre','salon','beauty salon','accountant','architect','engineer','wholesaler','shop']:[category];
    const queries=wanted.map(x=>`${x} in ${place}`);
    const results=[];
    for(const q of queries){
      if(results.length>=limit) break;
      const url='https://overpass-api.de/api/interpreter?data='+encodeURIComponent(`[out:json][timeout:25];area["name"="${city==='All Bihar'?'Bihar':city}"][boundary=administrative]->.searchArea;nwr["name"]["${q.split(' ')[0]}"](area.searchArea);out center tags;`);
      let response=await fetch(url,{headers:{'User-Agent':'WebSalesAI/1.0 lead-finder'}});
      if(!response.ok){
        const fallback='https://overpass-api.de/api/interpreter?data='+encodeURIComponent(`[out:json][timeout:25];area["name"="${city==='All Bihar'?'Bihar':city}"][boundary=administrative]->.a;nwr["name"](area.a);out center tags;`);
        response=await fetch(fallback,{headers:{'User-Agent':'WebSalesAI/1.0 lead-finder'}});
      }
      if(!response.ok) continue;
      const data=await response.json();
      for(const el of (data.elements||[])){
        const t=el.tags||{};const name=t.name||'';if(!name) continue;
        const text=`${name} ${t.shop||''} ${t.amenity||''} ${t.office||''} ${t.healthcare||''}`;
        if(excludeFood&&/restaurant|cafe|food|bakery|sweet|dhaba|fast_food/i.test(text)) continue;
        const id=`osm-${el.type}-${el.id}`;if(results.some(x=>x.id===id))continue;
        const website=t.website||t['contact:website']||'';const phone=t.phone||t['contact:phone']||'';const address=[t['addr:housenumber'],t['addr:street'],t['addr:suburb'],t['addr:city']].filter(Boolean).join(', ');
        const reviews=0;const hasWebsite=Boolean(website);const score=Math.min(99,40+(hasWebsite?0:35)+(phone?10:0)+(address?5:0));
        results.push({id,name,category:t.office||t.amenity||t.shop||category,city,address,phone,website:hasWebsite?'yes':'no',websiteUri:website,reviews,rating:0,mapsUrl:`https://www.openstreetmap.org/${el.type}/${el.id}`,score,status:'new',next:hasWebsite?'Review website, then call':'Verify website, then call'});
        if(results.length>=limit)break;
      }
    }
    results.sort((a,b)=>b.score-a.score);
    return {statusCode:200,headers:{'Content-Type':'application/json','Cache-Control':'public,max-age=300'},body:JSON.stringify({results:results.slice(0,limit),source:'OpenStreetMap / Overpass API',query:{state,city,category,count:limit}})};
  } catch(e){ return {statusCode:500,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:e.message||'Lead search failed'})}; }
};
