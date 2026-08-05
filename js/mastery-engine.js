window.ONC=window.ONC||{};
ONC.MasteryEngine={topicIndex:[],snapshot:{},init(){this.buildIndex();this.refresh();},
 buildIndex(){this.topicIndex=[...document.querySelectorAll('.topicCard')].map(card=>({id:card.dataset.topicId,title:card.dataset.topicTitle||'',discipline:card.dataset.discipline||'',recurrence:Number(card.dataset.recurrence||0),card}));},
 data(id){return{visits:ONC.StudyTools?.state?.topicVisits?.[id]||{},attempts:ONC.Attention?.attempts?.[id]||{attempts:0,correct:0,errors:0},review:ONC.StudyTools?.state?.reviews?.[id]||{},sessions:ONC.StudyHistory?.topicSessions(id)||[],completed:ONC.Study?.progress?.[id]===true};},
 reading(id){const x=this.data(id),sec=x.sessions.reduce((s,i)=>s+Number(i.seconds||0),0);return Math.min(100,Math.round((x.visits.count?Math.min(45,x.visits.count*15):0)+Math.min(35,sec/180*35)+(x.completed?20:0)));},
 quiz(id){const a=this.data(id).attempts;if(!a.attempts)return 0;return Math.round((a.correct/a.attempts)*85+Math.min(1,a.attempts/5)*15);},
 review(id){return({again:20,hard:50,good:80,easy:100})[this.data(id).review.lastQuality]||0;},
 calculate(id){const reading=this.reading(id),quiz=this.quiz(id),review=this.review(id),memory=ONC.MemoryEngine.memoryScore(id);return{topicId:id,reading,quiz,review,memory,score:Math.max(0,Math.min(100,Math.round(reading*.35+quiz*.40+review*.15+memory*.10)))};},
 get(id){return this.snapshot[id]||(this.snapshot[id]=this.calculate(id));},stars(s){const n=s<=0?0:Math.max(1,Math.min(5,Math.ceil(s/20)));return'★'.repeat(n)+'☆'.repeat(5-n);},
 label(s){return s>=85?'Domínio excelente':s>=70?'Bom domínio':s>=50?'Em consolidação':s>=25?'Em aprendizado':'Domínio inicial';},
 explanation(s){return s>=85?'Você domina o assunto e precisa apenas manter a revisão.':s>=70?'Você já compreende o assunto. Falta consolidar a memória.':s>=50?'Seu desempenho está evoluindo, mas ainda precisa de prática.':s>=25?'Você iniciou o conteúdo. Leia, pratique e revise.':'Comece pela leitura guiada e depois resolva questões.';},
 average(){const v=this.topicIndex.map(t=>this.get(t.id).score);return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):0;},
 refresh(){this.snapshot={};this.topicIndex.forEach(t=>this.snapshot[t.id]=this.calculate(t.id));this.renderBadges();},
 renderBadges(){this.topicIndex.forEach(t=>{t.card.querySelector('.masteryBadge')?.remove();const meta=t.card.querySelector('.topicMeta');if(!meta)return;const x=this.get(t.id),b=document.createElement('button');b.type='button';b.className='masteryBadge';b.title='Ver composição do domínio';b.innerHTML=`<span>${this.stars(x.score)}</span> ${x.score}%`;b.onclick=e=>{e.stopPropagation();ONC.MasteryUI.open(t.id)};meta.appendChild(b);t.card.dataset.mastery=String(x.score);});}
};