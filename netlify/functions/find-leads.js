exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' };
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return { statusCode: 500, body: JSON.stringify({ error: 'GOOGLE_MAPS_API_KEY is not configured in Netlify.' }) };
  try {
    const { state='Bihar', city='All Bihar', category='Any business', count=50, excludeFood=true } = JSON.parse(event.body || '{}');
    const place = city === 'All Bihar' ? state : `${city}, ${state}`;
    const categories = category === 'Any business' ? ['business consultant','law firm','clinic','real estate agency','coaching center','salon','professional service','wholesaler'] : [category];
    const results = [];
    for (const cat of categories) {
      if (results.length >= Math.min(Number(count)||50,60)) break;
      const r = await fetch('https://places.googleapis.com/v1/places:searchText', { method:'POST', headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.primaryType'}, body:JSON.stringify({textQuery:`${cat} in ${place}`,maxResultCount:20,languageCode:'en',regionCode:'IN'}) });
      if (!r.ok) throw new Error(`Google Places returned ${r.status}`);
      const data=await r.json();
      for (const p of (data.places||[])) {
        const name=p.displayName?.text||'';
        const address=p.formattedAddress||'';
        if (excludeFood && /restaurant|cafe|food|bakery|sweet|dhaba|hotel/i.test(`${name} ${address} ${p.primaryType||''}`)) continue;
        if (!results.some(x=>x.id===p.id)) results.push({id:p.id,name,category:cat,city,address,phone:p.nationalPhoneNumber||'',website:p.websiteUri?'yes':'no',reviews:p.userRatingCount||0,rating:p.rating||0,mapsUrl:p.googleMapsUri||'',score:Math.min(99,35+(p.websiteUri?0:35)+(p.userRatingCount>=100?20:p.userRatingCount>=50?15:p.userRatingCount>=20?10:0)+(p.rating>=4.5?10:p.rating>=4?5:0)),status:'new',next:p.websiteUri?'Review website, then call':'Call — no website found'});
        if(results.length>=Math.min(Number(count)||50,60)) break;
      }
    }
    results.sort((a,b)=>b.score-a.score);
    return {statusCode:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify({results:results.slice(0,Math.min(Number(count)||50,60)),source:'Google Places API (New)'})};
  } catch(e){ return {statusCode:500,body:JSON.stringify({error:e.message})}; }
};
