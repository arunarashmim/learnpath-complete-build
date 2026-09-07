const pct=(score,max)=>score===null||score===undefined||!max?null:Math.round((Number(score)/Number(max))*100)
function readingBand(p){return p===null?'unassessed':p>=80?'A':p>=60?'B':p>=35?'C':'D'}
function bandLabel(b){return ({A:'Std II text',B:'Sentences',C:'Words',D:'Earlier support',unassessed:'Not assessed'})[b]}

export function matchActivities(student,activities){
 const band=readingBand(pct(student.readingScore,student.readingMax));
 return activities.filter(a=>a.approved&&a.subject==='reading'&&a.fromBand===band).slice(0,3)
}

export function actionBrief(students,runs){
 const ps=students.map(s=>pct(s.readingScore,s.readingMax)).filter(v=>v!==null);
 const avg=ps.length?Math.round(ps.reduce((a,b)=>a+b,0)/ps.length):0;
 const needs=students.filter(s=>(pct(s.readingScore,s.readingMax)??0)<80).length;
 const persistent=students.filter(s=>(pct(s.readingScore,s.readingMax)??0)<35).length;
 return {summary:`${needs} of ${students.length} learners are below the 80% reading benchmark. Class average is ${avg}%.`,persistent,completed:runs.filter(r=>r.status==='completed').length,recommendation:'Start with the group closest to its next achievable reading level, then reassess the same learners.'}
}

export function persistentNonProgress(history){return history.length>=2&&history.at(-1).level===history.at(-2).level}

export function studentAdvice(student, question=''){
 const p=pct(student.readingScore,student.readingMax), band=readingBand(p), label=bandLabel(band);
 const q=String(question||'').toLowerCase();
 let opinions=[];
 if(q.includes('math')||q.includes('arithmetic')||q.includes('subtract')){
   const ap=pct(student.arithmeticScore,student.arithmeticMax);
   opinions=[
    `Opinion 1 — Start from the demonstrated arithmetic result (${ap===null?'not assessed':ap}%). Use concrete examples before abstract questions.`,
    `Opinion 2 — Give a small targeted set of 3–5 problems on the skill the child missed, with teacher modelling first.`,
    `Opinion 3 — Recheck after practice. If the result stays flat, change the representation and review the misconception.`
   ];
 } else {
   opinions=[
    `Opinion 1 — Strengthen the current reading level: use short, repeated practice at the ${label} level and ask the child to explain what they read.`,
    `Opinion 2 — Reduce the jump: break the next skill into smaller steps from ${label} toward the next level rather than giving harder text immediately.`,
    `Opinion 3 — Check the response after support. If the score stays flat, try a different approach and reassess before changing the learning path.`
   ];
 }
 return {student:student.name,score:p,band,label,question,opinions,guardrail:'AI provides teacher-facing options. The teacher decides which support to use; it does not grade the child or make a high-stakes decision.'}
}

const templates={
 A:[
  {title:'Paired Reading + Comprehension',duration:20,focus:'Fluency and meaning',steps:['Pair-read a short Grade 3 passage','Model phrasing and punctuation','Reread the passage independently','Ask 3 short comprehension questions']},
  {title:'Short Text Fluency Sprint',duration:15,focus:'Accuracy and fluency',steps:['Read a familiar short text once','Teacher models difficult lines','Learner rereads for accuracy','Record one sentence the learner can read confidently']},
  {title:'Read, Retell, Extend',duration:20,focus:'Comprehension and expression',steps:['Read a short passage','Underline key information','Retell it in 2–3 sentences','Add one new sentence using the same idea']}
 ],
 B:[
  {title:'Sentence-to-Text Bridge',duration:20,focus:'Move from sentences to short text',steps:['Read 4 connected sentences','Join two sentences using a connector','Read the combined paragraph','Answer 2 comprehension questions']},
  {title:'Guided Paragraph Reading',duration:20,focus:'Fluency and connected text',steps:['Preview 5 key words','Teacher models the paragraph','Learner reads it with support','Reread independently and explain the main idea']},
  {title:'Sentence Expansion Practice',duration:15,focus:'Build complete sentences',steps:['Read 4 familiar sentences','Add who/what/where details','Read each expanded sentence','Create one new sentence independently']}
 ],
 C:[
  {title:'Word-to-Sentence Builder',duration:15,focus:'Move from words to sentences',steps:['Review 8 known words','Sort words into useful groups','Arrange word cards into sentences','Read and create one new sentence']},
  {title:'Word Reading + Meaning',duration:15,focus:'Accurate word reading',steps:['Review 8 familiar words','Read each word aloud','Match words to simple meanings','Use 3 words in oral sentences']},
  {title:'Build, Read, Write',duration:20,focus:'Connect word reading to sentence use',steps:['Build 5 words from cards','Read each word','Use the words to form 2 sentences','Read the sentences back to the teacher']}
 ],
 D:[
  {title:'Sound-to-Word Foundations',duration:15,focus:'Earlier reading support',steps:['Review key letter-sound patterns','Blend sounds into simple words','Read 5 familiar words','Build 3 new words with letter cards']},
  {title:'Guided Word Reading',duration:15,focus:'Accurate word recognition',steps:['Review familiar sounds','Teacher models 5 words','Learner reads with prompts','Reread the same words independently']},
  {title:'Word Building with Letter Cards',duration:20,focus:'Build and recognise simple words',steps:['Build 3 familiar words','Change one sound at a time','Read each new word','Write and read 3 words independently']}
 ]
}

