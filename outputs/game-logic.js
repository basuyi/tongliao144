(function(root) {
var GL = {};

GL.S = ['hearts','diamonds','clubs','spades'];
GL.SYM = {hearts:'♥',diamonds:'♦',clubs:'♣',spades:'♠'};
GL.RN = {3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',10:'10',11:'J',12:'Q',13:'K',14:'A',15:'2',16:'小王',17:'大王'};
GL.LN = {3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',10:'10',11:'J',12:'Q',13:'K',14:'A'};
GL.PN = ['你','左对手','队友','右对手'];
GL.TCN = {single:'单张',pair:'对子',straight:'单龙',t32:'三带二',b3:'炸弹',b4:'大炸弹',dj:'双王',a44:'A44'};
GL.BM = ['b3','b4','dj','a44'];
GL.BO = {b3:1,b4:2,dj:3,a44:4};

GL.red = function(s){return s==='hearts'||s==='diamonds'};

GL.shuf = function(a){for(var i=a.length-1;i>0;i--){var j=Math.random()*(i+1)|0;var t=a[i];a[i]=a[j];a[j]=t}return a};

GL.ef = function(c,h){if(c.r===16)return 16;if(c.r===17)return 17;if(c.r===h&&c.r>=3&&c.r<=14)return 15.5;return c.r};

GL.isH = function(c,h){return c.r===h&&c.r>=3&&c.r<=14};

GL.srt = function(hd,h){return hd.slice().sort(function(a,b){var x=GL.ef(a,h),y=GL.ef(b,h);return x!==y?x-y:GL.S.indexOf(a.suit)-GL.S.indexOf(b.suit)})};

GL.createInitialState = function(){
  return {
    ph:'idle',turn:0,lv:[3,3,3,3],stg:[true,false,true,false],
    hd:[[],[],[],[]],hui:3,lp:null,lpp:-1,ps:0,
    dn:[false,false,false,false],ord:[],
    played:[[],[],[],[]],
    sel:[],hnt:0,busy:false,rnd:0,noTr:false,win:-1
  };
};

GL.deal = function(G){
  var S=GL.S;
  var dk=GL.shuf((function(){var d=[];for(var si=0;si<S.length;si++)for(var r=3;r<=15;r++)d.push({suit:S[si],r:r,id:S[si]+'_'+r});d.push({suit:'joker',r:16,id:'jb'},{suit:'joker',r:17,id:'jr'});return d})());
  var h=[[],[],[],[]];
  for(var i=0;i<52;i++)h[i%4].push(dk[i]);
  var lf=[dk[52],dk[53]],h3=-1;
  for(var p=0;p<4;p++)if(h[p].some(function(c){return c.suit==='hearts'&&c.r===3})){h3=p;break}
  if(h3<0)h3=0;
  h[h3].push(lf[0],lf[1]);
  for(var p=0;p<4;p++)h[p]=GL.srt(h[p],G.hui);
  G.hd=h;G.dn=[false,false,false,false];G.ord=[];G.lp=null;G.lpp=-1;G.ps=0;G.sel=[];G.played=[[],[],[],[]];
  return h3;
};

GL.detect = function(cards,h){
  if(!cards||!cards.length)return null;var n=cards.length;
  if(n===3){var hasA=cards.some(function(c){return c.r===14}),fs=cards.filter(function(c){return c.r===4});if(hasA&&fs.length===2){var ar=cards.every(function(c){return GL.red(c.suit)});return{type:'a44',rk:ar?300:299,cards:cards}}}
  if(n===1)return{type:'single',rk:GL.ef(cards[0],h),cards:cards};
  if(n===2){if(cards[0].r===cards[1].r)return{type:'pair',rk:GL.ef(cards[0],h),cards:cards};if(cards.some(function(c){return c.r===16})&&cards.some(function(c){return c.r===17}))return{type:'dj',rk:250,cards:cards};return null}
  if(n===3&&cards.every(function(c){return c.r===cards[0].r}))return{type:'b3',rk:GL.ef(cards[0],h),cards:cards};
  if(n===4&&cards.every(function(c){return c.r===cards[0].r}))return{type:'b4',rk:GL.ef(cards[0],h),cards:cards};
  if(n===5){var cnt={};cards.forEach(function(c){cnt[c.r]=(cnt[c.r]||0)+1});var tr=null,pr=null;for(var k in cnt){if(cnt[k]===3)tr=k;if(cnt[k]===2)pr=k}if(tr&&pr){var tc=cards.find(function(c){return c.r===+tr});return{type:'t32',rk:GL.ef(tc,h),cards:cards}}}
  if(n>=3){var noHui=cards.every(function(c){return!GL.isH(c,h)});if(noHui){var ranks=cards.map(function(c){return c.r}).sort(function(a,b){return a-b});var noDup=true;for(var i=0;i<ranks.length-1;i++)if(ranks[i]===ranks[i+1]){noDup=false;break}if(noDup&&ranks[ranks.length-1]-ranks[0]===n-1)return{type:'straight',rk:ranks[ranks.length-1],cards:cards}}}
  return null;
};

GL.beats = function(np,lp){
  if(!lp)return true;var BM=GL.BM,BO=GL.BO;
  var ni=BM.indexOf(np.type)>=0?BO[np.type]:0,li=BM.indexOf(lp.type)>=0?BO[lp.type]:0;
  if(ni&&li){if(ni!==li)return ni>li;return np.rk>lp.rk}
  if(ni)return true;if(li)return false;
  if(np.type!==lp.type)return false;if(np.cards.length!==lp.cards.length)return false;
  return np.rk>lp.rk;
};

GL.allPlays = function(hand,lp,h){
  var ps=[],s=GL.srt(hand,h),rc={};
  s.forEach(function(c){if(!rc[c.r])rc[c.r]=[];rc[c.r].push(c)});
  var BM=GL.BM,BO=GL.BO,ef=GL.ef;
  if(!lp){
    var seen={};for(var si=0;si<s.length;si++){if(!seen[s[si].r]){ps.push({type:'single',rk:ef(s[si],h),cards:[s[si]]});seen[s[si].r]=1}}
    var rr=Object.keys(rc);
    for(var ri=0;ri<rr.length;ri++){var r=rr[ri],cs=rc[r];if(cs.length>=2)ps.push({type:'pair',rk:ef(cs[0],h),cards:cs.slice(0,2)});if(cs.length>=3)ps.push({type:'b3',rk:ef(cs[0],h),cards:cs.slice(0,3)});if(cs.length>=4)ps.push({type:'b4',rk:ef(cs[0],h),cards:cs.slice(0,4)})}
    for(var ri=0;ri<rr.length;ri++){var r=rr[ri],cs=rc[r];if(cs.length>=3){var pe=null;for(var pi=0;pi<rr.length;pi++){if(+rr[pi]!==+r&&rc[rr[pi]].length>=2){pe=[rr[pi],rc[rr[pi]]];break}}if(pe)ps.push({type:'t32',rk:ef(cs[0],h),cards:cs.slice(0,3).concat(pe[1].slice(0,2))})}}
    var uR=Object.keys(rc).map(Number).filter(function(r){return r!==h&&r>=3&&r<=15}).sort(function(a,b){return a-b});
    for(var si=0;si<uR.length;si++){var straight=[],end=si;while(end<uR.length&&uR[end]===uR[si]+(end-si)&&uR[end]<=14){straight.push(rc[uR[end]][0]);end++;if(straight.length>=3)ps.push({type:'straight',rk:uR[end-1],cards:straight.slice()})}}
    var ac=s.filter(function(c){return c.r===14}),fc=s.filter(function(c){return c.r===4});
    if(ac.length&&fc.length>=2){var a=[ac[0],fc[0],fc[1]];ps.push({type:'a44',rk:a.every(function(c){return GL.red(c.suit)})?300:299,cards:a})}
    var bj=s.find(function(c){return c.r===16}),rj=s.find(function(c){return c.r===17});
    if(bj&&rj)ps.push({type:'dj',rk:250,cards:[bj,rj]});
    return ps;
  }
  var lt=lp.type,lr=lp.rk,lB=BM.indexOf(lt)>=0;
  if(!lB){
    if(lt==='single')for(var si=0;si<s.length;si++)if(ef(s[si],h)>lr)ps.push({type:'single',rk:ef(s[si],h),cards:[s[si]]});
    if(lt==='pair'){var rr=Object.keys(rc);for(var ri=0;ri<rr.length;ri++)if(rc[rr[ri]].length>=2&&ef(rc[rr[ri]][0],h)>lr)ps.push({type:'pair',rk:ef(rc[rr[ri]][0],h),cards:rc[rr[ri]].slice(0,2)})}
    if(lt==='t32'){var rr=Object.keys(rc);for(var ri=0;ri<rr.length;ri++){var r=rr[ri],cs=rc[r];if(cs.length>=3&&ef(cs[0],h)>lr){var pe=null;for(var pi=0;pi<rr.length;pi++){if(+rr[pi]!==+r&&rc[rr[pi]].length>=2){pe=[rr[pi],rc[rr[pi]]];break}}if(pe)ps.push({type:'t32',rk:ef(cs[0],h),cards:cs.slice(0,3).concat(pe[1].slice(0,2))})}}}
    if(lt==='straight'){var ln=lp.cards.length;var uR=Object.keys(rc).map(Number).filter(function(r){return r!==h&&r>=3&&r<=14}).sort(function(a,b){return a-b});for(var si=0;si<=uR.length-ln;si++){var ok=true;for(var j=0;j<ln;j++){if(uR[si+j]!==uR[si]+j){ok=false;break}}if(ok&&uR[si+ln-1]>lr){var st=[];for(var j=0;j<ln;j++)st.push(rc[uR[si+j]][0]);ps.push({type:'straight',rk:uR[si+ln-1],cards:st})}}}
  }
  var rr=Object.keys(rc);
  for(var ri=0;ri<rr.length;ri++){var cs=rc[rr[ri]];if(cs.length>=3&&(!lB||BO.b3>BO[lt]||(BO.b3===BO[lt]&&ef(cs[0],h)>lr)))ps.push({type:'b3',rk:ef(cs[0],h),cards:cs.slice(0,3)});if(cs.length>=4&&(!lB||BO.b4>BO[lt]||(BO.b4===BO[lt]&&ef(cs[0],h)>lr)))ps.push({type:'b4',rk:ef(cs[0],h),cards:cs.slice(0,4)})}
  if(!lB||BO.dj>BO[lt]){var bj=s.find(function(c){return c.r===16}),rj=s.find(function(c){return c.r===17});if(bj&&rj)ps.push({type:'dj',rk:250,cards:[bj,rj]})}
  if(!lB||BO.a44>BO[lt]){var ac=s.filter(function(c){return c.r===14}),fc=s.filter(function(c){return c.r===4});if(ac.length&&fc.length>=2){var a=[ac[0],fc[0],fc[1]];ps.push({type:'a44',rk:a.every(function(c){return GL.red(c.suit)})?300:299,cards:a})}}
  if(lt==='a44'){var ac=s.filter(function(c){return c.r===14}),fc=s.filter(function(c){return c.r===4});if(ac.length&&fc.length>=2){var a=[ac[0],fc[0],fc[1]],ar=a.every(function(c){return GL.red(c.suit)}),rk=ar?300:299;if(rk>lr)ps.push({type:'a44',rk:rk,cards:a})}}
  if(lt==='single'&&lp.cards[0].r===4){var fours=rc[4]||[];if(fours.length>=2)ps.push({type:'cha',rk:999,cards:fours.slice(0,2)})}
  if(lt==='pair'&&lp.cards[0].r===4){var fours=rc[4]||[];if(fours.length>=1)ps.push({type:'dian',rk:999,cards:[fours[0]]})}
  return ps;
};

GL.aiPick = function(G,pi){
  var hand=G.hd[pi];if(!hand.length)return null;
  var free=!G.lp||G.lpp===pi,plays=GL.allPlays(hand,free?null:G.lp,G.hui);
  if(!plays.length)return null;
  var BM=GL.BM;
  var nb=plays.filter(function(p){return BM.indexOf(p.type)<0}),bm=plays.filter(function(p){return BM.indexOf(p.type)>=0});
  if(free){if(nb.length){nb.sort(function(a,b){return a.rk-b.rk});return nb[0]}bm.sort(function(a,b){return a.rk-b.rk});return bm[0]}
  if(G.lpp%2===pi%2)return null;
  if(nb.length){nb.sort(function(a,b){return a.rk-b.rk});return nb[0]}
  if(hand.length<=4){bm.sort(function(a,b){return a.rk-b.rk});return bm[0]}
  return null;
};

GL.execPlay = function(G,pi,play){
  var ids={};play.cards.forEach(function(c){ids[c.id]=1});
  G.hd[pi]=G.hd[pi].filter(function(c){return!ids[c.id]});
  G.lp=play;G.lpp=pi;G.ps=0;
  G.played[pi].push.apply(G.played[pi],play.cards);
};

GL.execPass = function(G,pi){
  G.ps++;var act=4-G.ord.length;
  if(G.ps>=act-1){G._jf=(G.hd[G.lpp]&&G.hd[G.lpp].length===0);G.lp=null;G.ps=0}
};

GL.jiefeng = function(G){
  var tm=G.lpp%2;
  for(var i=0;i<4;i++){if(i!==G.lpp&&i%2===tm&&!G.dn[i])return i}
  var next=(G.lpp+1)%4,s=0;
  while(s<4){if(!G.dn[next])return next;next=(next+1)%4;s++}
  return (G.lpp+1)%4;
};

GL.shouldEndRound = function(G){
  if(G.ord.length<2)return false;
  if(G.ord.length>=4)return true;
  if(G.ord[0]%2===G.ord[1]%2)return true;
  return false;
};

GL.doDbl = function(G,wt,os){
  var lt=1-wt,was=os[wt],dem=false;
  if(os[lt]){for(var p=0;p<4;p++)if(p%2===lt){if(G.lv[p]===11){G.lv[p]=3;dem=true}else if(G.lv[p]===14){G.lv[p]=11;dem=true}}if(dem)G.noTr=true}
  if(was)for(var p=0;p<4;p++)if(p%2===wt){var v=G.lv[p];if(v!==3&&v!==11&&v!==14){v+=2;if(v>14)v=15;G.lv[p]=v}}
  for(var p=0;p<4;p++)G.stg[p]=p%2===wt;
  return{wt:wt,dbl:true,go:G.lv.some(function(l){return l>=15}),dem:dem,up:was,upgraded:was,sameTeam:false,starter:G.ord[0],msg:(['我方','对方'][wt])+'双抓!'};
};

GL.doSglSame = function(G,first,os){
  var wt=first%2;
  for(var p=0;p<4;p++)G.stg[p]=p%2===wt;
  G.noTr=true;
  return{wt:wt,dbl:false,go:G.lv.some(function(l){return l>=15}),dem:false,up:false,upgraded:false,sameTeam:true,starter:first,msg:(['我方','对方'][wt])+'获胜! (1/4同队)'};
};

GL.doSglDiff = function(G,first,last,wt,os){
  var was=os[wt],upgraded=false;
  if(was){for(var p=0;p<4;p++)if(p%2===wt){var v=G.lv[p];if(v!==3&&v!==11&&v!==14){v+=1;if(v>14)v=15;G.lv[p]=v;upgraded=true}}}
  for(var p=0;p<4;p++)G.stg[p]=p%2===wt;
  G.noTr=false;
  return{wt:wt,dbl:false,go:G.lv.some(function(l){return l>=15}),dem:false,up:was,upgraded:upgraded,sameTeam:false,starter:last,msg:(['我方','对方'][wt])+'获胜!'};
};

GL.endRound = function(G){
  for(var p=0;p<4;p++)if(G.hd[p].length===0&&G.ord.indexOf(p)<0){G.ord.push(p);G.dn[p]=true}
  var rem=[];for(var p=0;p<4;p++)if(G.ord.indexOf(p)<0)rem.push(p);
  rem.sort(function(a,b){return G.hd[a].length-G.hd[b].length});
  for(var i=0;i<rem.length;i++)G.ord.push(rem[i]);
  var first=G.ord[0],last=G.ord[3],oldS=G.stg.slice();
  var res;
  if(G.ord.length>=2&&G.ord.length<4&&G.ord[0]%2===G.ord[1]%2){res=GL.doDbl(G,G.ord[0]%2,oldS)}
  else if(first%2===last%2){res=GL.doSglSame(G,first,oldS)}
  else{res=GL.doSglDiff(G,first,last,first%2,oldS)}
  G.win=res.starter;
  return res;
};

GL.canCha = function(G,srcPlayer){
  for(var i=1;i<=3;i++){var p=(srcPlayer+i)%4;if(G.dn[p])continue;if(G.hd[p].filter(function(c){return c.r===4}).length>=2)return p}
  return -1;
};

GL.canDian = function(G,chaPlayer){
  for(var i=1;i<=3;i++){var p=(chaPlayer+i)%4;if(G.dn[p]||p===chaPlayer)continue;if(G.hd[p].some(function(c){return c.r===4}))return p}
  return -1;
};

if(typeof module!=='undefined'&&module.exports){module.exports=GL}
else{root.GameLogic=GL}
})(typeof globalThis!=='undefined'?globalThis:window);
