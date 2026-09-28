const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 5174);
const ROOT = __dirname;
const API_KEY = process.env.CHASTIFY_APP_DEVELOPER_KEY;
const MIME = {
  ".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",
  ".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg"
};

function json(res,status,data){
  res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"});
  res.end(JSON.stringify(data));
}
function body(req){
  return new Promise((resolve,reject)=>{
    let raw="";
    req.on("data",c=>{raw+=c;if(raw.length>1_000_000) req.destroy();});
    req.on("end",()=>{try{resolve(raw?JSON.parse(raw):{});}catch(e){reject(e);}});
    req.on("error",reject);
  });
}
async function chastify({sessionId,mainToken,method="GET",route,body:payload}){
  if(!API_KEY) throw Object.assign(new Error("Server is missing CHASTIFY_APP_DEVELOPER_KEY"),{status:503});
  if(!sessionId || !mainToken) throw Object.assign(new Error("sessionId and mainToken are required"),{status:400});
  const response=await fetch(`https://chastify.net/api/extensions/sessions/${encodeURIComponent(sessionId)}${route}`,{
    method,
    headers:{
      "Authorization":`Bearer ${API_KEY}`,
      "x-chastify-main-token":mainToken,
      ...(payload?{"content-type":"application/json"}:{})
    },
    body:payload?JSON.stringify(payload):undefined
  });
  const text=await response.text();
  let data; try{data=text?JSON.parse(text):{};}catch{data={raw:text};}
  if(!response.ok) throw Object.assign(new Error(data?.error?.message||data?.message||"Chastify API request failed"),{status:response.status,details:data});
  return data;
}

const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,`http://localhost:${PORT}`);
    if(req.method==="GET" && url.pathname==="/api/health") return json(res,200,{ok:true,service:"obedience-tracker",configured:Boolean(API_KEY)});
    if(url.pathname.startsWith("/api/")){
      if(req.method==="POST" && url.pathname==="/api/state"){
        const b=await body(req);
        const data=await chastify({sessionId:b.sessionId,mainToken:b.mainToken,method:"PATCH",route:"/state",body:{data:b.data}});
        return json(res,200,data);
      }
      if(req.method==="GET" && url.pathname==="/api/state"){
        const data=await chastify({sessionId:url.searchParams.get("sessionId"),mainToken:url.searchParams.get("mainToken"),route:"/state"});
        return json(res,200,data);
      }
      if(req.method==="POST" && url.pathname==="/api/action"){
        const b=await body(req);
        const allowed=new Set(["task.assign","task.start_timer","task.complete","add_time","remove_time","freeze","unfreeze","pillory","pillory.end"]);
        if(!allowed.has(b.name)) return json(res,400,{error:"unsupported_action"});
        const data=await chastify({sessionId:b.sessionId,mainToken:b.mainToken,method:"POST",route:"/action",body:{name:b.name,params:b.params||{}}});
        return json(res,200,data);
      }
      return json(res,404,{error:"not_found"});
    }
    const requested=url.pathname==="/"?"/index.html":url.pathname;
    const file=path.normalize(path.join(ROOT,requested));
    if(!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return json(res,404,{error:"not_found"});
    res.writeHead(200,{"content-type":MIME[path.extname(file)]||"application/octet-stream","cache-control":"no-cache"});
    fs.createReadStream(file).pipe(res);
  }catch(e){
    json(res,e.status||500,{error:e.message||"server_error",details:e.details||undefined});
  }
});
server.listen(PORT,()=>console.log(`Obedience Tracker running on http://localhost:${PORT}`));
