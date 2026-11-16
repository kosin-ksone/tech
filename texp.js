/* ===== เบิกค่าใช้จ่ายรายเดือน (ช่าง) · พี่ฝน 16 พ.ย. 69 — ทำแบบเดียวกับแอปเซล (exp.js) =====
   ฟอร์ม "ค่ารถและค่าใช้จ่ายติดต่องาน" ของช่าง (ตัวอย่าง ปราโมทย์ ต.ค. 69): ค่าจุด (ช่าง กทม 75 · ปริมณฑล 100) · เบี้ยเลี้ยงเขต กทม 125/250 · เขต ตจว 100/200
   โรงแรม ≤550 (พักบ้าน 300) · OT ระบุช่วงเวลา · อื่นๆ (รถทัวร์ · เครื่องบิน=ทัวร์×1.2 · เหมาจ่ายทริป กทม 300/150) · ไม่มีค่าน้ำมัน ×4
   + ใบกรอกไมล์ (ฟลีทการ์ด/เติมเอง/ทางด่วน…) + รูปหน้าปัดไมล์ → ระบบ (ธงให้บัญชีดูคนเดียว)
   ดึง รพ. + ค่าจุด + เบี้ยเลี้ยง จากรายงานช่างให้เอง · ลงพิกัดบ้านครั้งแรก · ข้อมูลเก็บในเครื่อง (kosin_tech_exp_*) + ไฟล์สำรอง */
