const demoTasks=[
 {id:1,name:"Morning routine",points:10,due:"09:00",frequency:"daily",proof:false,done:false},
 {id:2,name:"Exercise",points:15,due:"18:00",frequency:"daily",proof:false,done:false},
 {id:3,name:"Evening check-in",points:5,due:"21:00",frequency:"daily",proof:true,done:false}
];
let tasks=JSON.parse(localStorage.getItem("ob.tasks")||"null")||demoTasks;
let points=Number(localStorage.getItem("ob.points")||0);
const $=id=>document.getElementById(id);
function save(){localStorage.setItem("ob.tasks",JSON.stringify(tasks));localStorage.setItem("ob.points",String(points))}
function render(){
 const done=tasks.filter(t=>t.done).length,total=tasks.length;
 $("pointsValue").textContent=points;$("completedCount").textContent=done;$("taskCount").textContent=total;
 $("progressBar").style.width=total?((done/total)*100)+"%":"0%";$("streakValue").textContent=done?done+" day"+(done===1?"":"s"):"0 days";
 $("rewardCount").textContent=Math.floor(points/50);
 $("taskList").innerHTML=tasks.map(t=>`<article class="task ${t.done?"done":""}">
 <input type="checkbox" ${t.done?"checked":""} data-id="${t.id}">
 <div class="task-main"><div class="task-title">${escapeHtml(t.name)}</div><div class="task-meta">Due ${t.due} · ${t.frequency} · ${t.proof?"Proof required · ":""}<span class="pill">+${t.points} pts</span></div></div></article>`).join("");
 document.querySelectorAll("#taskList input").forEach(el=>el.onchange=()=>toggle(Number(el.dataset.id)));
}
function toggle(id){const t=tasks.find(x=>x.id===id);if(!t)return;t.done=!t.done;points=Math.max(0,points+(t.done?t.points:-t.points));save();render();}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}
$("dateLabel").textContent=new Intl.DateTimeFormat(undefined,{weekday:"long",month:"long",day:"numeric"}).format(new Date());
$("addTaskBtn").onclick=()=> $("taskEditor").classList.remove("hidden");
$("closeEditor").onclick=()=> $("taskEditor").classList.add("hidden");
$("saveTask").onclick=()=>{
 const name=$("taskName").value.trim();if(!name)return;
 tasks.push({id:Date.now(),name,points:Number($("taskPoints").value)||0,due:$("taskDue").value||"—",frequency:$("taskFrequency").value,proof:$("taskProof").checked,done:false});
 save();render();$("taskEditor").classList.add("hidden");$("taskName").value="";
};
function initChastify(){
 const raw=location.hash.slice(1);if(!raw)return;
 try{
   const data=JSON.parse(decodeURIComponent(raw));
   $("connectionStatus").textContent="Chastify session";
   if(data.ui?.theme) document.documentElement.dataset.theme=data.ui.theme;
   const req={type:"chastify:ext:req",v:1,id:crypto.randomUUID(),nonce:data.bridge?.nonce,action:"session.get",payload:{}};
   if(data.bridge?.parentOrigin) parent.postMessage(req,data.bridge.parentOrigin);
 }catch(e){console.warn("Chastify launch payload unavailable",e)}
}
window.addEventListener("message",e=>{if(e.data?.type==="chastify:ext:resp"&&e.data.ok){$("connectionStatus").textContent="Connected to Chastify"}});
render();initChastify();