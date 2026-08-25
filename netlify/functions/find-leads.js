exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({error:'POST only'}) };
  try {
    const { state='Bihar', city='All Bihar', category='Any business', count=50, excludeFood=true } = JSON.parse(event.body || '{}');
    const limit=Math.min(Math.max(Number(count)||50,1),50);
    const areaName=city==='All Bihar'?'Bihar':city;
    const wanted=category==='Any business'?['office','lawyer','consultant','doctor','clinic','real_estate','coaching','salon','beauty','accountant','architect','engineer','wholesaler','shop']:[category];
    const results=[]; const seen=new Set();
    for(const term of wanted){
      if(results.length>=limit) break;
      const query=`[out:json][timeout:25];area["name"="${areaName}"][boundary=administrative]->.a;(nwr["name"]["office"~"${term}",i](area.a);nwr["name"]["amenity"~"${term}",i](area.a);nwr["name"]["shop"~"${term}",i](area.a);nwr["name"]["healthcare"~"${term}",i](area.a););out center tags;`;
      let response; try{response=await fetch('https://overpass-api.de/api/interpreter?data='+encodeURIComponent(query),{headers:{'User-Agent':'WebSalesAI/1.0'}})}catch{continue}
      if(!response.ok) continue; let data; try{data=await response.json()}catch{continue}
      for(const el of(data.elements||[])){
        const t=el.tags||{},name=t.name||''; if(!name)continue;
        const text=`${name} ${t.shop||''} ${t.amenity||''} ${t.office||''} ${t.healthcare||''}`;
        if(excludeFood&&/restaurant|cafe|food|bakery|sweet|dhaba|fast_food|confectionery/i.test(text))continue;
        const id=`osm-${el.type}-${el.id}`; if(seen.has(id))continue;
        const website=t.website||t['contact:website']||t.url||'',phone=t.phone||t['contact:phone']||'',email=t.email||t['contact:email']||'',whatsapp=t['contact:whatsapp']||'',social=t['contact:facebook']||t['contact:instagram']||t['contact:twitter']||'';
        // Keep only genuinely contactable prospects. A website counts as a contact route.
        if(!phone&&!email&&!whatsapp&&!website&&!social)continue;
        seen.add(id);
        const lat=el.lat??el.center?.lat,lon=el.lon??el.center?.lon,address=[t['addr:housenumber'],t['addr:street'],t['addr:suburb'],t['addr:city'],t['addr:postcode']].filter(Boolean).join(', '),hasWebsite=Boolean(website),contactCount=[phone,email,whatsapp,social,website].filter(Boolean).length;
        const score=Math.min(99,40+(hasWebsite?0:35)+(phone?10:0)+(email?5:0)+(address?5:0));
        results.push({id,name,category:t.office||t.amenity||t.shop||t.healthcare||category,city,address,phone,email,whatsapp,social,website:hasWebsite?'yes':'no',websiteUri:website,reviews:0,rating:0,mapsUrl:`https://www.openstreetmap.org/${el.type}/${el.id}`,lat,lon,contactCount,score,status:'new',next:hasWebsite?'Review website, then call':'Call — no website listed'});
        if(results.length>=limit)break;
      }
    }
    results.sort((a,b)=>b.score-a.score);
    return {statusCode:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify({results:results.slice(0,limit),source:'OpenStreetMap / Overpass API',query:{state,city,category,count:limit,contactableOnly:true}})};
  }catch(e){return {statusCode:500,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:e.message||'Lead search failed'})};}
};