(function(){
var EXP_VER='v1.3 · 16 พ.ย. 69';
function gOn(){ return !isBkk(); }   // ช่าง กทม. ขี่มอเตอร์ไซค์ → กรอกระยะเอง ไม่ใช้ Google (ระยะรถยนต์ยาวกว่าจริง) · พี่ฝน 16 พ.ย. 69
var me=null;
function T(){ return window.currentTech||(typeof currentTech!=='undefined'?currentTech:null); }
function isBkk(){ var t=T(); return !t||(t.region||'กทม./ปริมณฑล')==='กทม./ปริมณฑล'; }
function toast(m){ var d=document.createElement('div'); d.textContent=m; d.style.cssText='position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:rgba(46,34,27,.92);color:#fff;padding:9px 16px;border-radius:20px;font-size:13px;z-index:200;max-width:86%;text-align:center'; document.body.appendChild(d); setTimeout(function(){ d.remove(); },2200); }
function modal(t,b,btns){ return showModal({title:t,body:b,buttons:btns||[{label:'ตกลง',val:1}]}).then(function(x){ return x&&x.val; }); }
function isHoliday(k){ var i=dayInfo(k)||{}; return {off:!!i.off,why:i.name||'วันหยุด'}; }
function resizeDataURL(src,max,q){ return new Promise(function(res){ var im=new Image(); im.onload=function(){ var w=im.width,h=im.height,s=Math.min(1,max/Math.max(w,h)), c=document.createElement('canvas'); c.width=Math.round(w*s); c.height=Math.round(h*s); c.getContext('2d').drawImage(im,0,0,c.width,c.height); res(c.toDataURL('image/jpeg',q)); }; im.onerror=function(){ res(src); }; im.src=src; }); }
function myRecsT(){ var t=T(); return t?getReports().filter(function(r){ return r.tech===t.name; }):[]; }
var VEH={P:'รถส่วนตัว',C:'รถบริษัท',M:'มอเตอร์ไซค์',O:'ไปกับคนอื่น'}, VCOL={C:5,P:6,M:7,O:8};
function ALWS(){ return isBkk()?[['n','ไม่มี',0],['h','ครึ่งวัน 125',125],['f','เต็มวัน 250',250]]:[['n','ไม่มี',0],['h','ครึ่งวัน 100',100],['f','เต็มวัน 200',200]]; }   // กทม → คอลัมน์ J · ตจว → K
var LABELS=['วันหยุด','วันหยุดนักขัต','ลาพักร้อน','ลาป่วย','ลากิจ','ทำงานในเขต center','เข้าออฟฟิศ'];
var MAXLEG=7, HOTEL_MAX=550, HOME_STAY=300, TRIP=[['300','เหมาทริป กทม 300'],['150','ครึ่งวัน 150']];
var expYM='', expTab='trip', st=null;

function E(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function num(v){ v=parseFloat(String(v==null?'':v).replace(/,/g,'')); return isFinite(v)?v:0; }
function money(v){ return (Math.round(v*100)/100).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function km1(v){ return (Math.round(v*10)/10).toLocaleString('th-TH',{maximumFractionDigits:1}); }
function LS(k,d){ try{ var v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } }
function SS(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); return true; }catch(e){ toast('เครื่องเต็ม บันทึกไม่ได้'); return false; } }
function kProf(){ return 'kosin_tech_expprof_'+me.nick; }
function kMon(){ return 'kosin_tech_exp_'+me.nick+'_'+expYM; }
var K_ROUTE='kosin_tech_routes';
window.EXP_IS_TECH=function(){ return !!T(); };   // ช่างทุกคน (กทม + ตจว)

function pvName(x){ x=String(x||'').trim(); return (x==='กทม'||x==='กทม.'||x==='กรุงเทพมหานคร')?'กรุงเทพ':x; }
function prof(){ var p=LS(kProf(),null), t=T()||{}, mh=isBkk()?[]:((window.TCJ_HOME||{})[t.name]||[]).filter(function(x){ return x&&x!=='กทม'; });
  if(!p){ var v=String(t.vehicle||''); p={center:isBkk()?'กรุงเทพ':pvName(mh[0]||''),veh:/จักรยานยนต์|มอเตอร์/.test(v)?'M':'P',plate:''}; }
  if(!p.homes){ p.homes=(mh.length?mh.slice(0,2):['']).map(function(x){ return {name:x?'บ้าน'+pvName(x):'บ้าน',at:''}; }); }
  if(isBkk()) p.homes=p.homes.slice(0,1); else while(p.homes.length<2) p.homes.push({name:'',at:''});   // ช่าง กทม. บ้านจุดเดียว (พี่ฝน 16 พ.ย. 69) · ตจว. ได้ 2 ที่
  p.home=p.homes[0].name; return p; }   // ฐานบ้าน 2 ที่ (เซล ตจว.) · home = บ้านหลัก
function homeNames(P){ return P.homes.map(function(h){return String(h.name||'').trim();}).filter(Boolean); }
function isHome(x,P){ return homeNames(P).indexOf(String(x||'').trim())>-1; }
function homeAt(x,P){ var h=P.homes.filter(function(h){ return String(h.name||'').trim()===String(x||'').trim(); })[0]; return h?h.at:''; }
function nearHome(place,P){ var pv=provOf(place), hs=homeNames(P); for(var i=0;i<hs.length;i++){ if(pv&&hs[i].indexOf(pv)>-1) return hs[i]; } return ''; }
function saveProf(p){ SS(kProf(),p); }
function provOf(h){ h=String(h||'').trim(); if(!h) return ''; if(/^ออฟฟิศ\s*กทม/.test(h)) return 'กรุงเทพ'; var m=h.match(/^ออฟฟิศ\s*(\S+)/); if(m) return m[1]==='หาดใหญ่'?'สงขลา':m[1];
  var b=(window.HOSPITALS||[]).filter(function(x){ return x.name===h; })[0]; if(b) return b.area==='ปริมณฑล'?'ปริมณฑล':pvName(b.area);
  try{ var ti=tcjInfo(h); if(ti&&ti.province) return pvName(ti.province); }catch(e){} return ''; }
function inCenter(pv,c){ if(!pv||!c) return true; if(isBkk()&&(pv==='กรุงเทพ'||pv==='ปริมณฑล'||(typeof PARIMONTHON!=='undefined'?PARIMONTHON:[]).indexOf(pv)>-1)) return true; return String(c).indexOf(pv)>-1||pv.indexOf(String(c).replace(/^บ้าน/,''))>-1; }
function routes(){ return LS(K_ROUTE,{}); }
function rKey(a,b){ return String(a).trim()+'|'+String(b).trim(); }
function memKm(a,b){ var r=routes(); return r[rKey(a,b)]!=null?r[rKey(a,b)]:(r[rKey(b,a)]!=null?r[rKey(b,a)]:null); }
function learnKm(a,b,k){ if(!a||!b||!(k>0)) return; var r=routes(); r[rKey(a,b)]=k; SS(K_ROUTE,r); }
function daysIn(ym){ var p=ym.split('-'); return new Date(+p[0],+p[1],0).getDate(); }
function dstr(ym,d){ return ym+'-'+('0'+d).slice(-2); }
var DOW=['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'], MN=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'], MNE=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function load(){ st=LS(kMon(),null)||{days:{},car:{fuel:[]}}; st.days=st.days||{}; st.car=st.car||{fuel:[]}; st.car.fuel=st.car.fuel||[]; }
function save(){ SS(kMon(),st); }
function isHotel(s){ return /โรงแรม|hotel|รีสอร์ท|resort|ที่พัก|อินน์|inn/i.test(String(s||'')); }

/* วันจากรายงาน (ยังไม่เคยแก้) */
function dayRecs(k){ return myRecsT().filter(function(r){return r.dateKey===k;}).sort(function(a,b){return String(a.ts||'')<String(b.ts||'')?-1:1;}); }
function reportPlaces(k){ var seen={}, out=[]; dayRecs(k).forEach(function(r){ var h=String(r.hospital||'').trim(); if(h&&!seen[h]){ seen[h]=1; out.push(h); } }); return out; }
function reportPt(k,h){ var v=0; if(/^ออฟฟิศ/.test(h)) return 0; dayRecs(k).forEach(function(r){ if(String(r.hospital||'').trim()===h&&r.allowanceType==='ค่าจุด'&&num(r.travel)>v) v=num(r.travel); }); return v; }   // ค่าจุดตามที่แอปคิดตอนรายงาน (75/100)
function reportAlw(k){ var a='n'; dayRecs(k).forEach(function(r){ if(r.allowanceType==='เบี้ยเลี้ยง'&&num(r.travel)>0) a=(/ครึ่ง/.test(r.period||'')&&a!=='f')?'h':'f'; }); return a; }
function reportOt(k){ return dayRecs(k).some(function(r){ return !!r.ot; }); }
function prevEnd(k,depth){ var p=addDays(k,-1); if(p.slice(0,7)!==expYM||(depth||0)>31) return ''; var d=st.days[p]||autoDay(p,(depth||0)+1); if(d&&d.legs&&d.legs.length){ var t=d.legs[d.legs.length-1].to; if(isHotel(t)||isHome(t,prof())) return t; } return prevEnd(p,(depth||0)+1); }
function autoDay(k,depth){
  var P=prof(), pl=reportPlaces(k), hol=isHoliday(k), d={auto:true,veh:P.veh,label:'',start:'',legs:[],alw:'n',hotel:'',ot:'',other:'',otherNote:''};
  if(!pl.length){ d.label=hol.off?'วันหยุด':''; return d; }
  d.start=prevEnd(k,depth)||P.home;
  var from=d.start; pl.slice(0,MAXLEG-1).forEach(function(h){ var pt=isBkk()?reportPt(k,h):0; d.legs.push({to:h,km:kmGuess(from,h),pt:pt?String(pt):''}); from=h; });
  var back=nearHome(from,P)||(isHome(d.start,P)?d.start:P.home); d.legs.push({to:back,km:kmGuess(from,back)});
  d.alw=reportAlw(k);
  return d;
}
function kmGuess(a,b){ var m=memKm(a,b); return m!=null?String(m):''; }
function day(k){ if(!st.days[k]) return autoDay(k); return st.days[k]; }
function touch(k){ if(!st.days[k]||st.days[k].auto){ var d=day(k); d.auto=false; st.days[k]=d; } return st.days[k]; }
function alwOf(d){ var A=ALWS(); return A.filter(function(a){return a[0]===d.alw;})[0]||A[0]; }
function dayCalc(d){ var km=0, pt=0; (d.legs||[]).forEach(function(l){ km+=num(l.km); pt+=num(l.pt); }); var a=alwOf(d); return {km:km,pt:pt,alw:a[2],hotel:num(d.hotel),other:num(d.other),tot:pt+a[2]+num(d.hotel)+num(d.other)}; }
function monthCalc(){ var n=daysIn(expYM), s={km:0,pt:0,alw:0,hotel:0,other:0,tot:0,days:0}; for(var i=1;i<=n;i++){ var c=dayCalc(day(dstr(expYM,i))); ['km','pt','alw','hotel','other','tot'].forEach(function(f){s[f]+=c[f];}); if(c.km>0||c.tot>0) s.days++; } return s; }
function carCalc(){ var c=st.car, fuel=c.fuel.reduce(function(a,b){return a+num(b);},0), tot=fuel+['fleet','toll','park','oil','tire','ins','repair'].reduce(function(a,f){return a+num(c[f]);},0); return {run:num(c.mEnd)-num(c.mStart),fuel:fuel,tot:tot}; }

/* ---------- หน้าจอ ---------- */
var CSS='<style id="expCss">'
 +'#expOv{--brand:#5E3D29;--brand2:#8A5A3C;--gold-lt:#F3D58A;--gold-dk:#A07A1F;--gold-tint:#FFF8E6;--red:#D9412F;--red2:#B8321F;--red-tint:#FDE7E3}'
 +'#expOv .hero{background:linear-gradient(135deg,var(--brand),var(--brand2));color:#fff;border:1.5px solid var(--gold);border-radius:16px;padding:13px 15px;margin-bottom:12px}#expOv .hero .t{font-size:11.5px;color:var(--gold-lt)}#expOv .hero .n{font-size:20px;font-weight:700;margin-top:2px}#expOv .hero .s{font-size:12px;color:#F2E8DF;margin-top:3px}'
 +'#expOv .lbl{font-size:12.5px;color:var(--brand);font-weight:700;margin:0 0 7px;display:flex;align-items:center;gap:6px}#expOv .lbl .dot{width:8px;height:8px;border-radius:50%;background:var(--gold);flex-shrink:0}'
 +'#expOv .field{min-height:0}#expOv .send{background:linear-gradient(135deg,var(--red),var(--red2));color:#fff;border:1.5px solid var(--gold);font-weight:700;font-size:15px;padding:13px 16px;border-radius:12px;cursor:pointer;width:100%;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px}'
 +'#expOv .send.navy{background:linear-gradient(135deg,var(--brand),var(--brand2))}#expOv .send.ghost{background:#fff;color:var(--brand);border:1.5px solid var(--brand)}#expOv .send:disabled{opacity:.5}'
 +'#expOv .wkbtn{border:1px solid var(--line2);background:#fff;border-radius:9px;width:40px;height:36px;font-size:15px;cursor:pointer;font-family:inherit;color:var(--brand)}#expOv .wknav{display:flex;align-items:center;gap:8px;margin-bottom:10px}#expOv .wknav .c{flex:1;text-align:center}#expOv .wknav .c b{display:block;font-size:14.5px;color:var(--brand)}#expOv .wknav .c small{font-size:11px;color:var(--mut)}'
 +'#expOv .ver{text-align:center;font-size:10.5px;color:var(--mut2);margin:18px 0 4px}#expOv .ver b{color:var(--gold-dk)}'
 +'.xleg .pt{width:58px;border:1px solid var(--line2);border-radius:9px;padding:8px 4px;font:inherit;font-size:13px;background:#fff;color:var(--brand)}'
 +'#expOv{position:fixed;inset:0;z-index:120;background:var(--bg);overflow:auto;-webkit-overflow-scrolling:touch}'
 +'#expOv .xw{max-width:560px;margin:0 auto;padding:0 14px 120px}'
 +'#expOv .xtop{position:sticky;top:0;z-index:5;background:#fff;border-bottom:3px solid var(--gold);display:flex;align-items:center;gap:10px;padding:10px 14px;margin:0 -14px 12px}'
 +'#expOv .xtop b{flex:1;color:var(--brand);font-size:16px}'
 +'.xseg{display:flex;background:var(--brand-tint);border-radius:12px;padding:4px;margin-bottom:12px}.xseg button{flex:1;border:0;background:none;border-radius:9px;padding:10px;font:inherit;font-weight:700;color:var(--brand);cursor:pointer}.xseg button.on{background:var(--brand);color:#fff}'
 +'.xsum{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-size:11px;color:var(--mut)}.xsum b{display:block;font-size:14px;color:var(--brand)}'
 +'.xday{background:#fff;border:1px solid var(--line);border-left:4px solid var(--gold);border-radius:12px;padding:10px 12px;margin-bottom:8px}'
 +'.xday.off{border-left-color:var(--line2);background:#faf8f4;padding:8px 12px}'
 +'.xdh{display:flex;align-items:center;gap:8px}.xdh .d{font-weight:700;color:var(--brand);min-width:78px}.xdh .t{margin-left:auto;font-weight:700;color:var(--brand)}'
 +'.xtag{font-size:10.5px;padding:1px 8px;border-radius:20px;background:var(--danger-bg);color:var(--danger)}.xtag.ok{background:var(--ok-bg);color:var(--ok)}.xtag.am{background:var(--amber-bg);color:var(--amber)}'
 +'.xleg{display:flex;gap:6px;align-items:center;margin-top:6px}.xleg .ar{color:var(--gold-dk);font-weight:700;width:14px;text-align:center}'
 +'.xleg input{border:1px solid var(--line2);border-radius:9px;padding:8px 9px;font:inherit;font-size:14px;min-width:0;background:#fff}.xleg .pl{flex:1}.xleg .km{width:76px;text-align:right}.xleg .km.need{border-color:var(--red);background:var(--red-tint)}'
 +'.xleg .x{border:0;background:none;color:var(--red);font-size:18px;cursor:pointer;width:24px}'
 +'.xpv{font-size:10.5px;color:var(--mut);margin:1px 0 0 20px}.xpv.out{color:var(--amber);font-weight:700}'
 +'.xsug{border:1px dashed var(--accent);background:var(--accent-bg);color:var(--accent);border-radius:9px;padding:6px 8px;font:inherit;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}'
 +'.xchips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.xchip{border:1px solid var(--line2);background:#fff;border-radius:20px;padding:7px 11px;font:inherit;font-size:12.5px;color:var(--brand);cursor:pointer}.xchip.on{background:var(--brand);border-color:var(--gold);color:#fff;font-weight:700}'
 +'.xrow{display:flex;gap:6px;align-items:center;margin-top:8px;font-size:12.5px;color:var(--brand)}.xrow input,.xrow select{border:1px solid var(--line2);border-radius:9px;padding:8px 9px;font:inherit;font-size:14px;min-width:0;background:#fff}'
 +'.xmini{border:1px solid var(--gold);background:var(--gold-tint);color:var(--brand);border-radius:20px;padding:6px 11px;font:inherit;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}'
 +'.xwarn{font-size:11.5px;color:var(--danger);margin-top:4px;font-weight:700}'
 +'.xbig{display:flex;gap:10px}.xbig>div{flex:1}'
 +'.xph{border:2px dashed var(--gold);background:var(--gold-tint);border-radius:12px;min-height:104px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:var(--brand);font-weight:700;font-size:13px;cursor:pointer;position:relative;overflow:hidden}'
 +'.xph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.xph .ok{position:absolute;bottom:4px;left:4px;background:var(--ok);color:#fff;border-radius:20px;font-size:10.5px;padding:1px 8px}'
 +'.xbill{display:inline-flex;align-items:center;gap:6px;background:var(--brand-tint);color:var(--brand);border-radius:20px;padding:5px 10px;font-size:13px;font-weight:700;margin:4px 6px 0 0}.xbill b{color:var(--red);cursor:pointer}'
 +'.xdl{position:fixed;left:0;right:0;bottom:0;background:linear-gradient(rgba(255,252,247,0),var(--bg) 25%);padding:14px 14px calc(12px + env(safe-area-inset-bottom));z-index:6}.xdl .in{max-width:532px;margin:0 auto;display:flex;gap:8px}'
 +'@keyframes xbl{50%{opacity:.45}}.xbusy{animation:xbl .8s infinite}'
 +'</style>';

window.openExpense=function(ym){
  var t=T(); if(!t) return; me={nick:t.name,full:t.name}; setupSkip=false;
  try{ syncPull(); }catch(e){}
  if(!document.getElementById('expCss')) document.head.insertAdjacentHTML('beforeend',CSS);
  var n=new Date(); expYM=ym||expYM||(n.getDate()<=10? dkey(new Date(n.getFullYear(),n.getMonth()-1,1)) : dkey(n)).slice(0,7);
  load(); setTimeout(mileRetry,1500);
  var o=document.getElementById('expOv'); if(!o){ o=document.createElement('div'); o.id='expOv'; document.body.appendChild(o); }
  document.body.style.overflow='hidden';
  try{ history.pushState(Object.assign({},history.state||{},{exp:1}),''); }catch(e){}
  render();
};
window.addEventListener('popstate',function(e){ if(document.getElementById('expOv')&&!(e.state&&e.state.exp)) closeExp(true); });
function closeExp(fromPop){ var o=document.getElementById('expOv'); if(o) o.remove(); document.body.style.overflow=''; if(!fromPop&&history.state&&history.state.exp) try{ history.back(); }catch(e){} }
window.expClose=function(){ closeExp(false); };
window.expMon=function(dl){ var p=expYM.split('-'), d=new Date(+p[0],+p[1]-1+dl,1); expYM=dkey(d).slice(0,7); load(); render(); };
window.expSetTab=function(t){ expTab=t; render(); };

/* ---------- ตั้งค่าครั้งแรก: บันทึกบ้าน 2 ที่ (พี่ฝน 15 พ.ย. 69) ---------- */
var setupSkip=false;
function needSetup(P){ return !P.setupDone && P.homes.some(function(h){ return String(h.name||'').trim()&&!h.at; }); }
function parseLoc(s){ s=String(s||'').trim(); var m=s.match(/@(-?\d{1,2}\.\d+),\s*(-?\d{2,3}\.\d+)/)||s.match(/[?&](?:q|query|ll|destination)=(-?\d{1,2}\.\d+)(?:,|%2C)\s*(-?\d{2,3}\.\d+)/i)||s.match(/^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{2,3}\.\d+)$/);
  return m?(+m[1]).toFixed(5)+','+(+m[2]).toFixed(5):s; }   // ลิงก์ Google Maps / lat,lng → พิกัด · ที่อยู่ → เก็บข้อความ (หลังบ้านหาพิกัดให้)
function setupHtml(P){
  var h='<div class="hero"><div class="t">ตั้งค่าครั้งแรก</div><div class="n">ลงทะเบียนพิกัดบ้าน</div><div class="s">ใช้หาระยะจากบ้านไป รพ./ออฟฟิศ ให้อัตโนมัติ · ทำครั้งเดียว '+(isBkk()?'':' · บ้านที่ 2 ไม่มีเว้นว่างได้')+'</div></div>';
  P.homes.forEach(function(x,i){
    var ok=!!x.at, isCo=/^-?\d+\.\d+,-?\d+\.\d+$/.test(x.at||'');
    h+='<div class="card"><div class="lbl"><span class="dot"></span>'+(P.homes.length>1?'ฐานบ้านที่ '+(i+1):'บ้าน')+(i?' <span style="font-weight:400;color:var(--mut)">(ถ้ามี)</span>':'')+(ok?' <span class="xtag ok" style="margin-left:auto">✓ บันทึกแล้ว</span>':'')+'</div>'
      +'<input class="field" value="'+E(x.name)+'" placeholder="ชื่อ เช่น บ้าน หรือ บ้านขอนแก่น" onchange="expHome('+i+',this.value)">'
      +'<button class="send navy" style="margin-top:10px" onclick="expHomeGps(this,'+i+')">📍 ตอนนี้อยู่ที่บ้านนี้ · ใช้ตำแหน่งตอนนี้</button>'
      +'<div style="text-align:center;font-size:12px;color:var(--mut);margin:8px 0 6px">หรือ ถ้าไม่ได้อยู่ที่บ้านนี้</div>'
      +'<input class="field" id="xLoc'+i+'" value="'+E(ok&&!isCo?x.at:'')+'" placeholder="พิมพ์ที่อยู่ (ตำบล อำเภอ จังหวัด) หรือวางลิงก์ Google Maps">'
      +'<button class="send ghost" style="margin-top:8px" onclick="expHomeTxt('+i+')">บันทึกที่อยู่นี้</button>'
      +(ok?'<div style="font-size:11.5px;color:var(--ok);margin-top:6px">ตำแหน่ง: '+E(x.at)+'</div>':'')+'</div>';
  });
  h+='<button class="send" onclick="expSetupDone()">'+(needSetup(P)?'ข้ามไปก่อน (ถามใหม่ครั้งหน้า)':'✓ เสร็จแล้ว เริ่มเบิกค่าใช้จ่าย')+'</button>'
    +'<div style="font-size:11px;color:var(--mut);text-align:center;margin-top:8px">แก้ไขภายหลังได้ที่ "ข้อมูลผู้เบิก" ในหน้าเบิก</div>';
  return h;
}
window.expHomeTxt=function(i){ var el=document.getElementById('xLoc'+i), v=parseLoc(el&&el.value); if(!v){ el&&el.focus(); toast('พิมพ์ที่อยู่ก่อนนะคะ'); return; } var P=prof(); if(!P.homes[i].name){ toast('ใส่ชื่อบ้านก่อนนะคะ'); return; } P.homes[i].at=v; saveProf(P); toast('บันทึกแล้ว'); render(); };
window.expSetupDone=function(){ var P=prof(); if(needSetup(P)) setupSkip=true; else { P.setupDone=true; saveProf(P); } render(); };

function render(){
  var o=document.getElementById('expOv'); if(!o) return;
  var p=expYM.split('-'), y=+p[0], m=+p[1]-1, P=prof();
  if(needSetup(P)&&!setupSkip){ o.innerHTML='<div class="xw"><div class="xtop"><button class="wkbtn" onclick="expClose()">‹</button><b>เบิกค่าใช้จ่ายรายเดือน</b><span style="font-size:11px;color:var(--mut)">'+E(me.nick)+'</span></div>'+setupHtml(P)+'</div>'; o.scrollTop=0; return; }
  var h='<div class="xw"><div class="xtop"><button class="wkbtn" onclick="expClose()">‹</button><b>เบิกค่าใช้จ่ายรายเดือน</b><span style="font-size:11px;color:var(--mut)">'+E(me.nick)+'</span></div>';
  h+='<div class="xseg"><button class="'+(expTab==='trip'?'on':'')+'" onclick="expSetTab(\'trip\')">🚗 ค่าเดินทาง</button><button class="'+(expTab==='car'?'on':'')+'" onclick="expSetTab(\'car\')">⛽ ใบกรอกไมล์</button></div>';
  h+='<div class="wknav"><button class="wkbtn" onclick="expMon(-1)">‹</button><div class="c"><b>'+MN[m]+' '+(y+543)+'</b><small>แตะลูกศรเพื่อเปลี่ยนเดือน</small></div><button class="wkbtn" onclick="expMon(1)">›</button></div>';
  h+= expTab==='trip'? tripHtml(P) : carHtml(P);
  h+='<div class="ver">เบิกค่าใช้จ่าย <b>'+EXP_VER+'</b> · Developed by KOSIN</div></div>';
  h+='<div class="xdl"><div class="in">'+(expTab==='trip'
     ?'<button class="send navy" id="xdlBtn" onclick="expXlsxTrip()">📊 Excel · ค่ารถและค่าใช้จ่ายติดต่องาน</button>'
     :'<button class="send navy" id="xdlBtn" onclick="expXlsxCar()">📊 Excel · ใบกรอกไมล์</button>')+'</div></div>';
  var sy=o.scrollTop; o.innerHTML=h; o.scrollTop=sy;
}
function heroTrip(){ var s=monthCalc(); return '<div class="hero"><div class="t">ค่ารถและค่าใช้จ่ายติดต่องาน · เดือน '+MN[+expYM.slice(5)-1]+'</div><div class="n" id="xTot">'+money(s.tot)+' บาท</div><div class="s" id="xSub">ทำงาน '+s.days+' วัน · '+km1(s.km)+' กม.</div></div>'
  +'<div class="card xsum" id="xSum">'+sumCells(s)+'</div>'; }
function sumCells(s){ return '<div>ค่าจุด<b>'+money(s.pt)+'</b></div><div>เบี้ยเลี้ยง<b>'+money(s.alw)+'</b></div><div>โรงแรม<b>'+money(s.hotel)+'</b></div><div>อื่นๆ<b>'+money(s.other)+'</b></div><div>ระยะทาง<b>'+km1(s.km)+' กม.</b></div><div>ทำงาน<b>'+s.days+' วัน</b></div>'; }
function profHtml(P){
  return '<div class="card"><div class="lbl"><span class="dot"></span>ข้อมูลผู้เบิก (กรอกครั้งเดียว)</div>'
   +'<div class="xrow"><span style="width:86px">Center</span><input style="flex:1" value="'+E(P.center)+'" onchange="expProf(\'center\',this.value)" placeholder="จังหวัด center เช่น กรุงเทพ"></div>'
   +'<div class="xrow"><span style="width:86px">พาหนะหลัก</span><select style="flex:1" onchange="expProf(\'veh\',this.value)">'+Object.keys(VEH).map(function(k){return '<option value="'+k+'"'+(P.veh===k?' selected':'')+'>'+VEH[k]+'</option>';}).join('')+'</select></div>'
   +'<div class="xrow"><span style="width:86px">ทะเบียนรถ</span><input style="flex:1" value="'+E(P.plate)+'" onchange="expProf(\'plate\',this.value)" placeholder="เช่น 9 กท 4554"></div>'
   +P.homes.map(function(h,i){ return '<div class="xrow"><span style="width:86px">'+(P.homes.length>1?'ฐานบ้าน '+(i+1):'บ้าน')+'</span><input style="flex:1" value="'+E(h.name)+'" onchange="expHome('+i+',this.value)" placeholder="'+(i?'บ้านที่ 2 (ถ้ามี)':'บ้าน')+'"><button class="xmini" onclick="expHomeGps(this,'+i+')">📍 '+(h.at?'ตั้งแล้ว':'ตั้งพิกัด')+'</button></div>'; }).join('')
   +'<div style="font-size:11px;color:var(--mut);margin-top:6px">📍 กดตอนอยู่ที่บ้านนั้น 1 ครั้ง ระบบจะหาระยะจากบ้านไป รพ./ออฟฟิศ ให้เอง</div></div>';
}
function tripHtml(P){
  var h=heroTrip()+profHtml(P), n=daysIn(expYM);
  var miss=missLegs().length;
  h+='<div class="card" style="background:var(--accent-bg);border-color:#BcD6F0"><div style="font-size:12.5px;color:var(--brand);margin-bottom:8px">ระบบดึง รพ. ค่าจุด และเบี้ยเลี้ยง จากรายงานให้แล้ว · ช่องสีแดง = ยังไม่มีระยะ (กม.)</div>'
    +(!gOn()?(miss?'<div style="font-weight:700;color:var(--danger)">ยังไม่กรอกระยะ '+miss+' ช่วง · พิมพ์ระยะ (กม.) ที่ขับจริง</div>':'<div style="font-weight:700;color:var(--ok)">✓ กรอกระยะครบทุกช่วงแล้ว</div>')
     :(miss?'<button class="send navy" id="xAllBtn" onclick="expSugAll()">≈ หาระยะทางทั้งเดือนให้อัตโนมัติ ('+miss+' ช่วง)</button>':'<div style="font-weight:700;color:var(--ok)">✓ กรอกระยะครบทุกช่วงแล้ว</div>'))
    +'<div style="font-size:11px;color:var(--mut);margin-top:6px">'+(gOn()?'ระยะจาก Google Maps เป็นค่าประมาณ แก้ตัวเลขได้ทุกช่อง · ':'')+'เส้นทางที่เคยกรอก ระบบจำไว้ให้ครั้งหน้า (เช่น บ้าน → ออฟฟิศ กรอกครั้งเดียว)</div></div>';
  for(var i=1;i<=n;i++) h+=dayHtml(dstr(expYM,i),P);
  return h;
}
function dayHtml(k,P){
  var d=day(k), c=dayCalc(d), dt=new Date(k+'T00:00:00'), hol=isHoliday(k), lbl=DOW[dt.getDay()]+' '+dt.getDate();
  if(!d.legs.length && !(c.tot>0)){
    return '<div class="xday off" id="xd_'+k+'"><div class="xdh"><span class="d">'+lbl+'</span>'+(d.label?'<span class="xtag">'+E(d.label)+'</span>':(hol.off?'<span class="xtag">'+E(hol.why)+'</span>':'<span style="font-size:11.5px;color:var(--mut)">ไม่มีรายงาน</span>'))
      +'<span class="t"><button class="xmini" onclick="expAddTrip(\''+k+'\')">+ เพิ่มการเดินทาง</button></span></div>'
      +'<div class="xrow"><select style="flex:1;font-size:12.5px;padding:5px 8px" onchange="expLabel(\''+k+'\',this.value)"><option value="">ป้ายวันนี้ในฟอร์ม…</option>'+LABELS.map(function(x){return '<option'+(d.label===x?' selected':'')+'>'+x+'</option>';}).join('')+'</select></div></div>';
  }
  var h='<div class="xday" id="xd_'+k+'"><div class="xdh"><span class="d">'+lbl+'</span>'+(hol.off?'<span class="xtag">'+E(hol.why)+'</span>':'')+(d.auto?'<span class="xtag am">จากรายงาน</span>':'')
    +'<span class="t" id="xt_'+k+'">'+money(c.tot)+'</span></div>';
  h+='<div class="xleg"><span class="ar">●</span><input class="pl" value="'+E(d.start)+'" placeholder="จุดเริ่มต้น (บ้านที่ไหน/โรงแรม)" onchange="expSet(\''+k+'\',\'start\',this.value)"></div>';
  var from=d.start;
  d.legs.forEach(function(l,i){
    var pv=provOf(l.to), out=pv&&!inCenter(pv,P.center), need=!(num(l.km)>0);
    h+='<div class="xleg"><span class="ar">→</span><input class="pl" value="'+E(l.to)+'" placeholder="ไปที่" onchange="expLeg(\''+k+'\','+i+',\'to\',this.value)">'
      +'<input class="km'+(need?' need':'')+'" inputmode="decimal" value="'+E(l.km)+'" placeholder="กม." oninput="expKm(\''+k+'\','+i+',this)" onchange="expKmDone(\''+k+'\','+i+')">'
      +(isBkk()?'<select class="pt" title="ค่าจุด" onchange="expLeg(\''+k+'\','+i+',\'pt\',this.value)">'+[['','จุด –'],['75','75'],['100','100']].map(function(o){ return '<option value="'+o[0]+'"'+(String(l.pt||'')===o[0]?' selected':'')+'>'+o[1]+'</option>'; }).join('')+'</select>':'')
      +'<button class="x" onclick="expRmLeg(\''+k+'\','+i+')">×</button></div>'
      +(gOn()&&need&&from&&l.to?'<div class="xpv"><button class="xsug" data-k="'+k+'" data-i="'+i+'" onclick="expSug(this)">≈ หาระยะจาก Google Maps</button></div>':'')
      +(pv?'<div class="xpv'+(out?' out':'')+'">'+(pv==='ปริมณฑล'?'':'จ.')+E(pv)+(out?' · นอกเขต center':'')+'</div>':'');
    from=l.to;
  });
  h+='<div class="xchips">'+(d.legs.length<MAXLEG?'<button class="xmini" onclick="expAddLeg(\''+k+'\')">+ จุดแวะ</button>':'<span class="xwarn">ครบ 7 ช่วงตามฟอร์มแล้ว</span>')
    +homeNames(P).map(function(hn,hi){ return '<button class="xmini" onclick="expAddLeg(\''+k+'\','+(hi+1)+')">🏠 '+E(hn)+'</button>'; }).join('')
    +'<select class="xmini" onchange="expSet(\''+k+'\',\'veh\',this.value,1)">'+Object.keys(VEH).map(function(x){return '<option value="'+x+'"'+(d.veh===x?' selected':'')+'>'+VEH[x]+'</option>';}).join('')+'</select></div>';
  h+='<div class="xchips"><span style="font-size:12px;color:var(--mut);align-self:center">เบี้ยเลี้ยง</span>'+ALWS().map(function(a){ return '<button class="xchip'+(d.alw===a[0]?' on':'')+'" onclick="expSet(\''+k+'\',\'alw\',\''+a[0]+'\',1)">'+a[1]+'</button>'; }).join('')+'</div>';
  h+='<div class="xrow">โรงแรม<input style="width:90px;text-align:right" inputmode="decimal" value="'+E(d.hotel)+'" placeholder="0" oninput="expMoney(\''+k+'\',\'hotel\',this)"><button class="xmini" onclick="expSet(\''+k+'\',\'hotel\',\''+HOME_STAY+'\',1)">พักบ้าน '+HOME_STAY+'</button></div>'
    +(num(d.hotel)>HOTEL_MAX?'<div class="xwarn">เกินเพดาน '+HOTEL_MAX+' บาท — บันทึกได้ แต่บัญชีอาจไม่อนุมัติส่วนเกิน</div>':'')
    +'<div class="xrow">OT<input style="flex:1" value="'+E(d.ot)+'" placeholder="'+(reportOt(k)?'มี OT ในรายงาน · ระบุช่วง เช่น 16.00-19.00':'ช่วงโอที เช่น 16.09-18.59 (ถ้ามี)')+'" onchange="expSet(\''+k+'\',\'ot\',this.value)"></div>'
    +'<div class="xrow">อื่นๆ<input style="width:90px;text-align:right" inputmode="decimal" value="'+E(d.other)+'" placeholder="0" oninput="expMoney(\''+k+'\',\'other\',this)"><input style="flex:1" value="'+E(d.otherNote)+'" placeholder="รถทัวร์ เครื่องบิน(ทัวร์×1.2)" onchange="expSet(\''+k+'\',\'otherNote\',this.value)"></div>'
    +'<div class="xchips">'+TRIP.map(function(x){ return '<button class="xmini" onclick="expTrip(\''+k+'\',\''+x[0]+'\')">'+x[1]+'</button>'; }).join('')+'</div>';
  h+='<div style="text-align:right;margin-top:6px"><button class="xmini" style="color:var(--red);border-color:var(--line2);background:#fff" onclick="expClearDay(\''+k+'\')">ล้างวันนี้</button></div></div>';
  return h;
}
function refreshTotals(k){ var c=dayCalc(day(k)), s=monthCalc(), t=document.getElementById('xt_'+k); if(t) t.textContent=money(c.tot);
  var a=document.getElementById('xTot'); if(a) a.textContent=money(s.tot)+' บาท'; var b=document.getElementById('xSub'); if(b) b.textContent='เดินทาง '+s.days+' วัน · '+km1(s.km)+' กม.'; var x=document.getElementById('xSum'); if(x) x.innerHTML=sumCells(s); }
window.expHome=function(i,v){ var P=prof(); P.homes[i].name=String(v).trim(); saveProf(P); render(); };
window.expProf=function(f,v){ var P=prof(); P[f]=String(v).trim(); saveProf(P); if(f==='home'||f==='veh'||f==='center') render(); };
window.expSet=function(k,f,v,re){ var d=touch(k); d[f]=v; save(); if(re) render(); else refreshTotals(k); };
window.expMoney=function(k,f,el){ var d=touch(k); d[f]=el.value; save(); refreshTotals(k); };
window.expLabel=function(k,v){ var d=touch(k); d.label=v; save(); };
window.expLeg=function(k,i,f,v){ var d=touch(k), l=d.legs[i]; l[f]=v; if(f==='to'&&!(num(l.km)>0)){ var fr=i?d.legs[i-1].to:d.start, m=memKm(fr,v); if(m!=null) l.km=String(m); } save(); render(); };
window.expTrip=function(k,v){ var d=touch(k); d.other=String(num(d.other)+num(v)); d.otherNote=(d.otherNote?d.otherNote+' + ':'')+'เหมาจ่ายทริป กทม '+v; save(); render(); };
window.expKm=function(k,i,el){ var d=touch(k); d.legs[i].km=el.value; el.classList.toggle('need',!(num(el.value)>0)); save(); refreshTotals(k); };
window.expKmDone=function(k,i){ var d=day(k), l=d.legs[i], fr=i?d.legs[i-1].to:d.start; learnKm(fr,l.to,num(l.km)); };
window.expAddLeg=function(k,home){ var d=touch(k); if(d.legs.length>=MAXLEG){ toast('ฟอร์มรับได้ 7 ช่วงต่อวัน'); return; } var to=home?(homeNames(prof())[home-1]||''):'', fr=d.legs.length?d.legs[d.legs.length-1].to:d.start; d.legs.push({to:to,km:to?kmGuess(fr,to):''}); save(); render(); };
window.expRmLeg=function(k,i){ var d=touch(k); d.legs.splice(i,1); save(); render(); };
window.expAddTrip=function(k){ var d=touch(k), P=prof(); d.start=d.start||prevEnd(k)||P.home; if(!d.legs.length) d.legs.push({to:'',km:''}); d.label=''; save(); render(); setTimeout(function(){ var el=document.querySelector('#xd_'+k+' .xleg .pl'); if(el){ var all=document.querySelectorAll('#xd_'+k+' .xleg .pl'); all[all.length-1].focus(); } },50); };
window.expClearDay=function(k){ modal('ล้างข้อมูลวันนี้?','ระบบจะดึงสถานที่จากรายงานมาใหม่',[{label:'ล้าง',cls:'',val:1},{label:'ยกเลิก',cls:'ghost',val:0}]).then(function(v){ if(!v) return; delete st.days[k]; save(); render(); }); };
window.expHomeGps=function(b,hi){ hi=hi||0; if(!navigator.geolocation){ toast('เครื่องนี้หาตำแหน่งไม่ได้'); return; } b.classList.add('xbusy'); b.textContent='📍 กำลังหา…';
  navigator.geolocation.getCurrentPosition(function(p){ var P=prof(); P.homes[hi].at=p.coords.latitude.toFixed(5)+','+p.coords.longitude.toFixed(5); saveProf(P); toast('ตั้งพิกัด '+(P.homes[hi].name||'บ้าน')+' แล้ว'); render(); },function(){ b.classList.remove('xbusy'); b.textContent='📍 ตั้งพิกัด'; toast('เปิดสิทธิ์ตำแหน่งก่อนนะคะ'); },{enableHighAccuracy:true,timeout:15000}); };
var OFFICE_AT={'ออฟฟิศ กทม.':'อาคารมโนรม ถนนพระรามที่ 4 แขวงคลองตัน เขตคลองเตย กรุงเทพมหานคร 10110'};   // บริษัท 3366/13-14 พระราม 4 (หลังอาคารมโนรม) · พี่ฝน 16 พ.ย. 69
function where(name){ var P=prof(), a=homeAt(name,P); return a||OFFICE_AT[String(name||'').trim()]||name; }
window.expSug=function(b){ var k=b.dataset.k, i=+b.dataset.i, d=day(k), l=d.legs[i], fr=i?d.legs[i-1].to:d.start, P=prof();
  if(!window.SYNC_URL){ toast('ยังไม่ได้เชื่อมระบบ'); return; }
  if((isHome(fr,P)&&!homeAt(fr,P))||(isHome(l.to,P)&&!homeAt(l.to,P))){ modal('ตั้งพิกัดบ้านก่อน','กดปุ่ม 📍 ตั้งพิกัด (ข้อมูลผู้เบิก ด้านบน) ตอนอยู่ที่บ้านนั้น 1 ครั้ง ระบบจะหาระยะจากบ้านให้ได้'); return; }
  b.classList.add('xbusy'); b.textContent='≈ กำลังหาระยะ…';
  fetch(SYNC_URL+'?op=route&from='+encodeURIComponent(where(fr))+'&to='+encodeURIComponent(where(l.to))+'&pv='+encodeURIComponent(provOf(l.to)||provOf(fr)||P.center||'')).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok||!(j.km>0)) throw 0;
    var dd=touch(k); dd.legs[i].km=String(j.km); learnKm(fr,l.to,j.km); save(); render(); toast('≈ '+j.km+' กม. (แก้ได้ถ้าไม่ตรง)');
  }).catch(function(){ b.classList.remove('xbusy'); b.textContent='หาไม่เจอ — กรอกเองนะคะ'; });
};

