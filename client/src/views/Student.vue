<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')

const student = ref({
  id: '',
  name: 'Aarav',
  email: '',
  classId: 'c1',
  grade: 3,
  readingScore: null,
  readingMax: 13,
  arithmeticScore: null,
  arithmeticMax: 12,
  assignments: []
})

const assignments = ref([])
const questions = ref([])
const started = ref(false)
const completed = ref(false)
const questionIndex = ref(0)
const answers = ref([])
const score = ref(null)
const saving = ref(false)


/* =====================================================
   PAGE
   ===================================================== */

const currentPage = computed(() => {
  if (route.path === '/student/activity') return 'activity'
  if (route.path === '/student/progress') return 'progress'
  return 'path'
})


const selectedSubject = computed(() => {
  if (route.query.subject === 'reading') return 'reading'
  if (route.query.subject === 'arithmetic') return 'arithmetic'
  return null
})


/* =====================================================
   LOGIN USER
   ===================================================== */

function storedUser() {
  try {
    const a = JSON.parse(
      localStorage.getItem('learnpathUser') || 'null'
    )

    const b = JSON.parse(
      localStorage.getItem('learnpath_user') || 'null'
    )

    return a || b || null

  } catch {
    return null
  }
}


function userEmail() {

  const user = storedUser()

  return String(
    user?.email || ''
  )
    .trim()
    .toLowerCase()
}


/* =====================================================
   PERCENTAGE
   ===================================================== */

function pct(value, max) {

  const scoreValue = Number(value)
  const maxValue = Number(max)

  if (
    !Number.isFinite(scoreValue) ||
    !Number.isFinite(maxValue) ||
    maxValue <= 0
  ) {
    return null
  }

  return Math.round(
    (scoreValue / maxValue) * 100
  )
}


/* =====================================================
   SCORES
   ===================================================== */

const readingPercent = computed(() =>
  pct(
    student.value.readingScore,
    student.value.readingMax
  )
)


const arithmeticPercent = computed(() =>
  pct(
    student.value.arithmeticScore,
    student.value.arithmeticMax
  )
)


/* =====================================================
   READING GROUP
   ===================================================== */

function readingGroup(p) {

  if (p === null) {
    return 'Not assessed'
  }

  if (p >= 80) {
    return 'Group A'
  }

  if (p >= 60) {
    return 'Group B'
  }

  if (p >= 35) {
    return 'Group C'
  }

  return 'Group D'
}


const readingGroupName = computed(() =>
  readingGroup(
    readingPercent.value
  )
)


/* =====================================================
   ARITHMETIC GROUP
   ===================================================== */

function arithmeticGroup(p) {

  if (p === null) {
    return 'Not assessed'
  }

  if (p >= 80) {
    return 'Group Secure'
  }

  if (p >= 50) {
    return 'Group Practice'
  }

  return 'Group Foundation'
}


const arithmeticGroupName = computed(() =>
  arithmeticGroup(
    arithmeticPercent.value
  )
)


/* =====================================================
   READING LEVEL
   ===================================================== */

const readingLevel = computed(() => {

  if (readingPercent.value === null) {
    return 'Waiting for assessment'
  }

  if (readingPercent.value >= 80) {
    return 'Std II text'
  }

  if (readingPercent.value >= 60) {
    return 'Sentences'
  }

  if (readingPercent.value >= 35) {
    return 'Words'
  }

  return 'Earlier support'
})


const readingGoal = computed(() => {

  if (readingPercent.value === null) {
    return 'Teacher assessment needed'
  }

  if (readingPercent.value >= 80) {
    return 'Maintain and extend'
  }

  if (readingPercent.value >= 60) {
    return 'Std II text'
  }

  if (readingPercent.value >= 35) {
    return 'Sentences'
  }

  return 'Words'
})


/* =====================================================
   ARITHMETIC LEVEL
   ===================================================== */

const arithmeticLevel = computed(() => {

  if (arithmeticPercent.value === null) {
    return 'Waiting for assessment'
  }

  if (arithmeticPercent.value >= 80) {
    return 'Division'
  }

  if (arithmeticPercent.value >= 50) {
    return 'Subtraction'
  }

  return 'Number sense'
})


const arithmeticGoal = computed(() => {

  if (arithmeticPercent.value === null) {
    return 'Teacher assessment needed'
  }

  if (arithmeticPercent.value >= 80) {
    return 'Extend reasoning'
  }

  if (arithmeticPercent.value >= 50) {
    return 'Subtraction accuracy'
  }

  return 'Addition'
})


/* =====================================================
   ASSIGNMENTS
   ===================================================== */

function subjectAssignments(subject) {

  return assignments.value
    .filter(
      a =>
        String(
          a.subject || ''
        ).toLowerCase() === subject
    )
    .sort(
      (a, b) =>
        String(
          b.assignedAt || ''
        ).localeCompare(
          String(
            a.assignedAt || ''
          )
        )
    )
}


const readingAssignment = computed(() =>
  subjectAssignments('reading')[0] || null
)


const arithmeticAssignment = computed(() =>
  subjectAssignments('arithmetic')[0] || null
)


const currentAssignment = computed(() => {

  if (
    selectedSubject.value ===
    'reading'
  ) {
    return readingAssignment.value
  }

  if (
    selectedSubject.value ===
    'arithmetic'
  ) {
    return arithmeticAssignment.value
  }

  return null
})


