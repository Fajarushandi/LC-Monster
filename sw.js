const CACHE='lc-monsterdb-static';
const STATIC=[
'/icon-192.png','/icon-512.png','/icon-192-maskable.png','/icon-512-maskable.png'
];
self.addEventListener('install',e=>{
 e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)).catch(()=>{}));
 self.skipWaiting();
});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();});

self.addEventListener('activate',e=>{
 e.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);
 if(url.origin!==location.origin)return;
 const netFirst=url.pathname==='/'||url.pathname.endsWith('.html')||url.pathname.endsWith('.js')||url.pathname.endsWith('.json')||url.pathname==='/manifest.json';
 if(netFirst){
  e.respondWith((async()=>{
    try{
      const res=await fetch(e.request,{cache:'no-store'});
      const c=await caches.open(CACHE);
      c.put(e.request,res.clone());
      return res;
    }catch{
      return (await caches.match(e.request))||Response.error();
    }
  })());
 }else{
  e.respondWith((async()=>{
    const cached=await caches.match(e.request);
    if(cached)return cached;
    const res=await fetch(e.request);
    const c=await caches.open(CACHE);
    c.put(e.request,res.clone());
    return res;
  })());
 }
});