function missLegs(){ var out=[], n=daysIn(expYM); for(var i=1;i<=n;i++){ var k=dstr(expYM,i), d=day(k), fr=d.start; d.legs.forEach(function(l,j){ if(l.to&&fr&&!(num(l.km)>0)) out.push({k:k,i:j,fr:fr,to:l.to}); fr=l.to; }); } return out; }
window.expSugAll=function(){
  var P=prof(), L=missLegs(), b=document.getElementById('xAllBtn'), got=0, fail=0, homeSkip=0;
  if(!window.SYNC_URL){ toast('ยังไม่ได้เชื่อมระบบ'); return; }
  var todo=L.filter(function(x){ if((isHome(x.fr,P)&&!homeAt(x.fr,P))||(isHome(x.to,P)&&!homeAt(x.to,P))){ homeSkip++; return false; } return true; });
  if(!todo.length){ modal('ตั้งพิกัดบ้านก่อน','ช่วงที่เหลือเป็นการเดินทางจาก/กลับบ้าน · กดปุ่ม 📍 ตั้งพิกัด ของบ้านนั้น ตอนอยู่ที่บ้าน 1 ครั้ง แล้วกดหาระยะอีกครั้ง'); return; }
  if(b){ b.disabled=true; b.classList.add('xbusy'); }
  var seen={}, i=0;
  var next=function(){
    if(i>=todo.length){ save(); render(); modal('หาระยะเสร็จแล้ว','ได้ระยะ '+got+' ช่วง'+(fail?' · หาไม่เจอ '+fail+' ช่วง (กรอกเอง)':'')+(homeSkip?'<br>ยังไม่ได้ตั้งพิกัดบ้าน '+homeSkip+' ช่วง':'')+'<br>ตรวจตัวเลขก่อนส่งออก Excel นะคะ'); return; }
    var x=todo[i++], m=memKm(x.fr,x.to);
    if(b) b.textContent='≈ กำลังหาระยะ '+i+'/'+todo.length+' …';
    var put=function(km){ var d=touch(x.k); if(d.legs[x.i]&&!(num(d.legs[x.i].km)>0)) d.legs[x.i].km=String(km); learnKm(x.fr,x.to,km); got++; };
    if(m!=null){ put(m); return next(); }
    fetch(SYNC_URL+'?op=route&from='+encodeURIComponent(where(x.fr))+'&to='+encodeURIComponent(where(x.to))+'&pv='+encodeURIComponent(provOf(x.to)||provOf(x.fr)||P.center||'')).then(function(r){return r.json();})
      .then(function(j){ if(j&&j.ok&&j.km>0) put(j.km); else fail++; }).catch(function(){ fail++; }).then(next);
  };
  next();
};