const selectedAssessmentExists = computed(() => {

  if (
    selectedSubject.value ===
    'reading'
  ) {
    return readingPercent.value !== null
  }

  return arithmeticPercent.value !== null
})


/* =====================================================
   SAFE JSON
   ===================================================== */

async function safeJson(response) {

  const text =
    await response.text()

  if (!text.trim()) {
    return {}
  }

  try {
    return JSON.parse(text)
  } catch {
    return {
      message: text
    }
  }
}


/* =====================================================
   LOAD STUDENT
   ===================================================== */

async function loadStudent() {

  loading.value = true
  error.value = ''

  const email = userEmail()

  if (!email) {

    loading.value = false

    error.value =
      'Your login session could not be found. Please log in again.'

    return
  }


  const local = storedUser()

  if (local) {

    student.value.name =
      'Aarav'

    student.value.email =
      local.email || email
  }


  try {

    const response =
      await fetch(
        `/api/students/by-email/${encodeURIComponent(email)}`
      )


    const data =
      await safeJson(response)


    if (!response.ok) {

      throw new Error(
        data.message ||
        'Could not load your student account.'
      )
    }


    student.value = {
      ...student.value,
      ...data,
      name: 'Aarav'
    }


    assignments.value =
      Array.isArray(
        data.assignments
      )
        ? data.assignments
        : []


    /*
     * Keep the latest real student
     * information in localStorage.
     */

    localStorage.setItem(
      'learnpathUser',
      JSON.stringify({
        ...(local || {}),
        id: data.id,
        name: 'Aarav',
        email: data.email,
        role: 'student',
        schoolId:
          data.schoolId ||
          local?.schoolId ||
          's1',
        classId:
          data.classId ||
          'c1'
      })
    )


    localStorage.setItem(
      'learnpath_user',
      JSON.stringify({
        ...(local || {}),
        id: data.id,
        name: 'Aarav',
        email: data.email,
        role: 'student',
        schoolId:
          data.schoolId ||
          local?.schoolId ||
          's1',
        classId:
          data.classId ||
          'c1'
      })
    )


  } catch (e) {

    error.value =
      e.message ||
      'Could not load your student account.'

  } finally {

    loading.value = false

  }
}


/* =====================================================
   LOAD ASSIGNMENTS
   ===================================================== */

async function loadAssignments() {

  if (!student.value.id) {
    return
  }


  try {

    const response =
      await fetch(
        `/api/assignments/${student.value.id}`
      )


    const data =
      await safeJson(response)


    if (
      response.ok &&
      Array.isArray(data)
    ) {

      assignments.value =
        data

    }

  } catch {

    // Student data can still be displayed.
  }
}


/* =====================================================
   NAVIGATION
   ===================================================== */

function openPath() {

  router.push(
    '/student'
  )

}


function openProgress() {

  router.push(
    '/student/progress'
  )

}


function openReading() {

  router.push({
    path:
      '/student/activity',
    query: {
      subject:
        'reading'
    }
  })

}


function openArithmetic() {

  router.push({
    path:
      '/student/activity',
    query: {
      subject:
        'arithmetic'
    }
  })

}


/* =====================================================
   RESET ACTIVITY
   ===================================================== */

function resetActivity() {

  started.value =
    false

  completed.value =
    false

  questionIndex.value =
    0

  answers.value =
    []

  score.value =
    null

  questions.value =
    []

  saving.value =
    false

}


/* =====================================================
   GENERATE QUESTIONS
   ===================================================== */

async function generateQuestions() {

  const assignment =
    currentAssignment.value


  try {

    const response =
      await fetch(
        '/api/ai/student-questions',
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify({

              assignmentId:
                assignment?.id ||
                null,

              subject:
                selectedSubject.value,

              group:
                assignment?.group ||
                (
                  selectedSubject.value ===
                  'reading'
                    ? readingGroupName.value
                    : arithmeticGroupName.value
                ),

              title:
                assignment?.title ||
                '',

              focus:
                assignment?.focus ||
                '',

              count:
                5

            })
        }
      )


    const data =
      await safeJson(response)


    if (!response.ok) {

      throw new Error(
        data.message ||
        'Question generation failed'
      )

    }


    questions.value =
      Array.isArray(
        data.questions
      )
        ? data.questions
        : []


    if (
      !questions.value.length
    ) {

      throw new Error(
        'No questions returned'
      )

    }


  } catch {

    /*
     * Safe offline fallback.
     */

    if (
      selectedSubject.value ===
      'arithmetic'
    ) {

      questions.value = [

        {
          question:
            '15 − 6 = ?',
          options:
            ['8', '9', '10'],
          answer:
            1
        },

        {
          question:
            '13 − 5 = ?',
          options:
            ['7', '8', '9'],
          answer:
            1
        },

        {
          question:
            '20 − 7 = ?',
          options:
            ['12', '13', '14'],
          answer:
            1
        },

        {
          question:
            '17 − 8 = ?',
          options:
            ['8', '9', '10'],
          answer:
            1
        },

        {
          question:
            '14 − 6 = ?',
          options:
            ['7', '8', '9'],
          answer:
            1
        }

      ]

    } else {

      questions.value = [

        {
          question:
            'Choose the sentence that makes sense.',
          options: [
            'Birds can fly.',
            'Fly can birds.',
            'Birds fly can.'
          ],
          answer:
            0
        },

        {
          question:
            'Complete: The girl ___ to school every day.',
          options: [
            'walks',
            'blue',
            'book'
          ],
          answer:
            0
        },

        {
          question:
            'What does Sam have? “Sam has a red ball.”',
          options: [
            'A red ball',
            'A blue bag',
            'A green book'
          ],
          answer:
            0
        },

        {
          question:
            'Which word means nearly the same as happy?',
          options: [
            'glad',
            'small',
            'slow'
          ],
          answer:
            0
        },

        {
          question:
            'Choose the correct sentence.',
          options: [
            'The dog runs.',
            'Dog the runs.',
            'Runs dog the.'
          ],
          answer:
            0
        }

      ]

    }

  }

}


