const http=require("http"),fs=require("fs"),path=require("path"),{URL}=require("url");
const PORT=Number(process.env.PORT||5174),ROOT=__dirname,KEY=process.env.CHASTIFY_APP_DEVELOPER_KEY;
const MIME={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8"};
const json=(res,s,d)=>{res.writeHead(s,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"});res.end(JSON.stringify(d))};
const readBody=req=>new Promise((ok,bad)=>{let x="";req.on("data",c=>{x+=c;if(x.length>1000000)req.destroy()});req.on("end",()=>{try{ok(x?JSON.parse(x):{})}catch(e){bad(e)}});req.on("error",bad)});
async function api({sessionId,mainToken,method="GET",route,data}){
 if(!KEY)throw Object.assign(new Error("Missing CHASTIFY_APP_DEVELOPER_KEY"),{status:503});
 if(!sessionId||!mainToken)throw Object.assign(new Error("sessionId and mainToken are required"),{status:400});
 const r=await fetch("https://chastify.net/api/extensions/sessions/"+encodeURIComponent(sessionId)+route,{method,headers:{"Authorization":"Bearer "+KEY,"x-chastify-main-token":mainToken,...(data?{"content-type":"application/json"}:{})},body:data?JSON.stringify(data):undefined});
 const t=await r.text();let d={};try{d=t?JSON.parse(t):{}}catch{d={raw:t}};if(!r.ok)throw Object.assign(new Error(d?.error?.message||"Chastify request failed"),{status:r.status,details:d});return d;
}
http.createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,"http://localhost:"+PORT);
  if(req.method==="GET"&&u.pathname==="/api/health")return json(res,200,{ok:true,configured:Boolean(KEY)});
  if(u.pathname==="/api/state"&&req.method==="GET")return json(res,200,await api({sessionId:u.searchParams.get("sessionId"),mainToken:u.searchParams.get("mainToken"),route:"/state"}));
  if(u.pathname==="/api/state"&&req.method==="POST"){const b=await readBody(req);return json(res,200,await api({sessionId:b.sessionId,mainToken:b.mainToken,method:"PATCH",route:"/state",data:{data:b.data}}))}
  if(u.pathname==="/api/task"&&req.method==="POST"){const b=await readBody(req);if(!["task.assign","task.complete"].includes(b.name))return json(res,400,{error:"unsupported_action"});return json(res,200,await api({sessionId:b.sessionId,mainToken:b.mainToken,method:"POST",route:"/action",data:{name:b.name,params:b.params||{}}}))}
  if(u.pathname.startsWith("/api/"))return json(res,404,{error:"not_found"});
  const requested=u.pathname==="/"?"/index.html":u.pathname,file=path.normalize(path.join(ROOT,requested));
  if(!file.startsWith(ROOT)||!fs.existsSync(file)||fs.statSync(file).isDirectory())return json(res,404,{error:"not_found"});
  res.writeHead(200,{"content-type":MIME[path.extname(file)]||"application/octet-stream","cache-control":"no-cache"});fs.createReadStream(file).pipe(res);
 }catch(e){json(res,e.status||500,{error:e.message||"server_error",details:e.details})}
}).listen(PORT,()=>console.log("Obedience Tracker server listening on "+PORT));
