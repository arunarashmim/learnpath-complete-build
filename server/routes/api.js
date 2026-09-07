import {Router} from 'express';
import mongoose from 'mongoose';
import {demo} from '../services/demoData.js';
import User from '../models/User.js';
import {hashPassword,verifyPassword} from '../services/auth.js';
import {actionBrief,studentAdvice,suggestInterventions,generateStudentQuestions} from '../services/ai.js';

const r=Router();
const now=()=>new Date().toISOString();
const percent=(score,max)=>score===null||score===undefined||!max?null:Math.round((Number(score)/Number(max))*100);
const safePercent=(score,max)=>percent(score,max)??0;
const readingBand=p=>p===null?'unassessed':p>=80?'A':p>=60?'B':p>=35?'C':'D';
const readingLabel=b=>({A:'Std II text',B:'Sentences',C:'Words',D:'Earlier support',unassessed:'Not assessed'})[b];
const bandGoal=b=>({A:'Maintain and extend',B:'Sentences → Std II text',C:'Words → Sentences',D:'Earlier support → Words',unassessed:'Complete a quick check first'})[b];
const log=(action,detail)=>demo.audit.unshift({id:'log'+Date.now()+Math.random(),action,detail,at:now()});

function class3(){return demo.students.filter(s=>s.classId==='c1'&&s.grade===3)}
function findStudent(id){return class3().find(s=>s.id===id)}
function normalizeEmail(v){return String(v||'').trim().toLowerCase()}
function findAccountByEmail(email){
  const local=demo.accounts.find(a=>a.email===normalizeEmail(email));
  return local||null;
}
async function findMongoStudent(email){
  if(mongoose.connection.readyState!==1)return null;
  return User.findOne({email:normalizeEmail(email),role:'student'});
}
function interventionsForStudent(studentId){
  return demo.assignments
    .filter(a=>a.studentId===studentId)
    .sort((a,b)=>String(b.assignedAt).localeCompare(String(a.assignedAt)));
}
function interventionForBand(b){
  return demo.interventions.find(i=>i.fromBand===b)||demo.interventions.find(i=>i.subject==='reading')||demo.interventions[0];
}
function decorateStudent(s){
  if(!s)return null;
  const p=percent(s.readingScore,s.readingMax);
  const b=readingBand(p);
  const assignments=interventionsForStudent(s.id);
  const latest=assignments[0]||null;

  // Practice history is kept separately from the current assignment so the
  // student can still see the last real score after starting a new attempt.
  const practiceHistory=demo.assessments
    .filter(a=>a.studentId===s.id&&a.type==='student_practice')
    .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.id).localeCompare(String(a.id)));
  const latestReadingPractice=practiceHistory.find(a=>a.subject==='reading')||null;
  const latestArithmeticPractice=practiceHistory.find(a=>a.subject==='arithmetic')||null;

  return {
    ...s,
    readingPercent:p,
    readingBand:b,
    readingLabel:readingLabel(b),
    readingGoal:bandGoal(b),
    arithmeticPercent:percent(s.arithmeticScore,s.arithmeticMax),
    assignments,
    activeAssignment:latest,
    latestPractice:{
      reading:latestReadingPractice,
      arithmetic:latestArithmeticPractice
    },
    path:[
      {subject:'reading',level:readingLabel(b),status:p===null?'pending':'current'},
      {subject:'reading',level:readingLabel(b==='A'?'A':b==='B'?'A':b==='C'?'B':'C'),status:p===null?'locked':'next'}
    ]
  };
}

r.post('/auth/register',async(q,res)=>{
  try{
    const {name,email,password}=q.body;
    if(!name||!email||!password)return res.status(400).json({message:'Name, email and password are required'});
    if(password.length<6)return res.status(400).json({message:'Password must be at least 6 characters'});
    const normalized=normalizeEmail(email);

    if(mongoose.connection.readyState===1){
      const existing=await User.findOne({email:normalized});
      if(existing)return res.status(409).json({message:'An account with this email already exists'});
      const user=await User.create({name:name.trim(),email:normalized,passwordHash:hashPassword(password),role:'student',schoolId:'s1',classId:null});
      demo.accounts.push({id:String(user._id),name:user.name,email:user.email,role:'student',schoolId:'s1',classId:null});
      log('USER_REGISTERED',`${user.name} • student`);
      return res.status(201).json({user:{id:String(user._id),name:user.name,email:user.email,role:'student',classId:null}});
    }

    if(findAccountByEmail(normalized))return res.status(409).json({message:'An account with this email already exists'});
    const account={id:'u'+Date.now(),name:name.trim(),email:normalized,role:'student',schoolId:'s1',classId:null,password};
    demo.accounts.push(account);
    log('USER_REGISTERED',`${account.name} • student`);
    return res.status(201).json({user:{id:account.id,name:account.name,email:account.email,role:'student',classId:null}});
  }catch(e){
    res.status(500).json({message:e.message||'Registration failed'});
  }
});