/* =====================================================
   START ACTIVITY
   ===================================================== */

async function startActivity() {

  error.value = ''


  if (!currentAssignment.value) {

    error.value =
      'Your teacher has not assigned an activity for this subject yet.'

    return
  }


  if (
    !selectedAssessmentExists.value
  ) {

    error.value =
      'Your teacher has not assessed this subject yet.'

    return
  }


  try {

    const response =
      await fetch(
        `/api/assignments/${currentAssignment.value.id}/start`,
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json'
          }
        }
      )


    const data =
      await safeJson(response)


    if (!response.ok) {

      throw new Error(
        data.message ||
        'Could not start the assigned activity.'
      )

    }


    assignments.value =
      assignments.value.map(
        a =>
          String(a.id) ===
          String(data.id)
            ? data
            : a
      )


    await generateQuestions()


    started.value =
      true

    completed.value =
      false

    questionIndex.value =
      0

    answers.value =
      []

    score.value =
      null


  } catch (e) {

    error.value =
      e.message ||
      'Could not start practice.'

  }

}


/* =====================================================
   ANSWER
   ===================================================== */

async function chooseAnswer(index) {

  answers.value[
    questionIndex.value
  ] = index


  if (
    questionIndex.value <
    questions.value.length - 1
  ) {

    questionIndex.value++

    return

  }


  await finishActivity()

}


/* =====================================================
   FINISH ACTIVITY
   ===================================================== */

async function finishActivity() {

  let result = 0


  questions.value.forEach(
    (question, index) => {

      if (
        answers.value[index] ===
        question.answer
      ) {

        result++

      }

    }
  )


  score.value =
    result

  completed.value =
    true

  saving.value =
    true


  try {

    const assignment =
      currentAssignment.value


    if (!assignment) {

      throw new Error(
        'No teacher assignment was found.'
      )

    }


    const response =
      await fetch(
        `/api/assignments/${assignment.id}/complete`,
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify({
              score:
                result,

              max:
                questions.value.length
            })
        }
      )


    const data =
      await safeJson(response)


    if (!response.ok) {

      throw new Error(
        data.message ||
        'Could not save your result.'
      )

    }


    const updatedAssignment =
      data.assignment ||
      data


    assignments.value =
      assignments.value.map(
        item =>
          String(item.id) ===
          String(updatedAssignment.id)
            ? updatedAssignment
            : item
      )


    if (data.student) {

      student.value = {
        ...student.value,
        ...data.student
      }

    }


    await loadStudent()


  } catch (e) {

    error.value =
      e.message ||
      'Could not save your result.'

  } finally {

    saving.value =
      false

  }

}


/* =====================================================
   RETRY
   ===================================================== */

function redo(subject) {

  router.push({
    path:
      '/student/activity',

    query: {
      subject
    }
  })

}


/* =====================================================
   LOGOUT
   ===================================================== */

function logout() {

  localStorage.removeItem(
    'learnpath_user'
  )

  localStorage.removeItem(
    'learnpathUser'
  )

  localStorage.removeItem(
    'learnpath_token'
  )

  localStorage.removeItem(
    'role'
  )

  router.push(
    '/login'
  )

}


/* =====================================================
   WATCH
   ===================================================== */

watch(
  () => route.query.subject,
  resetActivity
)


/* =====================================================
   LOAD
   ===================================================== */

onMounted(
  async () => {

    await loadStudent()

    await loadAssignments()

  }
)

</script>