/* ---------- ค่าใช้จ่ายรถ ---------- */
function carHtml(P){
  var c=st.car, cc=carCalc(), comp=P.veh==='C', tripKm=monthCalc().km;
  var h='<div class="hero"><div class="t">ใบกรอกไมล์ (ปะหน้าใบเบิก) · เดือน '+MN[+expYM.slice(5)-1]+'</div><div class="n" id="xcTot">'+money(cc.tot)+' บาท</div><div class="s">'+E(VEH[P.veh]||'')+(P.plate?' · '+E(P.plate):'')+'</div></div>';
  h+='<div class="card"><div class="lbl"><span class="dot"></span>เลขไมล์รถ + รูปหน้าปัด</div><div class="xbig">'
   +phBox('ph1','ต้นเดือน',c.ph1)+phBox('ph2','ปลายเดือน',c.ph2)+'</div>'
   +'<div class="xbig" style="margin-top:8px"><div><input class="field" inputmode="numeric" placeholder="ไมล์ต้นเดือน" value="'+E(c.mStart)+'" oninput="expCar(\'mStart\',this.value)"></div><div><input class="field" inputmode="numeric" placeholder="ไมล์ปลายเดือน" value="'+E(c.mEnd)+'" oninput="expCar(\'mEnd\',this.value)"></div></div>'
   +'<div class="xrow" style="justify-content:space-between"><span>ระยะทางที่วิ่ง</span><b id="xcRun">'+(cc.run>0?cc.run.toLocaleString('th-TH')+' กม.':'-')+'</b></div>'
   +'<div style="font-size:11px;color:var(--mut)">ระยะที่เบิกในค่าเดินทางเดือนนี้ '+km1(tripKm)+' กม.</div></div>';
  h+='<div class="card"><div class="xrow" style="justify-content:space-between;margin-top:0"><span>ค่าน้ำมันฟลีทการ์ด</span><input style="width:120px;text-align:right" inputmode="decimal" placeholder="0" value="'+E(c.fleet)+'" oninput="expCar(\'fleet\',this.value)"></div></div>';
  h+='<div class="card"><div class="lbl"><span class="dot"></span>ค่าน้ำมันเติมเอง <span style="margin-left:auto" id="xcFuel">'+money(cc.fuel)+'</span></div><div>'
   +c.fuel.map(function(v,i){ return '<span class="xbill">'+money(num(v))+' <b onclick="expRmBill('+i+')">×</b></span>'; }).join('')+'</div>'
   +'<div class="xrow"><input id="xBill" style="flex:1" inputmode="decimal" placeholder="ยอดบิลน้ำมัน (บาท)" onkeydown="if(event.key===\'Enter\')expAddBill()"><button class="xmini" onclick="expAddBill()">+ เพิ่มบิล</button></div>'
   +'</div>';
  h+='<div class="card">'+[['toll','ค่าทางด่วน'],['park','ค่าจอดรถ'],['oil','ค่าน้ำมันเครื่อง'],['tire','ค่าเปลี่ยนยาง'],['ins','ค่าประกันรถ'],['repair','ค่าซ่อมรถ (อื่นๆ)']].map(function(f){
     return '<div class="xrow" style="justify-content:space-between"><span>'+f[1]+'</span><input style="width:120px;text-align:right" inputmode="decimal" placeholder="0" value="'+E(c[f[0]])+'" oninput="expCar(\''+f[0]+'\',this.value)"></div>'; }).join('')
   +'<div class="xrow"><input style="flex:1" placeholder="คำอธิบาย (ถ้ามี)" value="'+E(c.note)+'" oninput="expCar(\'note\',this.value)"></div></div>';
  return h;
}
function phBox(f,t,src){ return '<div><label class="xph">'+(src?'<img src="'+src+'"><span class="ok">✓ '+t+'</span>':'<span style="font-size:26px">📷</span>ถ่ายรูปไมล์<br>'+t)
  +'<input type="file" accept="image/*" capture="environment" hidden onchange="expPhoto(\''+f+'\',this)"></label></div>'; }