r.post('/auth/login',async(q,res)=>{
  try{
    const {email,password,role}=q.body;
    if(!email||!password||!role)return res.status(400).json({message:'Email, password and workspace role are required'});
    const normalized=normalizeEmail(email);

    if(mongoose.connection.readyState===1){
      const user=await User.findOne({email:normalized});
      if(!user||!verifyPassword(password,user.passwordHash))return res.status(401).json({message:'Invalid email or password'});
      if(user.role!==role)return res.status(403).json({message:`This account is registered as ${user.role}. Please select the correct workspace.`});
      return res.json({user:{id:String(user._id),name:user.name,email:user.email,role:user.role,schoolId:user.schoolId,classId:user.classId}});
    }

    const user=findAccountByEmail(normalized);
    if(!user||user.password!==password)return res.status(401).json({message:'Invalid email or password'});
    if(user.role!==role)return res.status(403).json({message:`This account is registered as ${user.role}. Please select the correct workspace.`});
    res.json({user:{id:user.id,name:user.name,email:user.email,role:user.role,schoolId:user.schoolId,classId:user.classId}});
  }catch(e){
    res.status(500).json({message:e.message||'Login failed'});
  }
});

r.get('/classes',(q,res)=>res.json(demo.classes.filter(c=>c.grade===3)));

function groups(subject='reading'){
  const students=class3();
  if(subject==='arithmetic'){
    return [
      {id:'math-foundation',level:'foundation',label:'Arithmetic • Foundation',goal:'Number sense → Addition',students:students.filter(s=>safePercent(s.arithmeticScore,s.arithmeticMax)<50&&s.arithmeticScore!=null)},
      {id:'math-practice',level:'practice',label:'Arithmetic • Practice',goal:'Addition → Subtraction',students:students.filter(s=>{const p=percent(s.arithmeticScore,s.arithmeticMax);return p!==null&&p>=50&&p<80})},
      {id:'math-secure',level:'secure',label:'Arithmetic • Secure',goal:'Subtraction → Division',students:students.filter(s=>{const p=percent(s.arithmeticScore,s.arithmeticMax);return p!==null&&p>=80})}
    ].filter(g=>g.students.length);
  }
  return ['A','B','C','D'].map(b=>({
    id:'reading-'+b,
    level:b,
    label:`Reading • Group ${b}`,
    goal:bandGoal(b),
    students:students.filter(s=>readingBand(percent(s.readingScore,s.readingMax))===b),
    benchmark:b==='A'?80:b==='B'?60:b==='C'?35:0
  })).filter(g=>g.students.length);
}

r.get('/dashboard',(q,res)=>{
  try{
    const students=class3();
    const assessed=students.filter(s=>percent(s.readingScore,s.readingMax)!==null);
    const readingGroups=groups('reading');
    const mathGroups=groups('arithmetic');
    const avg=assessed.length?Math.round(assessed.reduce((sum,s)=>sum+safePercent(s.readingScore,s.readingMax),0)/assessed.length):0;
    res.json({
      teacher:demo.user,
      class:demo.classes[0],
      stats:{
        students:students.length,
        groups:readingGroups.length,
        needsAction:assessed.filter(s=>safePercent(s.readingScore,s.readingMax)<80).length,
        reassess:demo.assessments.filter(a=>a.type==='reassessment').length,
        assessed:assessed.length
      },
      groups:readingGroups,
      mathGroups,
      today:{
        group:'Reading • Group B',
        count:readingGroups.find(g=>g.level==='B')?.students.length||0,
        goal:'Sentences → short text',
        intervention:interventionForBand('B')
      },
      classAverage:avg
    });
  }catch(e){
    console.error('dashboard error',e);
    res.status(500).json({message:e.message||'Could not load dashboard'});
  }
});

r.get('/students',(q,res)=>res.json(class3().map(decorateStudent)));