export function suggestInterventions(students, seed=0){
 const assessed=students.filter(s=>pct(s.readingScore,s.readingMax)!==null);
 const avg=assessed.length?Math.round(assessed.reduce((sum,s)=>sum+pct(s.readingScore,s.readingMax),0)/assessed.length):0;
 const bands=assessed.map(s=>readingBand(pct(s.readingScore,s.readingMax)));
 const counts=bands.reduce((m,b)=>(m[b]=(m[b]||0)+1,m),{});
 const band=['D','C','B','A'].find(b=>counts[b])||readingBand(avg);
 const source=templates[band]||templates.C;
 const rotated=source.map((x,i)=>source[(i+seed)%source.length]);
 return rotated.map((x,i)=>({
   id:`ai-${band}-${seed}-${i}-${Date.now()}`,
   title:x.title,
   subject:'reading',
   fromBand:band,
   to:band==='A'?'Maintain and extend':band==='B'?'Std II text':band==='C'?'Sentences':'Words',
   duration:x.duration,
   steps:x.steps,
   focus:x.focus,
   evidence:`Suggested for Group ${band} from the current assessment evidence (class average ${avg}%; ${assessed.length} assessed learners).`,
   approved:true,
   aiGenerated:true
 }))
}


function shuffle(items, seed){
 const arr=[...items];
 let x=(Number(seed)||1)%2147483647;
 if(x<=0)x+=2147483646;
 for(let i=arr.length-1;i>0;i--){
   x=(x*16807)%2147483647;
   const j=x%(i+1);
   [arr[i],arr[j]]=[arr[j],arr[i]];
 }
 return arr;
}

function makeQuestion(question, options, answer){
 const shuffled=shuffle(options.map((text,index)=>({text,index})), Math.floor(Math.random()*1000000)+question.length);
 return {question, options:shuffled.map(x=>x.text), answer:shuffled.findIndex(x=>x.index===answer)};
}

export function generateStudentQuestions({subject='reading',group='C',title='',focus='',count=5,seed=Date.now()}={}){
 const n=Math.max(3,Math.min(5,Number(count)||5));
 const q=[];
 if(String(subject).toLowerCase()==='arithmetic'){
   const g=String(group).toUpperCase();
   const base=g==='A'?12:g==='B'?9:g==='C'?6:3;
   for(let i=0;i<n;i++){
     const a=base+i+2;
     const b=Math.max(1,(i%4)+1);
     const ans=a-b;
     q.push(makeQuestion(`${a} − ${b} = ?`,[String(ans),String(ans+1),String(Math.max(0,ans-1))],0));
   }
 } else {
   const g=String(group).toUpperCase();
   if(g==='A'){
     const sets=[
       ['Ravi read a short story. What did Ravi read?',['A story','A number','A song'],0],
       ['Which sentence is written correctly?',['The children play outside.','The children outside play.','Play outside children the.'],0],
       ['Mina watered the plant because it was dry. Why did Mina water it?',['Because it was dry','Because it was blue','Because it was loud'],0],
       ['Choose the best ending: The boy opened the book and began to ___.',['read','green','table'],0],
       ['Which word means nearly the same as happy?',['glad','small','slow'],0]
     ];
     for(let i=0;i<n;i++){const x=sets[i%sets.length];q.push(makeQuestion(x[0],x[1],x[2]));}
   } else if(g==='B'){
     const sets=[
       ['Choose the sentence that makes sense.',['Birds can fly.','Fly can birds.','Birds fly can.'],0],
       ['Complete: The girl ___ to school every day.',['walks','blue','book'],0],
       ['Which sentence tells what happened first?',['First, Riya opened the book.','Finally, Riya closed the book.','Then, Riya answered the questions.'],0],
       ['Read: "Sam has a red ball." What does Sam have?',['A red ball','A blue bag','A green book'],0],
       ['Choose the best connector: I was tired, ___ I finished my work.',['but','under','yellow'],0]
     ];
     for(let i=0;i<n;i++){const x=sets[i%sets.length];q.push(makeQuestion(x[0],x[1],x[2]));}
   } else if(g==='D'){
     const sets=[
       ['Which word starts with the /m/ sound?',['mat','sun','top'],0],
       ['Choose the word that matches the picture idea of something you sit on.',['chair','fish','rain'],0],
       ['Which word rhymes with cat?',['hat','sun','dog'],0],
       ['Choose the word that starts with the same sound as ball.',['bat','sun','red'],0],
       ['Which is a familiar word?',['book','qzx','plom'],0]
     ];
     for(let i=0;i<n;i++){const x=sets[i%sets.length];q.push(makeQuestion(x[0],x[1],x[2]));}
   } else {
     const sets=[
       ['Which word can be used to complete: I can ___ a book.',['read','blue','chair'],0],
       ['Put the words into a sensible sentence: "likes / Riya / mangoes".',['Riya likes mangoes.','Likes Riya mangoes.','Mangoes Riya likes.'],0],
       ['Choose the sentence that is correct.',['The dog runs.','Dog the runs.','Runs dog the.'],0],
       ['Complete: The sun is ___.',['hot','chair','read'],0],
       ['Which word names a person?',['teacher','table','green'],0]
     ];
     for(let i=0;i<n;i++){const x=sets[i%sets.length];q.push(makeQuestion(x[0],x[1],x[2]));}
   }
 }
 return shuffle(q,seed).slice(0,n).map((x,i)=>({...x,id:`q-${seed}-${i}`}));
}