/* รูปไมล์ → ระบบ (วันที่ถ่าย/พิกัดจากรูป · ธงให้บัญชีดูคนเดียว เซลไม่เห็น) · 15 พ.ย. 69 */
function sHash(s){ var h=0; for(var i=0;i<s.length;i+=7) h=(h*31+s.charCodeAt(i))|0; return (h>>>0).toString(36)+'_'+s.length; }
function mileUp(f,withImg){ var c=st.car; if(!window.SYNC_URL||!c[f]) return; var ym=expYM, body={app:'tech',op:'expphoto',nick:me.nick,full:me.full,ym:ym,which:f==='ph2'?'end':'start',mile:f==='ph2'?c.mEnd:c.mStart,taken:c[f+'At']||'',gps:c[f+'Gps']||'',hash:c[f+'H']||''};
  if(withImg) body.img=c[f];
  fetch(SYNC_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)}).then(function(r){return r.json();}).then(function(j){ if(j&&j.ok&&withImg){ var s2=LS('kosin_tech_exp_'+me.nick+'_'+ym,null); if(s2&&s2.car){ s2.car[f+'Up']=1; SS('kosin_tech_exp_'+me.nick+'_'+ym,s2); } if(ym===expYM) st.car[f+'Up']=1; } }).catch(function(){}); }
