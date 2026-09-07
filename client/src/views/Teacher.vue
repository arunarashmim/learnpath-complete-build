<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get, post } from '../services/api.js'

const router = useRouter()

const dashboard = ref(null)
const students = ref([])
const loading = ref(false)
const error = ref('')
const showAll = ref(false)

const name = ref('')
const email = ref('')
const rollNumber = ref('')
const adding = ref(false)
const addMessage = ref('')

/* =====================================================
   CLASSES
   Class 3 is the currently working class.
   Class 2 is displayed but not enabled yet.
   ===================================================== */

const classes = [
  {
    id: 'c2',
    label: 'Class 2',
    grade: 2,
    available: false
  },
  {
    id: 'c3',
    label: 'Class 3',
    grade: 3,
    available: true
  }
]

/*
  Keep the selected class if the teacher has already
  selected one.
*/
const selectedClassId = ref(
  localStorage.getItem('learnpath_selected_class') || ''
)

const selectedClass = computed(() => {
  return classes.find(
    item => item.id === selectedClassId.value
  ) || null
})

/* =====================================================
   SELECT CLASS
   ===================================================== */

function selectClass(classItem) {
  if (!classItem.available) {
    return
  }

  selectedClassId.value = classItem.id

  localStorage.setItem(
    'learnpath_selected_class',
    classItem.id
  )

  localStorage.setItem(
    'learnpath_class_selected',
    'true'
  )

  window.dispatchEvent(
    new Event('learnpath-class-selected')
  )

  error.value = ''
  addMessage.value = ''
  showAll.value = false

  load()
}

/* =====================================================
   LOAD CLASS 3
   ===================================================== */

async function load() {
  if (!selectedClass.value) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    dashboard.value = await get('/dashboard')

    students.value = await get('/students')

    if (!Array.isArray(students.value)) {
      students.value = []
    }
  } catch (e) {
    console.error(e)

    error.value =
      e.message ||
      'Could not load Class 3.'
  } finally {
    loading.value = false
  }
}

/*
  Only load automatically if a class has already been
  selected previously.
*/
onMounted(() => {
  if (selectedClass.value) {
    load()
  }
})

/* =====================================================
   COMPUTED DATA
   ===================================================== */

const assessed = computed(() =>
  students.value.filter(
    student => student.readingScore != null
  )
)

const average = computed(() =>
  dashboard.value?.classAverage ?? 0
)

const visibleStudents = computed(() =>
  showAll.value
    ? students.value
    : students.value.slice(0, 6)
)

const levelCounts = computed(() => ({
  A: students.value.filter(
    student => student.readingBand === 'A'
  ).length,

  B: students.value.filter(
    student => student.readingBand === 'B'
  ).length,

  C: students.value.filter(
    student => student.readingBand === 'C'
  ).length,

  D: students.value.filter(
    student => student.readingBand === 'D'
  ).length,

  unassessed: students.value.filter(
    student =>
      student.readingBand === 'unassessed'
  ).length
}))

/* =====================================================
   ADD STUDENT
   ===================================================== */

async function addStudent() {
  error.value = ''
  addMessage.value = ''

  if (!selectedClass.value) {
    error.value =
      'Please select a class first.'

    return
  }

  if (!name.value.trim()) {
    error.value =
      'Please enter the student name.'

    return
  }

  if (!email.value.trim()) {
    error.value =
      'Please enter the student email.'

    return
  }

  if (!rollNumber.value.trim()) {
    error.value =
      'Please enter the roll number.'

    return
  }

  adding.value = true

  try {
    await post('/students', {
      name: name.value.trim(),
      email: email.value.trim(),
      rollNumber: rollNumber.value.trim(),

      classId: selectedClass.value.id,
      grade: selectedClass.value.grade
    })

    addMessage.value =
      `Student linked to ${selectedClass.value.label} successfully.`

    name.value = ''
    email.value = ''
    rollNumber.value = ''

    await load()
  } catch (e) {
    console.error(e)

    error.value =
      e.message ||
      'Could not add student.'
  } finally {
    adding.value = false
  }
}