<template>

  <div class="student-page">


    <!-- =================================================
         SIDEBAR
         ================================================= -->

    <aside class="sidebar">

      <div class="brand">

        <div class="logo">
          LP
        </div>

        <div>

          <strong>
            LearnPath
          </strong>

          <small>
            Turning Signals to Actions
          </small>

        </div>

      </div>


      <div class="role">
        STUDENT
      </div>


      <nav>

        <button
          :class="{
            active:
              currentPage === 'path'
          }"
          @click="openPath"
        >
          My Learning Path
        </button>


        <button
          :class="{
            active:
              currentPage === 'activity'
          }"
          @click="
            router.push(
              '/student/activity'
            )
          "
        >
          My Activity
        </button>


        <button
          :class="{
            active:
              currentPage === 'progress'
          }"
          @click="openProgress"
        >
          My Progress
        </button>

      </nav>


      <div class="account">

        <span>
          Signed in as
        </span>

        <strong>
          {{ student.name || 'Student' }}
        </strong>

        <small>
          Student · Class
          {{ student.grade || 3 }}
        </small>

        <button
          @click="logout"
        >
          Log out
        </button>

      </div>

    </aside>


    <!-- =================================================
         CONTENT
         ================================================= -->

    <main class="content">


      <!-- LOADING -->

      <div
        v-if="loading"
        class="state-card"
      >
        Loading your student workspace...
      </div>


      <!-- ERROR -->

      <div
        v-else-if="error"
        class="error-card"
      >

        <strong>
          Student workspace
        </strong>

        <p>
          {{ error }}
        </p>

        <button
          @click="loadStudent"
        >
          Try again
        </button>

      </div>


      <template v-else>


        <!-- =================================================
             LEARNING PATH
             ================================================= -->

        <section
          v-if="
            currentPage === 'path'
          "
        >

          <header class="page-header">

            <div>

              <span>
                STUDENT · CLASS
                {{ student.grade || 3 }}
              </span>

              <h1>
                Hi, {{ student.name }}!
              </h1>

              <p>
                Your learning path reflects what your teacher has assessed and assigned.
              </p>

            </div>


            <div class="student-badge">

              <strong>
                {{ student.name }}
              </strong>

              <small>
                Class
                {{ student.grade || 3 }}
              </small>

            </div>

          </header>


          <div class="eyebrow">
            MY LEARNING PATH
          </div>


          <h2>
            Your next learning step
          </h2>


          <div class="path-grid">


            <!-- =========================================
                 READING
                 ========================================= -->

            <article class="path-card">

              <div class="card-head">

                <span>
                  READING
                </span>

                <b>
                  {{ readingGroupName }}
                </b>

              </div>


              <template
                v-if="
                  readingPercent !== null
                "
              >

                <strong class="percentage">
                  {{ readingPercent }}%
                </strong>

                <small>
                  Teacher assessment:
                  {{ student.readingScore }}/{{ student.readingMax }}
                </small>


                <div class="bar">

                  <i
                    :style="{
                      width:
                        readingPercent + '%'
                    }"
                  ></i>

                </div>


                <div class="two-col">

                  <div>

                    <label>
                      CURRENT LEVEL
                    </label>

                    <strong>
                      {{ readingLevel }}
                    </strong>

                  </div>


                  <div>

                    <label>
                      NEXT GOAL
                    </label>

                    <strong>
                      {{ readingGoal }}
                    </strong>

                  </div>

                </div>

              </template>


              <template v-else>

                <div class="waiting-block">

                  <strong>
                    Not assessed yet
                  </strong>

                  <p>
                    Your teacher has not entered a reading assessment for you yet.
                  </p>

                </div>

              </template>


              <!-- ASSIGNMENT -->

              <div
                v-if="readingAssignment"
                class="assigned"
              >

                <label>
                  TEACHER-ASSIGNED ACTIVITY
                </label>

                <strong>
                  {{ readingAssignment.title }}
                </strong>

                <small>
                  {{
                    readingAssignment.focus ||
                    'Complete the activity selected for your learning group.'
                  }}
                </small>

              </div>


              <div
                v-else
                class="not-assigned"
              >

                <strong>
                  No reading activity assigned yet
                </strong>

                <p>
                  Your teacher can assign your next reading activity after assessment.
                </p>

              </div>


              <button
                class="lime"
                :disabled="
                  !readingAssignment ||
                  readingPercent === null
                "
                @click="openReading"
              >

                {{
                  readingAssignment &&
                  readingPercent !== null
                    ? 'Open Reading →'
                    : 'Waiting for teacher →'
                }}

              </button>

            </article>


            <!-- =========================================
                 ARITHMETIC
                 ========================================= -->

            <article class="path-card">

              <div class="card-head">

                <span>
                  ARITHMETIC
                </span>

                <b>
                  {{ arithmeticGroupName }}
                </b>

              </div>


              <template
                v-if="
                  arithmeticPercent !== null
                "
              >

                <strong class="percentage">
                  {{ arithmeticPercent }}%
                </strong>

                <small>
                  Teacher assessment:
                  {{ student.arithmeticScore }}/{{ student.arithmeticMax }}
                </small>


                <div class="bar">

                  <i
                    :style="{
                      width:
                        arithmeticPercent + '%'
                    }"
                  ></i>

                </div>


                <div class="two-col">

                  <div>

                    <label>
                      CURRENT LEVEL
                    </label>

                    <strong>
                      {{ arithmeticLevel }}
                    </strong>

                  </div>


                  <div>

                    <label>
                      NEXT GOAL
                    </label>

                    <strong>
                      {{ arithmeticGoal }}
                    </strong>

                  </div>

                </div>

              </template>


              <template v-else>

                <div class="waiting-block">

                  <strong>
                    Not assessed yet
                  </strong>

                  <p>
                    Your teacher has not entered an arithmetic assessment for you yet.
                  </p>

                </div>

              </template>


              <!-- ASSIGNMENT -->

              <div
                v-if="arithmeticAssignment"
                class="assigned"
              >

                <label>
                  TEACHER-ASSIGNED ACTIVITY
                </label>

                <strong>
                  {{ arithmeticAssignment.title }}
                </strong>

                <small>
                  {{
                    arithmeticAssignment.focus ||
                    'Complete the activity selected for your learning group.'
                  }}
                </small>

              </div>


              <div
                v-else
                class="not-assigned"
              >

                <strong>
                  No arithmetic activity assigned yet
                </strong>

                <p>
                  Your teacher can assign your next arithmetic activity after assessment.
                </p>

              </div>


              <button
                class="lime"
                :disabled="
                  !arithmeticAssignment ||
                  arithmeticPercent === null
                "
                @click="openArithmetic"
              >

                {{
                  arithmeticAssignment &&
                  arithmeticPercent !== null
                    ? 'Open Arithmetic →'
                    : 'Waiting for teacher →'
                }}

              </button>

            </article>

          </div>


          <div class="info">

            <strong>
              What happens next?
            </strong>

            <p>
              When your teacher assesses you, your learning level updates. When your teacher assigns an activity, it appears here for you to practise.
            </p>

          </div>

        </section>


        <!-- =================================================
             ACTIVITY
             ================================================= -->

        <section
          v-if="
            currentPage === 'activity'
          "
        >

          <header class="page-header">

            <div>

              <span>
                MY ACTIVITY
              </span>

              <h1>

                {{
                  selectedSubject
                    ? student.name +
                      ' · ' +
                      (
                        selectedSubject ===
                        'reading'
                          ? 'Reading'
                          : 'Arithmetic'
                      )
                    : 'My Activity'
                }}

              </h1>

              <p>
                Complete activities assigned by your teacher.
              </p>

            </div>

          </header>


          <div
            v-if="!selectedSubject"
            class="choose-grid"
          >

            <button
              @click="openReading"
            >

              <strong>
                Reading
              </strong>

              <small>
                {{
                  readingPercent === null
                    ? 'Not assessed yet'
                    : readingGroupName
                }}
              </small>

            </button>


            <button
              @click="openArithmetic"
            >

              <strong>
                Arithmetic
              </strong>

              <small>
                {{
                  arithmeticPercent === null
                    ? 'Not assessed yet'
                    : arithmeticGroupName
                }}
              </small>

            </button>

          </div>


          <template v-else>


            <div class="activity-heading">

              <div class="eyebrow">

                {{
                  selectedSubject ===
                  'reading'
                    ? 'READING'
                    : 'ARITHMETIC'
                }}

              </div>

              <h2>

                {{
                  currentAssignment?.title ||
                  'No activity assigned yet'
                }}

              </h2>

              <p
                v-if="
                  currentAssignment
                "
              >

                {{
                  currentAssignment.focus ||
                  'Your teacher selected this activity for your current learning level.'
                }}

              </p>

            </div>


            <!-- NO ASSESSMENT -->

            <div
              v-if="
                !selectedAssessmentExists
              "
              class="empty-card"
            >

              <h2>
                Waiting for your teacher's assessment
              </h2>

              <p>
                You can start this subject after your teacher records an assessment.
              </p>

              <button
                class="outline"
                @click="openPath"
              >
                Back to My Learning Path
              </button>

            </div>


            <!-- NO ASSIGNMENT -->

            <div
              v-else-if="
                !currentAssignment
              "
              class="empty-card"
            >

              <h2>
                No activity assigned yet
              </h2>

              <p>
                Your teacher has assessed this subject, but has not assigned a practice activity yet.
              </p>

              <button
                class="outline"
                @click="openPath"
              >
                Back to My Learning Path
              </button>

            </div>


            <!-- START -->

            <div
              v-else-if="
                !started &&
                !completed
              "
              class="practice-card"
            >

              <span class="tag">
                TEACHER-ASSIGNED ACTIVITY
              </span>

              <h2>
                {{ currentAssignment.title }}
              </h2>

              <p>
                {{
                  currentAssignment.focus ||
                  'Short practice based on the activity selected by your teacher.'
                }}
              </p>

              <div class="tags">

                <span>
                  5 questions
                </span>

                <span>
                  {{
                    selectedSubject ===
                    'reading'
                      ? readingGroupName
                      : arithmeticGroupName
                  }}
                </span>

              </div>

              <button
                class="lime"
                @click="startActivity"
              >
                Start Practice →
              </button>

            </div>


            <!-- QUESTIONS -->

            <div
              v-else-if="
                started &&
                !completed
              "
              class="question-card"
            >

              <div class="question-head">

                <span>
                  Question
                  {{ questionIndex + 1 }}
                  /
                  {{ questions.length }}
                </span>

                <b>
                  {{
                    selectedSubject ===
                    'reading'
                      ? 'Reading'
                      : 'Arithmetic'
                  }}
                </b>

              </div>


              <div class="question-bar">

                <i
                  :style="{
                    width:
                      (
                        (
                          questionIndex + 1
                        ) /
                        questions.length
                      ) *
                      100 +
                      '%'
                  }"
                ></i>

              </div>


              <h2>
                {{
                  questions[
                    questionIndex
                  ]?.question
                }}
              </h2>


              <div class="options">

                <button
                  v-for="
                    (
                      option,
                      index
                    ) in
                    questions[
                      questionIndex
                    ]?.options"
                  :key="index"
                  @click="
                    chooseAnswer(index)
                  "
                >

                  <b>
                    {{
                      String.fromCharCode(
                        65 + index
                      )
                    }}
                  </b>

                  {{ option }}

                </button>

              </div>

            </div>


            <!-- RESULT -->

            <div
              v-else
              class="result-card"
            >

              <div class="result-box">

                <span>
                  PRACTICE RESULT
                </span>

                <strong>
                  {{ score }}/{{ questions.length }}
                </strong>

                <small>
                  {{
                    pct(
                      score,
                      questions.length
                    )
                  }}%
                </small>

              </div>


              <div class="feedback">

                <h2>

                  {{
                    pct(
                      score,
                      questions.length
                    ) >= 80
                      ? 'Excellent work!'
                      : pct(
                          score,
                          questions.length
                        ) >= 60
                        ? 'Good progress!'
                        : 'Good effort!'
                  }}

                </h2>

                <p>
                  Your result has been sent back to your teacher's workspace.
                </p>

              </div>


              <div
                v-if="saving"
                class="saving"
              >
                Saving your result...
              </div>


              <div
                v-else
                class="saved"
              >
                ✓ Result saved for your teacher.
              </div>


              <div class="actions">

                <button
                  class="outline"
                  @click="
                    redo(
                      selectedSubject
                    )
                  "
                >
                  Practise Again
                </button>


                <button
                  class="lime"
                  @click="openProgress"
                >
                  View My Progress →
                </button>

              </div>

            </div>

          </template>

        </section>


        <!-- =================================================
             PROGRESS
             ================================================= -->

        <section
          v-if="
            currentPage === 'progress'
          "
        >

          <header class="page-header">

            <div>

              <span>
                STUDENT · CLASS
                {{ student.grade || 3 }}
              </span>

              <h1>
                Hi, {{ student.name }}!
              </h1>

              <p>
                See your latest teacher-assessed learning levels.
              </p>

            </div>

          </header>


          <div class="eyebrow">
            MY PROGRESS
          </div>


          <h2>
            Your learning progress
          </h2>


          <div class="progress-grid">


            <!-- READING -->

            <article class="progress-card">

              <span>
                READING
              </span>


              <template
                v-if="
                  readingPercent !== null
                "
              >

                <strong>
                  {{ readingPercent }}%
                </strong>

                <small>
                  Latest teacher assessment:
                  {{ student.readingScore }}/{{ student.readingMax }}
                </small>

                <b>
                  {{ readingGroupName }}
                </b>

                <p>
                  Current:
                  {{ readingLevel }}
                </p>

                <p>
                  Next:
                  {{ readingGoal }}
                </p>

              </template>


              <template v-else>

                <strong class="notyet">
                  Not assessed
                </strong>

                <p>
                  Your teacher has not assessed reading yet.
                </p>

              </template>

            </article>


            <!-- ARITHMETIC -->

            <article class="progress-card">

              <span>
                ARITHMETIC
              </span>


              <template
                v-if="
                  arithmeticPercent !== null
                "
              >

                <strong>
                  {{ arithmeticPercent }}%
                </strong>

                <small>
                  Latest teacher assessment:
                  {{ student.arithmeticScore }}/{{ student.arithmeticMax }}
                </small>

                <b>
                  {{ arithmeticGroupName }}
                </b>

                <p>
                  Current:
                  {{ arithmeticLevel }}
                </p>

                <p>
                  Next:
                  {{ arithmeticGoal }}
                </p>

              </template>


              <template v-else>

                <strong class="notyet">
                  Not assessed
                </strong>

                <p>
                  Your teacher has not assessed arithmetic yet.
                </p>

              </template>

            </article>

          </div>

        </section>

      </template>

    </main>

  </div>

