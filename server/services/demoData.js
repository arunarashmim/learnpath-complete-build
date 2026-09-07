export const demo={
 roles:['teacher','student','headteacher','official'],
 user:{id:'u1',name:'Anita Sharma',email:'teacher@learnpath.com',role:'teacher',schoolId:'s1',classId:'c1'},
 schools:[{id:'s1',name:'Government Primary School A',district:'Mysuru',block:'Mysuru South'}],
 classes:[{id:'c1',name:'Class 3',schoolId:'s1',teacher:'Anita Sharma',grade:3}],
 // Roster records are linked to student accounts through email.
 students:[
  {id:'st1',name:'Aarav',email:'tom@gmail.com',classId:'c1',grade:3,readingScore:7,readingMax:13,arithmeticScore:8,arithmeticMax:12},
  {id:'st2',name:'Diya',email:'diya.student@learnpath.demo',classId:'c1',grade:3,readingScore:5,readingMax:13,arithmeticScore:10,arithmeticMax:12},
  {id:'st3',name:'Kabir',email:'kabir.student@learnpath.demo',classId:'c1',grade:3,readingScore:11,readingMax:13,arithmeticScore:7,arithmeticMax:12},
  {id:'st4',name:'Meera',email:'meera.student@learnpath.demo',classId:'c1',grade:3,readingScore:3,readingMax:13,arithmeticScore:6,arithmeticMax:12},
  {id:'st5',name:'Rohan',email:'rohan.student@learnpath.demo',classId:'c1',grade:3,readingScore:8,readingMax:13,arithmeticScore:11,arithmeticMax:12},
  {id:'st6',name:'Sara',email:'sara.student@learnpath.demo',classId:'c1',grade:3,readingScore:6,readingMax:13,arithmeticScore:7,arithmeticMax:12},
  {id:'st7',name:'Ishaan',email:'ishaan.student@learnpath.demo',classId:'c1',grade:3,readingScore:12,readingMax:13,arithmeticScore:5,arithmeticMax:12},
  {id:'st8',name:'Nisha',email:'nisha.student@learnpath.demo',classId:'c1',grade:3,readingScore:7,readingMax:13,arithmeticScore:8,arithmeticMax:12},
  {id:'st9',name:'Arjun',email:'arjun.student@learnpath.demo',classId:'c1',grade:3,readingScore:4,readingMax:13,arithmeticScore:10,arithmeticMax:12},
  {id:'st10',name:'Tara',email:'tara.student@learnpath.demo',classId:'c1',grade:3,readingScore:10,readingMax:13,arithmeticScore:4,arithmeticMax:12}
 ],
 assessments:[
  {id:'a1',studentId:'st1',subject:'reading',level:'C',score:7,max:13,date:'2026-09-02',type:'baseline'},
  {id:'a2',studentId:'st1',subject:'reading',level:'B',score:9,max:13,date:'2026-09-03',type:'reassessment'}
 ],
 interventions:[
  {id:'i1',title:'Guided Reading: Sentences → Short Text',subject:'reading',fromBand:'B',to:'Std II text',duration:20,steps:['Read 3 familiar sentences aloud','Model phrasing and punctuation','Pair-read a short paragraph','Ask 2 comprehension questions'],approved:true},
  {id:'i2',title:'Word-to-Sentence Builder',subject:'reading',fromBand:'C',to:'Sentences',duration:15,steps:['Review 8 known words','Arrange word cards','Read the sentence','Create one new sentence'],approved:true},
  {id:'i3',title:'Foundational Reading Support',subject:'reading',fromBand:'D',to:'Words',duration:15,steps:['Review letter-sound patterns','Read familiar words','Build 3 simple words','Read the words independently'],approved:true},
  {id:'i4',title:'Subtraction with Place-Value Cards',subject:'arithmetic',fromBand:'arithmetic',to:'Next arithmetic skill',duration:20,steps:['Build tens and ones','Model regrouping','Solve 5 examples','Explain one solution'],approved:true}
 ],
 interventionRuns:[],
 assignments:[],
 accounts:[
  {id:'u-st1',name:'Aarav',email:'tom@gmail.com',role:'student',schoolId:'s1',classId:'c1'},
  {id:'u-teacher',name:'Anita Sharma',email:'teacher@learnpath.com',role:'teacher',schoolId:'s1',classId:'c1'}
 ],
 audit:[]
};