r.post('/students',async(q,res)=>{
  try{
    const {name,email,rollNumber=''}=q.body;
    const normalized=normalizeEmail(email);
    if(!normalized)return res.status(400).json({message:'Student email is required. The email connects the teacher roster to the student account.'});

    // First try the real MongoDB student account, then the local demo account.
    // If neither is available, we still create the Class 3 roster record.
    // This keeps the teacher workflow working even when registration happened
    // while the app was running in demo mode or the MongoDB connection changed.
    let account=await findMongoStudent(normalized);
    if(!account)account=findAccountByEmail(normalized);

    if(account && account.role!=='student'){
      return res.status(400).json({message:'That email belongs to a non-student account. Please use a student email.'});
    }

    const existing=class3().find(s=>s.email===normalized);
    if(existing)return res.status(409).json({message:'This student is already in Class 3.'});

    let student=demo.students.find(s=>s.email===normalized);

    if(student){
      student.classId='c1';
      student.grade=3;
      if(name?.trim())student.name=name.trim();
    }else{
      student={
        id:'st'+Date.now(),
        name:(name||account.name||'Student').trim(),
        email:normalized,
        rollNumber:String(rollNumber).trim(),
        classId:'c1',
        grade:3,
        readingScore:null,
        readingMax:13,
        arithmeticScore:null,
        arithmeticMax:12
      };
      demo.students.push(student);
    }

    if(account.classId!==undefined)account.classId='c1';

    if(account._id){
      await User.updateOne({_id:account._id},{$set:{classId:'c1',schoolId:'s1'}});
    }else if(account.id){
      account.classId='c1';
    }

    log('STUDENT_ADDED',`${student.name} (${normalized}) added to Class 3`);
    res.status(201).json(decorateStudent(student));
  }catch(e){
    res.status(500).json({message:e.message||'Could not add student'});
  }
});

r.get('/students/by-email/:email',async(q,res)=>{
  try{
    const email=normalizeEmail(q.params.email);
    let account=await findMongoStudent(email);
    if(!account)account=findAccountByEmail(email);
    if(!account||account.role!=='student')return res.status(404).json({message:'Student account not found'});
    const student=class3().find(s=>s.email===email);
    if(!student)return res.status(403).json({message:'Your student account exists, but your teacher has not added this email to Class 3 yet.'});
    res.json(decorateStudent(student));
  }catch(e){
    res.status(500).json({message:e.message||'Could not load student workspace'});
  }
});

r.get('/students/:id',(q,res)=>{
  const s=findStudent(q.params.id);
  if(!s)return res.status(404).json({message:'Student not found'});
  const decorated=decorateStudent(s);
  const history=demo.assessments.filter(a=>a.studentId===s.id);
  res.json({...decorated,history,recommended:interventionForBand(decorated.readingBand)});
});

r.post('/assessments',(q,res)=>{
  const {studentId,subject='reading',score,max,type='baseline'}=q.body;
  const s=findStudent(studentId);
  if(!s)return res.status(404).json({message:'Student not found'});
  if(score===undefined||score===null||max===undefined||max===null||Number(score)<0||Number(max)<=0||Number(score)>Number(max))return res.status(400).json({message:'Enter a valid score between 0 and the maximum mark'});

  const oldBand=subject==='reading'?readingBand(percent(s.readingScore,s.readingMax)):null;
  const p=percent(Number(score),Number(max));
  const level=subject==='reading'?readingBand(p):p>=80?'secure':p>=50?'practice':'foundation';

  if(subject==='reading'){
    s.readingScore=Number(score);
    s.readingMax=Number(max);
  }else{
    s.arithmeticScore=Number(score);
    s.arithmeticMax=Number(max);
  }

  const a={id:'a'+Date.now(),studentId,subject,level,score:Number(score),max:Number(max),date:new Date().toISOString().slice(0,10),type:type==='reassessment'?'reassessment':'baseline'};
  demo.assessments.push(a);
  log('ASSESSMENT',`${s.name}: ${subject} ${score}/${max}`);

  const b=subject==='reading'?level:null;
  res.json({
    assessment:a,
    student:decorateStudent(s),
    diagnosis:{
      scorePercent:p,
      previousBand:oldBand,
      skillGap:subject==='reading'?`${readingLabel(b)} band • ${bandGoal(b)}`:'Use the score band to choose the next arithmetic skill'
    },
    group:subject==='reading'?`Reading • Group ${b}`:`Arithmetic • ${level}`
  });
});

r.get('/groups',(q,res)=>res.json({reading:groups('reading'),arithmetic:groups('arithmetic')}));

r.get('/interventions',(q,res)=>res.json(demo.interventions));