</template>


<style scoped>

* {
  box-sizing: border-box;
}


.student-page {

  height: 100vh;

  min-height: 100vh;

  overflow: hidden;

  background: #f5f8f6;

  color: #12201b;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

}


.sidebar {

  position: fixed;

  inset:
    0 auto 0 0;

  width: 220px;

  background: #104738;

  color: white;

  padding:
    22px
    15px;

  display: flex;

  flex-direction: column;

  z-index: 5;

}


.brand {

  display: flex;

  gap: 9px;

  align-items: center;

  margin-bottom: 38px;

}


.logo {

  width: 38px;

  height: 38px;

  border-radius: 10px;

  background: #c7ff24;

  color: #104738;

  display: grid;

  place-items: center;

  font-weight: 900;

}


.brand strong {

  display: block;

  font-size: 15px;

}


.brand small {

  display: block;

  color: #91b4aa;

  font-size: 8px;

  margin-top: 3px;

}


.role {

  font-size: 9px;

  letter-spacing: 1.8px;

  font-weight: 900;

  color: #a6c5bc;

  margin-bottom: 10px;

}


nav {

  display: flex;

  flex-direction: column;

  gap: 3px;

}


nav button {

  border: 0;

  background: transparent;

  color: white;

  text-align: left;

  padding:
    11px
    12px;

  border-radius: 8px;

  cursor: pointer;

  font-size: 12px;

  font-weight: 700;

}


