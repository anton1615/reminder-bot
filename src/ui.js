// WebUI templates. CSS/JS is inlined: no external assets, no build step.
// Note: the content lives inside JS template literals, so never emit a backtick or ${.

const CSS = `
:root{
  --paper:#e8ecf1; --surface:#f8fafc; --ink:#151d29; --muted:#5f6d7c;
  --rule:#d3dbe4; --accent:#c9722a; --on-accent:#fff; --ok:#2f7d5d; --danger:#b4453a;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0; background:var(--paper); color:var(--ink);
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,
    "PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif;
  font-size:15px; line-height:1.6;
}
.wrap{max-width:620px; margin:0 auto; padding:44px 20px 80px}
h1{margin:0; font-size:19px; font-weight:600; letter-spacing:.04em}
.status{margin:6px 0 30px; color:var(--muted); font-size:13px}
.status b{color:var(--ink); font-weight:600}
a,button,input{font:inherit; color:inherit}
button{cursor:pointer}
:focus-visible{outline:2px solid var(--accent); outline-offset:2px; border-radius:3px}

/* add form */
.add{display:flex; gap:8px; flex-wrap:wrap; margin-bottom:34px}
.add input[type=date]{flex:0 0 150px}
.add input[type=text]{flex:1 1 180px; min-width:0}
.add input{
  padding:10px 12px; background:var(--surface); border:1px solid var(--rule);
  border-radius:6px; appearance:none;
}
.add input:focus{border-color:var(--accent)}
.add button{
  flex:0 0 auto; padding:10px 20px; background:var(--ink); color:var(--paper);
  border:1px solid var(--ink); border-radius:6px; font-weight:600;
}
.add button:hover{background:#000}
.add button:disabled{opacity:.5; cursor:default}

/* list */
.list{list-style:none; margin:0; padding:0}
.section{margin:0 0 14px; font-size:12px; color:var(--muted); letter-spacing:.1em}
.section + .list{margin-bottom:34px}
.row{
  display:flex; align-items:flex-start; gap:16px; padding:16px 0;
  border-top:1px solid var(--rule);
}
.row:last-child{border-bottom:1px solid var(--rule)}
.gutter{
  flex:0 0 58px; text-align:center; line-height:1.15;
  font-variant-numeric:tabular-nums;
}
.gutter b{display:block; font-size:28px; font-weight:600; letter-spacing:-.02em}
.gutter span{display:block; font-size:11px; color:var(--muted)}
.row.today .gutter{
  background:var(--accent); color:var(--on-accent); border-radius:6px;
  padding:7px 0 6px; margin:-7px 0 0;
}
.row.today .gutter span{color:var(--on-accent); opacity:.85}
.row-body{flex:1 1 auto; min-width:0; padding-top:2px}
.row-body p{margin:0; word-break:break-word; white-space:pre-wrap}
.row-meta{margin-top:3px; font-size:12px; color:var(--muted)}
.row-meta .due{color:var(--accent); font-weight:600}
.row-meta .late{color:var(--danger); font-weight:600}
.row.sent{opacity:.5}
.row.sent .row-body p{color:var(--muted)}
.del{
  flex:0 0 auto; width:30px; height:30px; margin-top:2px; padding:0; line-height:1;
  background:none; border:1px solid transparent; border-radius:6px;
  color:var(--muted); font-size:18px;
}
.del:hover{border-color:var(--rule); color:var(--danger)}
.empty{padding:26px 0; color:var(--muted); border-top:1px solid var(--rule); border-bottom:1px solid var(--rule)}

/* footer */
.foot{display:flex; gap:10px; align-items:center; margin-top:34px; font-size:13px}
.foot button{
  padding:7px 14px; background:none; border:1px solid var(--rule); border-radius:6px; color:var(--muted);
}
.foot button:hover{border-color:var(--ink); color:var(--ink)}
.foot .msg{color:var(--ok)}
.foot .msg.bad{color:var(--danger)}

@media (max-width:420px){
  .add input[type=date]{flex:1 1 100%}
  .add input[type=text]{flex:1 1 100%}
  .add button{flex:1 1 100%}
}
@media (prefers-reduced-motion:no-preference){
  .list,.empty{animation:in .28s ease-out both}
  @keyframes in{from{opacity:0; transform:translateY(4px)}}
}
`;

