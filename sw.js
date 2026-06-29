const CACHE='lc-monsterdb-runtime';

const PRECACHE=[
'/',
'/index.html',
'/icon-192.png',
'/icon-512.png',
'/icon-192-maskable.png',
'/icon-512-maskable.png'
];

self.addEventListener('install',e=>{
 e.waitUntil(caches.open(CACHE).then(async c=>{
   await Promise.allSettled(PRECACHE.map(async u=>{
     try{
      const r=await fetch(u,{cache:'reload'});
      if(r.ok) await c.put(u,r);
     }catch{}
   }));
 }));
 self.skipWaiting();
});

self.addEventListener('activate',e=>{
 e.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});

self.addEventListener('fetch',e=>{
 const req=e.request;
 if(req.method!=='GET') return;
 const url=new URL(req.url);
 if(url.origin!==location.origin) return;
 const dynamic=req.mode==='navigate'||/\.(html|js|json)$/.test(url.pathname)||url.pathname==='/';
 if(dynamic){
  e.respondWith((async()=>{
    try{
      const res=await fetch(req,{cache:'no-store'});
      const c=await caches.open(CACHE);
      c.put(req,res.clone());
      return res;
    }catch{
      return (await caches.match(req))||(await caches.match('/index.html'));
    }
  })());
  return;
 }
 e.respondWith((async()=>{
   const c=await caches.open(CACHE);
   const hit=await c.match(req);
   if(hit) return hit;
   const res=await fetch(req);
   if(res.ok) c.put(req,res.clone());
   return res;
 })());
});

self.addEventListener('message',e=>{
 if(e.data==='SKIP_WAITING') self.skipWaiting();
});