nav button.active,
nav button:hover {

  background: #226955;

}


.account {

  margin-top: auto;

  border-top:
    1px solid
    rgba(
      255,
      255,
      255,
      .12
    );

  padding-top: 16px;

  display: flex;

  flex-direction: column;

}


.account span {

  font-size: 9px;

  color: #91b4aa;

}


.account strong {

  font-size: 12px;

  margin-top: 4px;

}


.account small {

  font-size: 8px;

  color: #91b4aa;

  margin-top: 3px;

}


.account button {

  margin-top: 18px;

  border: 0;

  background: none;

  color: white;

  text-align: left;

  padding: 0;

  cursor: pointer;

  font-size: 11px;

  font-weight: 700;

}


.content {

  margin-left: 220px;

  width:
    calc(
      100% - 220px
    );

  height: 100vh;

  overflow-y: auto;

  overflow-x: hidden;

  padding:
    26px
    30px
    40px;

}


.content > section {

  width: 100%;

  max-width: none;

  margin: 0;

}


.page-header {

  display: flex;

  justify-content:
    space-between;

  align-items:
    flex-start;

  gap: 20px;

  margin-bottom: 20px;

}


.page-header
> div:first-child
> span,
.eyebrow,
.path-card
.card-head
span,
.progress-card
> span,
.tag {

  font-size: 9px;

  letter-spacing: 1.7px;

  color: #668d32;

  font-weight: 900;

}