/* =====================================================
   NAVIGATION
   ===================================================== */

function go(path) {
  if (!selectedClass.value) {
    error.value =
      'Please select Class 3 first.'

    return
  }

  router.push({
    path,
    query: {
      classId: selectedClass.value.id,
      grade: String(
        selectedClass.value.grade
      )
    }
  })
}
</script>

<template>
  <div class="page">

    <!-- =================================================
         CLASS SELECTION SCREEN
         ================================================= -->

    <template v-if="!selectedClass">

      <header class="selection-header">

        <div>
          <div class="eyebrow">
            TEACHER · CLASS MONITOR
          </div>

          <h1>
            Select a class
          </h1>

          <p>
            Choose a class to begin teaching and assessment.
          </p>
        </div>

      </header>

      <section class="classes-section">

        <div class="eyebrow">
          YOUR CLASSES
        </div>

        <div class="class-list">

          <!-- ===========================================
               CLASS 2
               =========================================== -->

          <button
            type="button"
            class="class-card disabled"
            disabled
          >

            <div class="class-number">
              2
            </div>

            <div class="class-info">

              <h2>
                Class 2
              </h2>

              <span>
                Grade 2
              </span>

              <small>
                Coming soon
              </small>

            </div>

          </button>

          <!-- ===========================================
               CLASS 3
               =========================================== -->

          <button
            type="button"
            class="class-card"
            @click="selectClass(classes[1])"
          >

            <div class="class-number">
              3
            </div>

            <div class="class-info">

              <h2>
                Class 3
              </h2>

              <span>
                Grade 3
              </span>

              <small class="working">
                Enter class →
              </small>

            </div>

          </button>

        </div>

      </section>

    </template>

    <!-- =================================================
         CLASS 3 TEACHER DASHBOARD
         ================================================= -->

    <template v-else>

      <div
        v-if="error"
        class="card error-card"
      >
        {{ error }}
      </div>

      <!-- HEADER -->

      <header class="top">

        <div>

          <div class="eyebrow">
            TEACHER · {{ selectedClass.label.toUpperCase() }}
          </div>

          <h1>
            Turn marks into action.
          </h1>

          <p class="muted">
            Assess students, understand their learning level,
            and choose the next teaching action.
          </p>

        </div>

        <div class="class-tag">

          <strong>
            {{ selectedClass.label }}
          </strong>

          <span>
            {{ students.length }} students
          </span>

        </div>

      </header>

      <!-- CHANGE CLASS -->

      <button
        type="button"
        class="change-class"
        @click="selectedClassId = ''"
      >
        ← Change class
      </button>

      <!-- =================================================
           TODAY'S LOOP
           ================================================= -->

      <section class="card loop-card">

        <div class="section-title">

          <div>

            <div class="eyebrow">
              TODAY'S LOOP
            </div>

            <h2>
              Turn marks into the next teaching action
            </h2>

          </div>

          <span class="pill success">
            {{ selectedClass.label }} selected
          </span>

        </div>

        <div class="steps">

          <!-- ASSESS -->

          <button
            type="button"
            class="step"
            @click="go('/assessment')"
          >

            <b>
              1
            </b>

            <span>

              <strong>
                Assess
              </strong>

              <small>
                Enter marks
              </small>

            </span>

            <i>
              →
            </i>

          </button>

          <!-- DIAGNOSE -->

          <button
            type="button"
            class="step"
            @click="go('/diagnose')"
          >

            <b>
              2
            </b>

            <span>

              <strong>
                Diagnose &amp; Group
              </strong>

              <small>
                Learning level from marks
              </small>

            </span>

            <i>
              →
            </i>

          </button>

          <!-- ACT -->

          <button
            type="button"
            class="step"
            @click="go('/act')"
          >

            <b>
              3
            </b>

            <span>

              <strong>
                Act
              </strong>

              <small>
                Choose today's intervention
              </small>

            </span>

            <i>
              →
            </i>

          </button>

          <!-- REASSESS -->

          <button
            type="button"
            class="step"
            @click="go('/reassess')"
          >

            <b>
              4
            </b>

            <span>

              <strong>
                Reassess
              </strong>

              <small>
                Track movement
              </small>

            </span>

            <i>
              →
            </i>

          </button>

        </div>

      </section>

      <!-- =================================================
           MAIN DASHBOARD
           ================================================= -->

      <div class="home-grid">

        <!-- STUDENTS -->

        <section class="card home-card students-card">

          <div class="eyebrow">
            {{ selectedClass.label.toUpperCase() }} STUDENTS
          </div>

          <div class="card-heading">

            <h2>
              {{ students.length }} Students
            </h2>

            <span>
              {{ assessed.length }} assessed
            </span>

          </div>

          <p class="muted">
            Students linked to this teacher's
            {{ selectedClass.label }}.
          </p>

          <div
            v-if="loading"
            class="empty"
          >
            Loading students...
          </div>

          <div
            v-else-if="students.length === 0"
            class="empty"
          >
            No students added yet.
          </div>

          <div
            v-else
            class="student-list"
          >

            <div
              v-for="student in visibleStudents"
              :key="student.id"
              class="student-line"
            >

              <div>

                <strong>
                  {{ student.name }}
                </strong>

                <small>
                  {{ student.email }}
                </small>

              </div>

              <span>
                {{
                  student.readingBand === 'unassessed'
                    ? 'Not assessed'
                    : 'Group ' + student.readingBand
                }}
              </span>

            </div>

          </div>

          <button
            v-if="students.length > 6"
            type="button"
            class="outline-button"
            @click="showAll = !showAll"
          >
            {{
              showAll
                ? 'Show fewer students ↑'
                : `View all ${students.length} students →`
            }}
          </button>

        </section>

        <!-- ADD STUDENT -->

        <section class="card home-card add-card">

          <div class="eyebrow">
            ADD STUDENT
          </div>

          <h2>
            Link a learner
          </h2>

          <p class="muted">
            Use the student's existing LearnPath account
            so every assessment reaches the correct learner.
          </p>

          <label>
            Student name *
          </label>

          <input
            v-model="name"
            type="text"
            placeholder="e.g. Rahul Kumar"
          />

          <label>
            Student email *
          </label>

          <input
            v-model="email"
            type="email"
            placeholder="student@gmail.com"
          />

          <label>
            Roll number *
          </label>

          <input
            v-model="rollNumber"
            type="text"
            placeholder="e.g. 12"
          />

          <button
            type="button"
            class="btn lime wide"
            :disabled="adding"
            @click="addStudent"
          >
            {{
              adding
                ? 'Linking…'
                : `Add to ${selectedClass.label} →`
            }}
          </button>

          <div
            v-if="addMessage"
            class="success-message"
          >
            ✓ {{ addMessage }}
          </div>

        </section>

        <!-- CLASS SNAPSHOT -->

        <section class="card home-card snapshot-card">

          <div class="eyebrow">
            CLASS SNAPSHOT
          </div>

          <h2>
            {{ average }}% reading average
          </h2>

          <p class="muted">
            Latest evidence across
            {{ selectedClass.label }}.
          </p>

          <div class="snapshot-grid">

            <button
              type="button"
              @click="go('/diagnose')"
            >

              <b>
                {{ levelCounts.A }}
              </b>

              <span>
                Group A
              </span>

              <small>
                80–100%
              </small>

            </button>

            <button
              type="button"
              @click="go('/diagnose')"
            >

              <b>
                {{ levelCounts.B }}
              </b>

              <span>
                Group B
              </span>

              <small>
                60–79%
              </small>

            </button>

            <button
              type="button"
              @click="go('/diagnose')"
            >

              <b>
                {{ levelCounts.C }}
              </b>

              <span>
                Group C
              </span>

              <small>
                35–59%
              </small>

            </button>

            <button
              type="button"
              @click="go('/diagnose')"
            >

              <b>
                {{ levelCounts.D }}
              </b>

              <span>
                Group D
              </span>

              <small>
                0–34%
              </small>

            </button>

          </div>

          <div class="snapshot-footer">

            <span>
              {{ levelCounts.unassessed }}
              not assessed
            </span>

            <button
              type="button"
              @click="go('/diagnose')"
            >
              View learning levels →
            </button>

          </div>

        </section>

      </div>

    </template>

  </div>