const LOGIN_CSS = `
body{display:flex; min-height:100vh; align-items:center; justify-content:center; padding:24px}
.box{width:100%; max-width:300px}
.brand{margin:0 0 4px; font-size:19px; font-weight:600; letter-spacing:.04em}
.hint{margin:0 0 26px; font-size:13px; color:var(--muted)}
form{display:flex; flex-direction:column; gap:10px}
input{
  padding:11px 12px; background:var(--surface); border:1px solid var(--rule);
  border-radius:6px; appearance:none;
}
input:focus{border-color:var(--accent)}
button{
  padding:11px; background:var(--ink); color:var(--paper); border:1px solid var(--ink);
  border-radius:6px; font-weight:600;
}
button:hover{background:#000}
.err{margin:14px 0 0; font-size:13px; color:var(--danger)}
`;

function page(title, css, body, script) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>${CSS}${css}</style>
</head>
<body>
${body}
${script ? `<script>${script}</script>` : ''}
</body>
</html>`;
}

export const LOGIN_HTML = page('Sign in · Reminders', LOGIN_CSS, `
<div class="box">
  <p class="brand">Reminders</p>
  <p class="hint">Private tool. Enter the password to continue.</p>
  <form id="f">
    <input type="password" id="pw" placeholder="Password" autocomplete="current-password" autofocus>
    <button type="submit" id="b">Sign in</button>
  </form>
  <p class="err" id="e" hidden></p>
</div>`, `
var f=document.getElementById('f'), pw=document.getElementById('pw'),
    b=document.getElementById('b'), e=document.getElementById('e');
f.addEventListener('submit', async function(ev){
  ev.preventDefault(); b.disabled=true; e.hidden=true;
  try{
    var res=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({password:pw.value})});
    if(res.ok){ location.reload(); return; }
    var d=await res.json().catch(function(){return {}});
    e.textContent=d.error||'Sign in failed'; e.hidden=false;
  }catch(err){ e.textContent='Could not reach the server'; e.hidden=false; }
  b.disabled=false; pw.select();
});
`);

export const APP_HTML = page('Reminders', '', `
<div class="wrap">
  <h1>Reminders</h1>
  <p class="status" id="status">Loading…</p>

  <form class="add" id="add">
    <input type="date" id="date" required aria-label="Date">
    <input type="text" id="text" placeholder="What should I remind you about?" maxlength="200" required aria-label="Reminder text">
    <button type="submit" id="addbtn">Add</button>
  </form>

  <div id="out"></div>

  <div class="foot">
    <button type="button" id="test">Send test</button>
    <button type="button" id="logout">Sign out</button>
    <span class="msg" id="msg"></span>
  </div>
</div>`, `
var WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
var MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var out=document.getElementById('out'), statusEl=document.getElementById('status'),
    msg=document.getElementById('msg'), addbtn=document.getElementById('addbtn');
var state={today:'', list:[]};

function el(tag,cls,text){ var n=document.createElement(tag); if(cls)n.className=cls; if(text!=null)n.textContent=text; return n; }
function parse(d){ var p=d.split('-'); return {y:+p[0],m:+p[1],d:+p[2],wd:WD[new Date(d+'T00:00:00Z').getUTCDay()]}; }
function days(a,b){ return Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000); }
function say(text,bad){ msg.textContent=text; msg.className='msg'+(bad?' bad':''); }
function plural(n,word){ return n+' '+word+(n===1?'':'s'); }