function mileRetry(){ ['ph1','ph2'].forEach(function(f){ if(st.car[f]&&!st.car[f+'Up']) mileUp(f,true); }); }
window.expPhoto=function(f,inp){ var file=inp.files&&inp.files[0]; if(!file) return; var rb=new FileReader(); rb.onload=function(){ var ex={}; try{ ex=parseExif(rb.result)||{}; }catch(e){} st.car[f+'At']=ex.taken||''; st.car[f+'Gps']=ex.gps?(ex.gps.lat!=null?ex.gps.lat.toFixed(5)+','+ex.gps.lng.toFixed(5):String(ex.gps)):''; doResize(); }; rb.readAsArrayBuffer(file);
  function doResize(){ var r=new FileReader(); r.onload=function(){ resizeDataURL(r.result,1000,0.7).then(function(d){ st.car[f]=d; st.car[f+'H']=sHash(d); st.car[f+'Up']=0; if(!save()){ st.car[f]=''; } render(); mileUp(f,true); }); }; r.readAsDataURL(file); } };
window.expCar=function(f,v){ st.car[f]=v; save(); var cc=carCalc(), a=document.getElementById('xcTot'); if(a) a.textContent=money(cc.tot)+' บาท'; var b=document.getElementById('xcRun'); if(b) b.textContent=cc.run>0?cc.run.toLocaleString('th-TH')+' กม.':'-'; };
window.expAddBill=function(){ var el=document.getElementById('xBill'), v=num(el.value); if(!(v>0)){ el.focus(); return; } st.car.fuel.push(v); save(); render(); setTimeout(function(){ var e=document.getElementById('xBill'); if(e) e.focus(); },30); };
window.expRmBill=function(i){ st.car.fuel.splice(i,1); save(); render(); };