</template>

<style scoped>

* {
  box-sizing: border-box;
}

/* =====================================================
   CLASS SELECTION SCREEN
   ===================================================== */

.selection-header {
  margin-bottom: 48px;
}

.selection-header .eyebrow {
  margin-bottom: 8px;
}

.selection-header h1 {
  margin: 0 0 8px;
  font-size: 42px;
  line-height: 1.05;
  color: #071a15;
}

.selection-header p {
  margin: 0;
  color: #52636d;
  font-size: 14px;
}

.classes-section {
  width: 100%;
}

.classes-section > .eyebrow {
  margin-bottom: 10px;
}

.class-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.class-card {
  width: 100%;
  min-height: 110px;

  display: flex;
  align-items: center;

  padding: 22px;

  background: #ffffff;
  border: 1px solid #a8d34d;
  border-radius: 17px;

  text-align: left;

  cursor: pointer;

  transition:
    transform .18s ease,
    box-shadow .18s ease,
    border-color .18s ease;
}

.class-card:hover {
  transform: translateY(-2px);
  border-color: #8fc62f;
  box-shadow:
    0 12px 28px rgba(24, 62, 45, .08);
}

.class-card.disabled {
  cursor: not-allowed;
  opacity: .58;
  background: #f8faf9;
  border-color: #d9e2dc;
}