.page-header h1 {

  font-size: 30px;

  letter-spacing: -1px;

  margin:
    8px
    0
    5px;

}


.page-header p {

  font-size: 12px;

  color: #63776f;

  margin: 0;

  line-height: 1.5;

}


.student-badge {

  background: #edf6e3;

  border-radius: 10px;

  padding:
    9px
    13px;

  text-align: center;

}


.student-badge strong,
.student-badge small {

  display: block;

}


.student-badge strong {

  font-size: 10px;

}


.student-badge small {

  font-size: 8px;

  color: #68776f;

  margin-top: 3px;

}


.content > section > h2 {

  font-size: 22px;

  margin:
    7px
    0
    16px;

}


.path-grid {

  display: grid;

  grid-template-columns:
    repeat(
      2,
      minmax(
        0,
        1fr
      )
    );

  gap: 14px;

}


.path-card {

  background: white;

  border:
    1px solid
    #dce6e1;

  border-radius: 13px;

  padding: 17px;

  min-width: 0;

}


.card-head {

  display: flex;

  justify-content:
    space-between;

  align-items: center;

  gap: 10px;

}


.card-head b,
.progress-card > b {

  background: #edf6dc;

  color: #527d24;

  padding:
    5px
    9px;

  border-radius: 20px;

  font-size: 8px;

}


.percentage {

  display: block;

  font-size: 29px;

  margin:
    9px
    0
    3px;

}


.path-card > small {

  font-size: 9px;

  color: #687b74;

}


.bar {

  height: 6px;

  background: #e7eee9;

  border-radius: 20px;

  overflow: hidden;

  margin:
    10px
    0;

}


.bar i,
.question-bar i {

  display: block;

  height: 100%;

  background: #baff20;

  border-radius: 20px;

}


.two-col {

  display: grid;

  grid-template-columns:
    1fr
    1fr;

  gap: 7px;

}


.two-col > div {

  background: #f3f6f3;

  border-radius: 8px;

  padding: 9px;

}


.two-col label,
.assigned label {

  display: block;

  font-size: 7px;

  letter-spacing: 1px;

  color: #71817b;

  font-weight: 800;

}


.two-col strong {

  display: block;

  font-size: 10px;

  margin-top: 4px;

}


.waiting-block {

  background: #f5f7f5;

  border-radius: 9px;

  padding: 14px;

  margin-top: 12px;

}


.waiting-block strong {

  font-size: 14px;

}


.waiting-block p,
.not-assigned p {

  font-size: 9px;

  color: #687b74;

  margin:
    5px
    0
    0;

  line-height: 1.5;

}


.assigned {

  margin-top: 8px;

  background: #edf7df;

  border-radius: 8px;

  padding: 9px;

}


.assigned strong {

  display: block;

  font-size: 10px;

  margin-top: 4px;

}


.assigned small {

  display: block;

  color: #687b74;

  font-size: 8px;

  margin-top: 4px;

  line-height: 1.4;

}


.not-assigned {

  margin-top: 8px;

  background: #f5f7f5;

  border-radius: 8px;

  padding: 9px;

}


.not-assigned strong {

  font-size: 9px;

}


.lime {

  border: 0;

  background: #c7ff24;

  color: #12201b;

  border-radius: 8px;

  padding:
    10px
    14px;

  font-size: 10px;

  font-weight: 800;

  cursor: pointer;

  margin-top: 10px;

}


.lime:disabled {

  opacity: .5;

  cursor: not-allowed;

}


.info {

  background: #fff9dd;

  border-radius: 10px;

  padding:
    11px
    13px;

  margin-top: 12px;

}


.info strong {

  font-size: 10px;

}


.info p {

  font-size: 8px;

  color: #68776f;

  margin:
    4px
    0
    0;

  line-height: 1.5;

}


/* =====================================================
   ACTIVITY
   ===================================================== */

.choose-grid {

  display: grid;

  grid-template-columns:
    repeat(
      2,
      minmax(
        0,
        1fr
      )
    );

  gap: 12px;

}


.choose-grid button {

  background: white;

  border:
    1px solid
    #dce6e1;

  border-radius: 12px;

  padding: 18px;

  text-align: left;

  cursor: pointer;

}


.choose-grid strong,
.choose-grid small {

  display: block;

}


.choose-grid small {

  color: #687b74;

  margin-top: 5px;

  font-size: 9px;

}


.activity-heading {

  margin-bottom: 14px;

}


.activity-heading h2 {

  font-size: 22px;

  margin:
    7px
    0;

}


.activity-heading p {

  font-size: 11px;

  color: #63776f;

}