/* ---------- ส่งออก Excel ตามฟอร์มเดิม ---------- */
var XJ='https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
function needExcelJS(){ return window.ExcelJS?Promise.resolve():new Promise(function(res,rej){ var s=document.createElement('script'); s.src=XJ; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
function tpl(name){ return fetch(name+'?v=2').then(function(r){ if(!r.ok) throw 0; return r.arrayBuffer(); }).then(function(b){ var wb=new ExcelJS.Workbook(); return wb.xlsx.load(b).then(function(){ return wb; }); }); }
function busy(on){ var b=document.getElementById('xdlBtn'); if(!b) return; b.disabled=on; b.classList.toggle('xbusy',on); if(on){ b.dataset.t=b.textContent; b.textContent='กำลังทำไฟล์ Excel…'; } else if(b.dataset.t) b.textContent=b.dataset.t; }
function dl(wb,fname){ return wb.xlsx.writeBuffer().then(function(buf){ var blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}); window.__expLast=blob; if(window.__expNoDl) return; var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=fname; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },5000); toast('ได้ไฟล์ Excel แล้ว'); }); }
function F(ws,addr,formula,result){ ws.getCell(addr).value={formula:formula,result:result}; }
window.expXlsxTrip=function(){
  var P=prof(), p=expYM.split('-'), y=+p[0], m=+p[1]-1, n=daysIn(expYM), AC=isBkk()?'J':'K';
  var miss=0; for(var i=1;i<=n;i++){ day(dstr(expYM,i)).legs.forEach(function(l){ if(l.to&&!(num(l.km)>0)) miss++; }); }
  var go=function(){ busy(true); needExcelJS().then(function(){ return tpl('tpl_ttravel.xlsx'); }).then(function(wb){
    var ws=wb.worksheets[0];
    ws.getCell('A2').value='ค่ารถและค่าใช้จ่ายติดต่องานประจำ เดือน '+MN[m]+' ปี '+(y+543);
    ws.getCell('A3').value='ชื่อ '+me.full+'  ,สำหรับใช้'+(VEH[P.veh]||'')+'  สถานที่ center ในเขตคือ จังหวัด '+(P.center==='กรุงเทพ'?'กรุงเทพมหานคร':(P.center||''));
    ws.getCell('A8').value=new Date(Date.UTC(y+543,m,1));
    var G={C:0,I:0,J:0,K:0,L:0,N:0,O:0};
    for(var k=0;k<31;k++){
      var r0=8+9*k, ds=k<n?dstr(expYM,k+1):'', d=ds?day(ds):{legs:[],veh:P.veh,alw:'n'}, c=ds?dayCalc(d):{km:0,pt:0,alw:0,hotel:0,other:0,tot:0};
      if(k) F(ws,'A'+r0,'A'+(r0-9)+'+1',new Date(Date.UTC(y+543,m,k+1)));
      var prevD='';
      for(var j=0;j<7;j++){
        var r=r0+j, l=d.legs[j];
        if(j===0) ws.getCell('B'+r).value=d.legs.length?(d.start||''):(d.label||(ds&&isHoliday(ds).off?'วันหยุด':null));
        else F(ws,'B'+r,'D'+(r-1),prevD);
        var kmv=l&&num(l.km)>0?num(l.km):null, to=l?(l.to||'-'):'-';
        ws.getCell('C'+r).value=kmv; ws.getCell('D'+r).value=to; prevD=to;
        [5,6,7,8].forEach(function(cc){ ws.getRow(r).getCell(cc).value=null; });
        if(l) ws.getRow(r).getCell(VCOL[d.veh]||7).value='Y';
        ws.getCell('I'+r).value=l&&num(l.pt)>0?num(l.pt):null;
      }
      ws.getCell('J'+r0).value=null; ws.getCell('K'+r0).value=null;
      ws.getCell(AC+r0).value=c.alw||null; ws.getCell('L'+r0).value=c.hotel||null; ws.getCell('M'+r0).value=d.ot||null; ws.getCell('N'+r0).value=c.other||null;
      if(d.otherNote&&c.other) ws.getCell('N'+r0).note=d.otherNote;
      var rt=r0+7; F(ws,'C'+rt,'SUM(C'+r0+':C'+(r0+6)+')',c.km); F(ws,'I'+rt,'SUM(I'+r0+':I'+(r0+6)+')',c.pt);
      F(ws,'J'+rt,'SUM(J'+r0+')',AC==='J'?c.alw:0); F(ws,'K'+rt,'SUM(K'+r0+')',AC==='K'?c.alw:0); F(ws,'L'+rt,'SUM(L'+r0+')',c.hotel); F(ws,'N'+rt,'SUM(N'+r0+')',c.other);
      F(ws,'O'+rt,'SUM(I'+rt+',J'+rt+',K'+rt+',L'+rt+',N'+rt+')',c.tot);
      G.C+=c.km; G.I+=c.pt; G[AC]+=c.alw; G.L+=c.hotel; G.N+=c.other; G.O+=c.tot;
    }
    var refs=function(L2){ var a=[]; for(var k=0;k<31;k++) a.push(L2+(15+9*k)); return a.join('+'); };
    ['C','I','J','K','L','N','O'].forEach(function(L2){ F(ws,L2+'289',refs(L2),G[L2]); });
    wb.calcProperties.fullCalcOnLoad=true;
    return dl(wb,'ค่ารถและค่าใช้จ่ายติดต่องาน '+me.full+' '+MN[m]+' '+(y+543)+'.xlsx');
  }).catch(function(){ toast('ทำไฟล์ไม่สำเร็จ ลองใหม่อีกครั้ง'); }).then(function(){ busy(false); }); };
  if(miss) modal('ยังไม่กรอกระยะ '+miss+' ช่วง','ช่องสีแดงยังไม่มีระยะ (กม.) · ทำไฟล์ไปก่อนแล้วแก้ใน Excel ก็ได้',[{label:'ทำไฟล์เลย',val:1},{label:'กลับไปกรอก',cls:'ghost',val:0}]).then(function(v){ if(v) go(); });
  else go();
};
window.expXlsxCar=function(){
  var P=prof(), c=st.car, cc=carCalc(), p=expYM.split('-'), y=+p[0], m=+p[1]-1;
  busy(true); needExcelJS().then(function(){ return tpl('tpl_tcar.xlsx'); }).then(function(wb){
    var ws=wb.worksheets[0];
    ws.name='ไมล์รถ '+MNE[m]+' '+y;
    ws.getCell('A1').value='ชื่อ '+me.full+' ('+(VEH[P.veh]||'รถส่วนตัว')+')\nทะเบียน '+(P.plate||'');
    var ms=num(c.mStart)||null, me2=num(c.mEnd)||null;
    ws.getCell('C1').value=ms; ws.getCell('H1').value=me2; F(ws,'I2','H1-C1',(me2||0)-(ms||0));
    ws.getCell('I3').value=num(c.fleet)||null;
    if(c.fuel.length) F(ws,'I4',c.fuel.map(function(v){return String(num(v));}).join('+'),cc.fuel);
    [['toll','I5'],['park','I6'],['oil','I7'],['tire','I8'],['ins','I9'],['repair','I10']].forEach(function(f){ ws.getCell(f[1]).value=num(c[f[0]])||null; });
    ws.getCell('C11').value=c.note||null;
    F(ws,'C12','SUM(I3:I11)',cc.tot);
    ws.pageSetup.printArea='A1:I'+(c.ph1||c.ph2?29:13); ws.pageSetup.fitToPage=true; ws.pageSetup.fitToWidth=1; ws.pageSetup.fitToHeight=1;
    [['ph1',0],['ph2',5]].forEach(function(x){ var s=c[x[0]]; if(!s) return; var id=wb.addImage({base64:s,extension:'jpeg'}); ws.addImage(id,{tl:{col:x[1],row:12},ext:{width:x[1]?320:300,height:240}}); });
    wb.calcProperties.fullCalcOnLoad=true;
    ['ph1','ph2'].forEach(function(f){ if(c[f]) mileUp(f,!c[f+'Up']); });   // ส่งเลขไมล์ล่าสุดให้บัญชี
    return dl(wb,'ใบกรอกไมล์ '+me.full+' '+MN[m]+' '+(y+543)+'.xlsx');
  }).catch(function(){ toast('ทำไฟล์ไม่สำเร็จ ลองใหม่อีกครั้ง'); }).then(function(){ busy(false); });
};
})();