.class-card.disabled:hover {
  transform: none;
  box-shadow: none;
}

.class-number {
  width: 58px;
  height: 58px;

  min-width: 58px;

  display: grid;
  place-items: center;

  margin-right: 18px;

  border-radius: 14px;

  background: #b9ff18;

  color: #17372b;

  font-size: 24px;
  font-weight: 900;
}

.class-info h2 {
  margin: 0 0 4px;

  font-size: 20px;
  color: #071a15;
}

.class-info span {
  display: block;

  font-size: 12px;
  color: #66756f;
}

.class-info small {
  display: block;

  margin-top: 8px;

  font-size: 11px;
  font-weight: 800;

  color: #7c8a84;
}

.class-info small.working {
  color: #5a7e1d;
}

/* =====================================================
   COMMON
   ===================================================== */

.top,
.section-title,
.card-heading {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
}

.top {
  margin-bottom: 8px;
}

.top h1 {
  margin: 4px 0 8px;
}

.muted {
  color: #64748b;
}

.class-tag {
  background: #f2f8e9;
  border-radius: 14px;
  padding: 13px 18px;
  text-align: center;
}

.class-tag strong,
.class-tag span {
  display: block;
}

.class-tag span {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.change-class {
  border: 0;
  background: transparent;
  color: #536b25;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  padding: 4px 0 16px;
}

/* =====================================================
   LOOP
   ===================================================== */

.loop-card {
  margin-bottom: 16px;
}

.section-title h2 {
  margin: 5px 0;
}

.steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 18px;
}

.step {
  display: flex;
  align-items: center;
  gap: 10px;

  border: 1px solid #dfe7e2;
  background: #fff;
  border-radius: 13px;

  padding: 13px;

  text-align: left;

  cursor: pointer;

  transition: .2s;
}

.step:hover {
  border-color: #a3d977;
  box-shadow:
    0 7px 18px rgba(0, 0, 0, .05);

  transform: translateY(-1px);
}