r.post('/ai/student-questions',(q,res)=>{
  try{
    const body=q.body||{};
    const assignment=body.assignmentId?demo.assignments.find(a=>String(a.id)===String(body.assignmentId)):null;
    const subject=assignment?.subject||body.subject||'reading';
    const title=assignment?.title||body.title||'';
    const focus=assignment?.focus||body.focus||'';
    const group=body.group||assignment?.group||'C';
    const questions=generateStudentQuestions({subject,group,title,focus,count:body.count||5,seed:Date.now()+Math.floor(Math.random()*100000)});
    res.json({questions,subject,title,group,aiGenerated:true,guardrail:'Questions are generated as bounded practice from the teacher-selected activity. The teacher-selected intervention remains the source of the learner task.'});
  }catch(e){
    res.status(500).json({message:e.message||'Unable to generate practice questions'});
  }
});

r.get('/assignments/:studentId',(q,res)=>{
  const s=findStudent(q.params.studentId);
  if(!s)return res.status(404).json({message:'Student not found'});
  res.json(interventionsForStudent(s.id));
});

r.post('/interventions/start',(q,res)=>{
  const {studentIds=[],interventionId}=q.body;
  const i=demo.interventions.find(x=>x.id===interventionId);
  if(!i)return res.status(404).json({message:'Intervention not found'});
  if(!studentIds.length)return res.status(400).json({message:'Select at least one learner for the activity'});

  const run={
    id:'run'+Date.now(),
    studentIds,
    interventionId,
    status:'in_progress',
    startedAt:now(),
    completedAt:null,
    baseline:studentIds.map(id=>{
      const s=findStudent(id);
      return {id,score:s?.readingScore,max:s?.readingMax};
    })
  };

  demo.interventionRuns.unshift(run);

  studentIds.forEach(studentId=>{
    demo.assignments.unshift({
      id:'as'+Date.now()+Math.random(),
      studentId,
      interventionId:i.id,
      runId:run.id,
      title:i.title,
      subject:i.subject,
      duration:i.duration,
      steps:i.steps,
      focus:i.focus||'',
      group:i.subject==='reading'
        ? `Group ${readingBand(percent(findStudent(studentId)?.readingScore,findStudent(studentId)?.readingMax))}`
        : `Group ${arithmeticLevel(percent(findStudent(studentId)?.arithmeticScore,findStudent(studentId)?.arithmeticMax))}`,
      status:'assigned',
      assignedAt:now(),
      startedAt:null,
      completedAt:null,
      practiceScore:null,
      practiceMax:null,
      assignedBy:'Anita Sharma'
    });
  });

  log('INTERVENTION_STARTED',`${i.title} • ${studentIds.length} learners`);
  res.json({run,assignments:studentIds.map(id=>demo.assignments.find(a=>a.runId===run.id&&a.studentId===id))});
});

r.post('/interventions/:id/complete',(q,res)=>{
  const run=demo.interventionRuns.find(x=>x.id===q.params.id);
  if(!run)return res.status(404).json({message:'Run not found'});
  const assignments=demo.assignments.filter(a=>a.runId===run.id);
  const allCompleted=assignments.length>0&&assignments.every(a=>a.status==='completed');
  if(!allCompleted)return res.status(409).json({message:'Students must complete the assigned activity before the intervention can be marked complete'});
  run.status='completed';
  run.completedAt=now();
  log('INTERVENTION_COMPLETED',run.id);
  res.json(run);
});

r.post('/assignments/:id/start',(q,res)=>{
  const a=demo.assignments.find(x=>String(x.id)===String(q.params.id));
  if(!a)return res.status(404).json({message:'Assignment not found'});
  a.status='in_progress';
  a.startedAt=now();
  a.completedAt=null;
  a.practiceScore=null;
  a.practiceMax=null;
  log('STUDENT_ACTIVITY_STARTED',a.title);
  res.json(a);
});

