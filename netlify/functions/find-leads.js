exports.handler = async (event) => {
  if (event.httpMethod === 'GET') {
    return { statusCode: 200, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ok:true, keyConfigured:Boolean(process.env.GOOGLE_MAPS_API_KEY), function:'find-leads'}) };
  }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({error:'POST only'}) };
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return { statusCode: 500, headers:{'Content-Type':'application/json'}, body: JSON.stringify({error:'GOOGLE_MAPS_API_KEY is not available to Netlify Functions. Check the variable name, Functions scope, Production context, then redeploy.'}) };
  try {
    const { state='Bihar', city='All Bihar', category='Any business', count=50, excludeFood=true } = JSON.parse(event.body || '{}');
    const limit=Math.min(Math.max(Number(count)||50,1),60);
    const place=city==='All Bihar'?state:`${city}, ${state}`;
    const categories=category==='Any business'?['business consultant','law firm','clinic','real estate agency','coaching center','salon','professional service','wholesaler']:[category];
    const results=[];
    for(const cat of categories){
      if(results.length>=limit) break;
      const response=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.primaryType'},body:JSON.stringify({textQuery:`${cat} in ${place}`,maxResultCount:20,languageCode:'en',regionCode:'IN'})});
      const raw=await response.text();
      if(!response.ok){
        let detail=raw;try{const j=JSON.parse(raw);detail=j.error?.message||raw}catch{}
        throw new Error(`Google Places ${response.status}: ${detail}`);
      }
      let data={};try{data=JSON.parse(raw)}catch{throw new Error('Google Places returned invalid JSON')}
      for(const p of(data.places||[])){
        const name=p.displayName?.text||'';const address=p.formattedAddress||'';const type=p.primaryType||'';
        if(excludeFood&&/restaurant|cafe|food|bakery|sweet|dhaba|hotel/i.test(`${name} ${address} ${type}`)) continue;
        if(results.some(x=>x.id===p.id)) continue;
        const hasWebsite=Boolean(p.websiteUri);const reviews=p.userRatingCount||0;const rating=p.rating||0;
        const s=Math.min(99,35+(hasWebsite?0:35)+(reviews>=100?20:reviews>=50?15:reviews>=20?10:0)+(rating>=4.5?10:rating>=4?5:0));
        results.push({id:p.id,name,category:cat,city,address,phone:p.nationalPhoneNumber||'',website:hasWebsite?'yes':'no',websiteUri:p.websiteUri||'',reviews,rating,mapsUrl:p.googleMapsUri||'',score:s,status:'new',next:hasWebsite?'Review website, then call':'Call — no website listed'});
        if(results.length>=limit) break;
      }
    }
    results.sort((a,b)=>b.score-a.score);
    return {statusCode:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify({results,source:'Google Places API (New)',query:{state,city,category,count:limit}})};
  }catch(e){return {statusCode:500,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:e.message||'Unknown server error'})};}
};