.step > b {
  width: 30px;
  height: 30px;
  min-width: 30px;

  border-radius: 50%;

  background: #eaf7d8;

  display: grid;
  place-items: center;
}

.step span {
  flex: 1;
}

.step strong,
.step small {
  display: block;
}

.step small {
  font-size: 10px;
  color: #64748b;
  margin-top: 3px;
}

.step i {
  font-style: normal;
  color: #536b25;
  font-weight: 800;
}

/* =====================================================
   DASHBOARD GRID
   ===================================================== */

.home-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr 1.05fr;
  gap: 16px;
}

.home-card {
  min-height: 350px;
}

.card-heading {
  align-items: center;
}

.card-heading h2 {
  margin: 7px 0;
}

.card-heading span {
  font-size: 11px;

  background: #f1f5f9;

  padding: 6px 9px;

  border-radius: 999px;

  color: #64748b;
}

/* =====================================================
   STUDENTS
   ===================================================== */

.student-list {
  margin-top: 14px;
}

.student-line {
  display: flex;
  justify-content: space-between;
  gap: 10px;

  padding: 10px 0;

  border-top: 1px solid #eef2f0;
}

.student-line strong,
.student-line small {
  display: block;
}

.student-line small {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

.student-line > span {
  font-size: 11px;
  color: #536b25;
  white-space: nowrap;
}

.empty {
  padding: 24px 0;
  color: #94a3b8;
  font-size: 12px;
}

.outline-button,
.snapshot-footer button {
  border: 0;
  background: transparent;

  color: #536b25;

  font-weight: 800;

  cursor: pointer;

  padding: 8px 0;
}

/* =====================================================
   ADD STUDENT
   ===================================================== */

.add-card label {
  display: block;

  font-size: 11px;
  font-weight: 800;

  margin: 10px 0 5px;
}

.add-card input {
  width: 100%;

  padding: 11px;

  border: 1px solid #dbe4dc;
  border-radius: 9px;

  outline: none;
}

.add-card input:focus {
  border-color: #9bc46a;
}

.wide {
  width: 100%;
  margin-top: 15px;
}

.success-message {
  margin-top: 10px;

  padding: 9px;

  background: #effbea;

  border-radius: 8px;

  color: #426522;

  font-size: 11px;
}

/* =====================================================
   SNAPSHOT
   ===================================================== */

.snapshot-grid {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 9px;

  margin-top: 15px;
}

.snapshot-grid button {
  border: 1px solid #e3e9e5;

  background: #fff;

  border-radius: 11px;

  padding: 12px;

  text-align: left;

  cursor: pointer;
}

.snapshot-grid button:hover {
  border-color: #a3d977;
  background: #fbfdf8;
}

.snapshot-grid b,
.snapshot-grid span,
.snapshot-grid small {
  display: block;
}

.snapshot-grid b {
  font-size: 22px;
}

.snapshot-grid span {
  font-size: 12px;
  font-weight: 800;
  margin-top: 2px;
}

.snapshot-grid small {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

.snapshot-footer {
  display: flex;

  justify-content: space-between;

  gap: 10px;

  align-items: center;

  margin-top: 12px;

  font-size: 11px;

  color: #64748b;
}

.error-card {
  border: 1px solid #fecaca;
}

/* =====================================================
   RESPONSIVE
   ===================================================== */

@media (max-width: 1000px) {

  .steps,
  .home-grid {
    grid-template-columns: 1fr 1fr;
  }

}

@media (max-width: 700px) {

  .selection-header h1 {
    font-size: 34px;
  }

  .class-card {
    min-height: 95px;
  }

}

@media (max-width: 650px) {

  .steps,
  .home-grid {
    grid-template-columns: 1fr;
  }

  .top,
  .section-title {
    flex-direction: column;
  }

  .class-tag {
    align-self: flex-start;
  }

}
</style>