r.post('/assignments/:id/complete',(q,res)=>{
  try{
    const a=demo.assignments.find(x=>String(x.id)===String(q.params.id));
    if(!a)return res.status(404).json({message:'Assignment not found'});

    const score=Number(q.body?.score);
    const max=Number(q.body?.max);
    if(!Number.isFinite(score)||!Number.isFinite(max)||max<=0||score<0||score>max){
      return res.status(400).json({message:'Practice score is invalid'});
    }

    const s=findStudent(a.studentId);
    if(!s)return res.status(404).json({message:'Student not found'});

    a.practiceScore=score;
    a.practiceMax=max;
    a.status='completed';
    a.completedAt=now();

    // The completed learner assessment becomes the student's latest evidence.
    // This is intentionally written back to the same student record so the
    // teacher's Diagnose & Group, Analytics and Reassess screens immediately
    // see the new mark after a refresh.
    if(String(a.subject).toLowerCase()==='reading'){
      const previous=percent(s.readingScore,s.readingMax);
      const next=percent(score,max);
      const previousGroup=readingBand(previous);
      const newGroup=readingBand(next);
      s.readingScore=score;
      s.readingMax=max;
      demo.assessments.push({
        id:'sp'+Date.now()+Math.random(),
        studentId:s.id,
        subject:'reading',
        level:newGroup,
        previousLevel:previousGroup,
        score,
        max,
        date:new Date().toISOString().slice(0,10),
        completedAt:a.completedAt,
        type:'student_practice',
        assignmentId:a.id,
        practiceScore:score,
        practiceMax:max
      });
      log('STUDENT_RESULT_SYNCED',`${s.name}: Reading ${score}/${max} • ${previousGroup} → ${newGroup}`);
    }else{
      const previous=percent(s.arithmeticScore,s.arithmeticMax);
      const next=percent(score,max);
      const previousGroup=arithmeticLevel(previous);
      const newGroup=arithmeticLevel(next);
      s.arithmeticScore=score;
      s.arithmeticMax=max;
      demo.assessments.push({
        id:'sp'+Date.now()+Math.random(),
        studentId:s.id,
        subject:'arithmetic',
        level:newGroup,
        previousLevel:previousGroup,
        score,
        max,
        date:new Date().toISOString().slice(0,10),
        completedAt:a.completedAt,
        type:'student_practice',
        assignmentId:a.id,
        practiceScore:score,
        practiceMax:max
      });
      log('STUDENT_RESULT_SYNCED',`${s.name}: Arithmetic ${score}/${max} • ${previousGroup} → ${newGroup}`);
    }

    log('STUDENT_ACTIVITY_COMPLETED',`${a.title} • ${score}/${max}`);
    res.json({assignment:a,student:decorateStudent(s),syncedToTeacher:true});
  }catch(e){
    console.error('assignment completion error',e);
    res.status(500).json({message:e.message||'Could not save practice result'});
  }
});

r.post('/reassess',(q,res)=>{
  try{
    const {runId,studentId,subject='reading',score,max}=q.body||{};
    const s=findStudent(studentId);
    if(!s)return res.status(404).json({message:'Student not found'});
    const numericScore=Number(score), numericMax=Number(max);
    if(!Number.isFinite(numericScore)||!Number.isFinite(numericMax)||numericMax<=0||numericScore<0||numericScore>numericMax){
      return res.status(400).json({message:'Enter a valid score between 0 and the maximum mark'});
    }

    const previousPercent=subject==='reading'
      ? percent(s.readingScore,s.readingMax)
      : percent(s.arithmeticScore,s.arithmeticMax);
    const previousGroup=subject==='reading' ? readingBand(previousPercent) : arithmeticLevel(previousPercent);
    const newPercent=percent(numericScore,numericMax);
    const newGroup=subject==='reading' ? readingBand(newPercent) : arithmeticLevel(newPercent);

    if(subject==='reading'){
      s.readingScore=numericScore;
      s.readingMax=numericMax;
    }else{
      s.arithmeticScore=numericScore;
      s.arithmeticMax=numericMax;
    }

    let movedUp=false,movedDown=false,sameLevel=false;
    if(subject==='reading'){
      const levels=['A','B','C','D'];
      const oldIndex=levels.indexOf(previousGroup), newIndex=levels.indexOf(newGroup);
      movedUp=oldIndex>=0&&newIndex>=0&&newIndex<oldIndex;
      movedDown=oldIndex>=0&&newIndex>=0&&newIndex>oldIndex;
      sameLevel=previousGroup===newGroup;
    }else{
      const rank=x=>x==='foundation'?1:x==='practice'?2:x==='secure'?3:0;
      movedUp=rank(newGroup)>rank(previousGroup)&&rank(previousGroup)>0;
      movedDown=rank(newGroup)<rank(previousGroup)&&rank(previousGroup)>0;
      sameLevel=previousGroup===newGroup;
    }

    const a={id:'ra'+Date.now(),studentId,subject,score:numericScore,max:numericMax,level:newGroup,previousLevel:previousGroup,previousPercentage:previousPercent,newPercentage:newPercent,date:new Date().toISOString().slice(0,10),type:'reassessment',runId:runId||null};
    demo.assessments.push(a);
    log('REASSESSMENT',`${s.name}: ${subject} ${previousGroup} → ${newGroup}`);

    res.json({success:true,student:decorateStudent(s),subject,previousGroup,newGroup,previousPercentage:previousPercent,newPercentage:newPercent,movedUp,movedDown,sameLevel,regrouped:true,reassessment:a});
  }catch(e){
    console.error('reassessment error',e);
    res.status(500).json({message:e.message||'Could not save reassessment'});
  }
});