.practice-card,
.question-card,
.result-card,
.empty-card {

  background: white;

  border:
    1px solid
    #dce6e1;

  border-radius: 13px;

  padding: 22px;

}


.practice-card h2,
.empty-card h2 {

  font-size: 20px;

  margin:
    8px
    0;

}


.practice-card p,
.empty-card p {

  font-size: 11px;

  color: #63776f;

  line-height: 1.6;

  max-width: 800px;

}


.tags {

  display: flex;

  gap: 7px;

  margin:
    13px
    0;

}


.tags span {

  background: #f0f5f1;

  padding:
    7px
    10px;

  border-radius: 20px;

  font-size: 8px;

}


.question-head {

  display: flex;

  justify-content:
    space-between;

  font-size: 10px;

  color: #63776f;

}


.question-head b {

  color: #527d24;

}


.question-bar {

  height: 6px;

  background: #e7eee9;

  border-radius: 20px;

  overflow: hidden;

  margin:
    12px
    0
    20px;

}


.question-card h2 {

  font-size: 21px;

  margin-bottom: 18px;

}


.options {

  display: grid;

  gap: 8px;

}


.options button {

  border:
    1px solid
    #dce6e1;

  background: #f6f8f6;

  border-radius: 9px;

  padding: 12px;

  text-align: left;

  cursor: pointer;

  font-size: 11px;

}


.options button:hover {

  background: #edf7df;

}


.options b {

  display: inline-grid;

  place-items: center;

  width: 23px;

  height: 23px;

  border-radius: 50%;

  background: white;

  margin-right: 8px;

}


.result-box {

  text-align: center;

  background: #edf7df;

  border-radius: 10px;

  padding: 18px;

}


.result-box span {

  font-size: 8px;

  letter-spacing: 1px;

  color: #668d32;

  font-weight: 900;

}


.result-box strong {

  display: block;

  font-size: 34px;

  margin:
    6px
    0;

}


.result-box small {

  color: #63776f;

}


.feedback {

  background: #f4f7f4;

  border-radius: 10px;

  padding: 13px;

  margin-top: 9px;

}


.feedback h2 {

  font-size: 17px;

  margin:
    0
    0
    5px;

}


.feedback p {

  font-size: 9px;

  color: #687b74;

}


.saving,
.saved {

  padding: 9px;

  border-radius: 8px;

  font-size: 9px;

  margin-top: 9px;

}


.saving {

  background: #f2f4f2;

}


.saved {

  background: #edf7df;

  color: #4d7425;

}


.actions {

  display: flex;

  gap: 8px;

  margin-top: 12px;

}


.outline {

  border:
    1px solid
    #ccd8d1;

  background: white;

  color: #12201b;

  border-radius: 8px;

  padding:
    9px
    11px;

  font-size: 9px;

  font-weight: 800;

  cursor: pointer;

  margin-top: 10px;

}


.outline:hover {

  background: #edf7df;

}


/* =====================================================
   PROGRESS
   ===================================================== */

.progress-grid {

  display: grid;

  grid-template-columns:
    repeat(
      2,
      minmax(
        0,
        1fr
      )
    );

  gap: 14px;

}


.progress-card {

  background: white;

  border:
    1px solid
    #dce6e1;

  border-radius: 12px;

  padding: 18px;

  min-width: 0;

}


.progress-card > strong {

  display: block;

  font-size: 29px;

  margin:
    10px
    0
    6px;

}


.progress-card > small,
.progress-card > p {

  display: block;

  color: #687b74;

  font-size: 9px;

  line-height: 1.5;

}


.progress-card > b {

  display: inline-block;

  margin-top: 8px;

}


.progress-card > p {

  margin:
    7px
    0
    0;

}


.notyet {

  font-size: 20px !important;

}


/* =====================================================
   STATES
   ===================================================== */

.state-card,
.error-card {

  background: white;

  border:
    1px solid
    #dce6e1;

  border-radius: 12px;

  padding: 25px;

  text-align: center;

  color: #63776f;

}


.error-card {

  background: #fff5f4;

  border-color: #efc4c0;

  color: #9c332d;

  text-align: left;

}


.error-card p {

  font-size: 11px;

}


.error-card button {

  border:
    1px solid
    #d8aaa5;

  background: white;

  border-radius: 7px;

  padding:
    8px
    11px;

  cursor: pointer;

}


/* =====================================================
   RESPONSIVE
   ===================================================== */

@media (max-width: 900px) {

  .sidebar {

    width: 190px;

  }


  .content {

    margin-left: 190px;

    width:
      calc(
        100% - 190px
      );

    padding:
      22px;

  }


  .path-grid,
  .progress-grid {

    grid-template-columns:
      1fr;

  }


  .page-header {

    gap: 10px;

  }


  .student-badge {

    display: none;

  }

}


@media (max-width: 600px) {

  .student-page {

    height: auto;

    overflow: visible;

  }


  .sidebar {

    position: relative;

    width: 100%;

    min-height: auto;

  }


  .content {

    margin-left: 0;

    width: 100%;

    height: auto;

    overflow: visible;

    padding: 18px;

  }


  .path-grid,
  .progress-grid,
  .choose-grid {

    grid-template-columns:
      1fr;

  }


  .page-header {

    display: block;

  }


  .actions {

    flex-direction: column;

  }

}

</style>