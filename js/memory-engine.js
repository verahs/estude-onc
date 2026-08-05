window.ONC=window.ONC||{};
ONC.MemoryEngine={
 intervals:[1,3,7,15,30],init(){},
 lastActivity(id){const rv=ONC.StudyTools?.state?.reviews?.[id]||{},a=ONC.Attention?.attempts?.[id]||{},v=ONC.StudyTools?.state?.topicVisits?.[id]||{};return rv.lastReviewedAt||a.lastAttemptAt||v.lastOpenedAt||null;},
 daysSince(x){return x?Math.max(0,(Date.now()-new Date(x).getTime())/86400000):null;},
 stability(id){const rv=ONC.StudyTools?.state?.reviews?.[id]||{};return this.intervals[Math.min(Number(rv.level||0),4)]||1;},
 memoryScore(id){const last=this.lastActivity(id);if(!last)return 0;return Math.max(0,Math.min(100,Math.round(Math.exp(-this.daysSince(last)/Math.max(1,this.stability(id)))*100)));},
 forgetProbability(id){return 100-this.memoryScore(id);},
 nextReview(id){const last=this.lastActivity(id);if(!last)return null;const due=new Date(last);due.setDate(due.getDate()+this.stability(id));return due;},
 status(id){const memory=this.memoryScore(id),forget=100-memory,nextReview=this.nextReview(id);let recommendation='Memória estável';if(forget>=70)recommendation='Ideal revisar hoje';else if(forget>=45)recommendation='Revisão recomendada em breve';return{memory,forget,nextReview,due:nextReview?nextReview<=new Date():false,recommendation};},
 averageMemory(){const topics=ONC.MasteryEngine?.topicIndex||[],v=topics.map(t=>this.memoryScore(t.id)).filter(x=>x>0);return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):0;}
};