r.post('/ai/student-advice',(q,res)=>{
  const s=findStudent(q.body.studentId);
  if(!s)return res.status(404).json({message:'Student not found'});
  res.json(studentAdvice(s,q.body.question||''));
});

r.post('/ai/interventions',(q,res)=>{
  try{
    const ids=Array.isArray(q.body.studentIds)?q.body.studentIds:[];
    const students=ids.map(findStudent).filter(Boolean);
    if(!students.length)return res.status(400).json({message:'Select a learning group first'});
    const seed=Number(q.body.seed||0);
    const suggestions=suggestInterventions(students,seed);
    suggestions.forEach(i=>{
      const existing=demo.interventions.find(x=>x.id===i.id);
      if(!existing)demo.interventions.push(i);
    });
    res.json({suggestions,studentCount:students.length});
  }catch(e){
    res.status(500).json({message:e.message||'Could not generate interventions'});
  }
});

r.get('/action-brief',(q,res)=>{
  const d=actionBrief(class3(),demo.interventionRuns);
  res.json({title:'30-second teacher action brief',...d,flags:[`${d.persistent} learners are currently below 35% in reading.`, 'Use assessment marks to regroup after every quick check.']});
});

r.get('/analytics',(q,res)=>{
  const students=class3();
  const assessed=students.filter(s=>percent(s.readingScore,s.readingMax)!==null);
  const total=students.length;
  const avg=assessed.length?Math.round(assessed.reduce((sum,s)=>sum+safePercent(s.readingScore,s.readingMax),0)/assessed.length):0;
  res.json({
    learning:{
      std2ReadingPct:Math.round(assessed.filter(s=>safePercent(s.readingScore,s.readingMax)>=80).length/Math.max(1,assessed.length)*100),
      subtractionOrAbovePct:Math.round(students.filter(s=>safePercent(s.arithmeticScore,s.arithmeticMax)>=50).length/Math.max(1,total)*100),
      movingUpPct:Math.round(assessed.filter(s=>safePercent(s.readingScore,s.readingMax)>=60).length/Math.max(1,assessed.length)*100)
    },
    operations:{
      assessmentCoverage:Math.round(demo.assessments.filter(a=>students.some(s=>s.id===a.studentId)).length/Math.max(1,total)*100),
      interventionCompletion:demo.interventionRuns.length?Math.round(demo.interventionRuns.filter(x=>x.status==='completed').length/demo.interventionRuns.length*100):0,
      reassessmentRate:demo.assessments.filter(x=>x.type==='reassessment').length?100:0,
      teacherTimeSaved:32
    },
    classAverage:avg,
    skills:[
      {name:'Reading: Group D → Words',gap:students.filter(s=>readingBand(percent(s.readingScore,s.readingMax))==='D').length},
      {name:'Reading: Group C → Sentences',gap:students.filter(s=>readingBand(percent(s.readingScore,s.readingMax))==='C').length},
      {name:'Reading: Group B → Std II text',gap:students.filter(s=>readingBand(percent(s.readingScore,s.readingMax))==='B').length}
    ]
  });
});

r.get('/official',(q,res)=>res.json({districts:[{name:'Mysuru',schools:1,students:class3().length,prioritySkills:['Reading groups by assessment marks','Arithmetic support']}],trend:[{year:2022,reading:20.5,subtraction:25.9},{year:2024,reading:27.1,subtraction:33.7}],prioritySchools:['Government Primary School A']}));
r.get('/audit',(q,res)=>res.json(demo.audit.slice(0,20)));
r.get('/export',(q,res)=>{
  res.setHeader('Content-Type','text/csv');
  res.setHeader('Content-Disposition','attachment; filename=learnpath-class3-export.csv');
  const rows=class3().map(s=>`${s.name},${s.email||''},${s.readingScore??''},${s.readingMax??''},${safePercent(s.readingScore,s.readingMax)}`).join('\n');
  res.send('student,email,reading_score,reading_max,reading_percent\n'+rows);
});

export default r;