function row(r,today){
  var p=parse(r.date), diff=days(today,r.date);
  var li=el('li','row'+(r.done?' sent':'')+(r.date===today?' today':''));
  var g=el('div','gutter');
  g.appendChild(el('b',null,String(p.d)));
  g.appendChild(el('span',null,MO[p.m-1]));
  g.appendChild(el('span',null,p.wd));
  var body=el('div','row-body');
  body.appendChild(el('p',null,r.text));
  var meta=el('div','row-meta');
  if(r.done){
    meta.textContent='Sent'+(r.sentAt?' · '+r.sentAt.slice(0,10):'');
  }else if(diff<0){
    meta.appendChild(el('span','late','Overdue '));
    meta.appendChild(document.createTextNode(plural(-diff,'day')+' · '+r.date));
  }else if(diff===0){
    meta.appendChild(el('span','due','Due today'));
    meta.appendChild(document.createTextNode(' · '+r.date));
  }else{
    meta.textContent=r.date+' · in '+plural(diff,'day');
  }
  body.appendChild(meta);
  var del=el('button','del','\\u00d7');
  del.type='button'; del.title='Delete'; del.setAttribute('aria-label','Delete this reminder');
  del.addEventListener('click',async function(){
    del.disabled=true;
    var res=await fetch('/api/reminders/'+r.id,{method:'DELETE'});
    if(res.ok){
      // Do not re-read the list: KV deletes can also be visible late.
      state.list=state.list.filter(function(x){ return x.id!==r.id; });
      render();
    } else { del.disabled=false; say('Could not delete',true); }
  });
  li.appendChild(g); li.appendChild(body); li.appendChild(del);
  return li;
}

function sortList(){
  state.list.sort(function(a,b){ return a.date.localeCompare(b.date) || a.id.localeCompare(b.id); });
}

function render(){
  var today=state.today, list=state.list;
  var t=parse(today);
  statusEl.textContent='';
  statusEl.appendChild(el('b',null,today+' ('+t.wd+')'));
  statusEl.appendChild(document.createTextNode('\u00a0\u00a0Checked daily at 08:00 (UTC+8) — due reminders are sent to you on Discord'));

  out.textContent='';
  var pending=list.filter(function(r){return !r.done;});
  var sent=list.filter(function(r){return r.done;});
  if(!list.length){
    out.appendChild(el('div','empty','No reminders yet. Add one above.'));
    return;
  }
  if(pending.length){
    out.appendChild(el('div','section','PENDING · '+pending.length));
    var ul=el('ul','list');
    pending.forEach(function(r){ ul.appendChild(row(r,today)); });
    out.appendChild(ul);
  }
  if(sent.length){
    out.appendChild(el('div','section','SENT · '+sent.length));
    var ul2=el('ul','list');
    sent.slice().reverse().forEach(function(r){ ul2.appendChild(row(r,today)); });
    out.appendChild(ul2);
  }
}

async function load(){
  var res=await fetch('/api/reminders');
  if(res.status===401){ location.reload(); return; }
  var data=await res.json();
  state.today=data.today; state.list=data.reminders||[];
  render();
}

document.getElementById('add').addEventListener('submit',async function(ev){
  ev.preventDefault();
  var date=document.getElementById('date').value, text=document.getElementById('text').value.trim();
  if(!date||!text) return;
  addbtn.disabled=true; say('');
  var res=await fetch('/api/reminders',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({date:date,text:text})});
  if(res.ok){
    // Insert the returned object directly: KV is eventually consistent, so an
    // immediate re-read may not show the row that was just written.
    state.list.push(await res.json());
    sortList(); render();
    document.getElementById('text').value='';
  }
  else { var d=await res.json().catch(function(){return {}}); say(d.error||'Could not add',true); }
  addbtn.disabled=false;
});

document.getElementById('test').addEventListener('click',async function(){
  var btn=this; btn.disabled=true; say('Sending…');
  var res=await fetch('/api/test',{method:'POST'});
  var d=await res.json().catch(function(){return {}});
  say(res.ok?'Sent — check your Discord DMs':(d.error||'Could not send'),!res.ok);
  btn.disabled=false;
});

document.getElementById('logout').addEventListener('click',async function(){
  await fetch('/api/logout',{method:'POST'});
  location.reload();
});

(function init(){
  var d=new Date(), pad=function(n){return String(n).padStart(2,'0');};
  document.getElementById('date').value=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
})();
load();
`);
