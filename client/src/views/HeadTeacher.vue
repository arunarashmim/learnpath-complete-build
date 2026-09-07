<script setup>
import { ref, computed, onMounted } from 'vue'
import { get } from '../services/api.js'

const classes = ref([])
const analytics = ref(null)
const selectedClass = ref(null)
const loading = ref(true)
const error = ref('')

const students = ref([])

const hasSelectedClass = computed(() => {
  return !!selectedClass.value
})

const totalStudents = computed(() => {
  if (selectedClass.value?.students) {
    return selectedClass.value.students
  }

  return students.value.length
})

const readingAverage = computed(() => {
  if (!students.value.length) return 0

  const valid = students.value.filter(
    s =>
      Number.isFinite(Number(s.readingScore)) &&
      Number(s.readingMax) > 0
  )

  if (!valid.length) return 0

  const total = valid.reduce(
    (sum, s) =>
      sum +
      (Number(s.readingScore) /
        Number(s.readingMax)) *
        100,
    0
  )

  return Math.round(total / valid.length)
})

const arithmeticAverage = computed(() => {
  if (!students.value.length) return 0

  const valid = students.value.filter(
    s =>
      Number.isFinite(Number(s.arithmeticScore)) &&
      Number(s.arithmeticMax) > 0
  )

  if (!valid.length) return 0

  const total = valid.reduce(
    (sum, s) =>
      sum +
      (Number(s.arithmeticScore) /
        Number(s.arithmeticMax)) *
        100,
    0
  )

  return Math.round(total / valid.length)
})

const readingGroups = computed(() => {
  const groups = {
    A: [],
    B: [],
    C: [],
    D: []
  }

  students.value.forEach(student => {
    const score = Number(student.readingScore)
    const max = Number(student.readingMax)

    if (!Number.isFinite(score) || max <= 0) return

    const percentage = (score / max) * 100

    if (percentage >= 80) {
      groups.A.push(student)
    } else if (percentage >= 60) {
      groups.B.push(student)
    } else if (percentage >= 35) {
      groups.C.push(student)
    } else {
      groups.D.push(student)
    }
  })

  return groups
})

const arithmeticGroups = computed(() => {
  const groups = {
    Foundation: [],
    Practice: [],
    Secure: []
  }

  students.value.forEach(student => {
    const score = Number(student.arithmeticScore)
    const max = Number(student.arithmeticMax)

    if (!Number.isFinite(score) || max <= 0) return

    const percentage = (score / max) * 100

    if (percentage >= 80) {
      groups.Secure.push(student)
    } else if (percentage >= 50) {
      groups.Practice.push(student)
    } else {
      groups.Foundation.push(student)
    }
  })

  return groups
})

const readingGroupList = computed(() => [
  {
    name: 'Group A',
    description: 'Std II text',
    count: readingGroups.value.A.length
  },
  {
    name: 'Group B',
    description: 'Sentences → Std II text',
    count: readingGroups.value.B.length
  },
  {
    name: 'Group C',
    description: 'Words → Sentences',
    count: readingGroups.value.C.length
  },
  {
    name: 'Group D',
    description: 'Earlier reading support',
    count: readingGroups.value.D.length
  }
])

const arithmeticGroupList = computed(() => [
  {
    name: 'Foundation',
    description: 'Number sense → Addition',
    count: arithmeticGroups.value.Foundation.length
  },
  {
    name: 'Practice',
    description: 'Addition → Subtraction',
    count: arithmeticGroups.value.Practice.length
  },
  {
    name: 'Secure',
    description: 'Subtraction → Division',
    count: arithmeticGroups.value.Secure.length
  }
])

function percentage(score, max) {
  const s = Number(score)
  const m = Number(max)

  if (!Number.isFinite(s) || !Number.isFinite(m) || m <= 0) {
    return 0
  }

  return Math.round((s / m) * 100)
}

async function loadData() {
  loading.value = true
  error.value = ''

  try {
    const [classData, analyticsData, studentData] =
      await Promise.all([
        get('/classes'),
        get('/analytics'),
        get('/students')
      ])

    classes.value = Array.isArray(classData)
      ? classData
      : []

    analytics.value = analyticsData || null

    students.value = Array.isArray(studentData)
      ? studentData
      : []
  } catch (e) {
    console.error(e)

    error.value =
      e.message ||
      'Could not load class information.'
  } finally {
    loading.value = false
  }
}

function selectClass(classItem) {
  selectedClass.value = classItem
}

function changeClass() {
  selectedClass.value = null
}

onMounted(loadData)
</script>

<template>
  <div class="page">

    <!-- LOADING -->

    <div
      v-if="loading"
      class="loading"
    >
      Loading classes...
    </div>

    <!-- ERROR -->

    <div
      v-else-if="error"
      class="error"
    >
      {{ error }}
    </div>

    <!-- ==============================
         STEP 1: SELECT CLASS
         ============================== -->

    <section
      v-else-if="!hasSelectedClass"
      class="class-selection"
    >

      <div class="top">

        <div>

          <div class="eyebrow">
            HEAD TEACHER · SCHOOL MONITOR
          </div>

          <div class="h1">
            Select a class
          </div>

          <p class="muted">
            Choose a class to view its learning overview.
          </p>

        </div>

      </div>

      <div class="selection-label">
        YOUR CLASSES
      </div>

      <div class="class-grid">

        <button
          v-for="classItem in classes"
          :key="classItem.id"
          class="class-card"
          @click="selectClass(classItem)"
        >

          <div class="class-icon">
            {{ classItem.grade || '3' }}
          </div>

          <div class="class-info">

            <h2>
              {{ classItem.name }}
            </h2>

            <p>
              Grade {{ classItem.grade || 3 }}
            </p>

            <span>
              View class overview →
            </span>

          </div>

        </button>

      </div>

      <div
        v-if="!classes.length"
        class="empty"
      >
        No classes are available.
      </div>

    </section>

    <!-- ==============================
         STEP 2: CLASS OVERVIEW
         ============================== -->

    <section
      v-else
      class="overview"
    >

      <!-- HEADER -->

      <div class="top">

        <div>

          <div class="eyebrow">
            HEAD TEACHER · CLASS OVERVIEW
          </div>

          <div class="title-row">

            <div>

              <div class="h1">
                {{ selectedClass.name }}
              </div>

              <p class="muted">
                Class-level learning overview and areas needing attention.
              </p>

            </div>

            <button
              class="change-class"
              @click="changeClass"
            >
              ← Change class
            </button>

          </div>

        </div>

      </div>

      <!-- CLASS SUMMARY -->

      <div class="section-label">
        CLASS SUMMARY
      </div>

      <div class="summary-grid">

        <div class="card summary-card">

          <span>
            TOTAL STUDENTS
          </span>

          <b>
            {{ totalStudents }}
          </b>

          <small>
            Learners in this class
          </small>

        </div>

        <div class="card summary-card">

          <span>
            READING AVERAGE
          </span>

          <b>
            {{ readingAverage }}%
          </b>

          <small>
            Average reading assessment
          </small>

        </div>

        <div class="card summary-card">

          <span>
            ARITHMETIC AVERAGE
          </span>

          <b>
            {{ arithmeticAverage }}%
          </b>

          <small>
            Average arithmetic assessment
          </small>

        </div>

        <div class="card summary-card">

          <span>
            ASSESSMENT COVERAGE
          </span>

          <b>
            {{ analytics?.operations?.assessmentCoverage || 0 }}%
          </b>

          <small>
            Students with assessment evidence
          </small>

        </div>

      </div>

      <!-- OPERATIONS -->

      <div class="summary-grid operations">

        <div class="card summary-card">

          <span>
            INTERVENTION COMPLETION
          </span>

          <b>
            {{ analytics?.operations?.interventionCompletion || 0 }}%
          </b>

          <small>
            Assigned interventions completed
          </small>

        </div>

        <div class="card summary-card">

          <span>
            REASSESSMENT RATE
          </span>

          <b>
            {{ analytics?.operations?.reassessmentRate || 0 }}%
          </b>

          <small>
            Learners reassessed after intervention
          </small>

        </div>

        <div class="card summary-card">

          <span>
            STD II-LEVEL READING
          </span>

          <b>
            {{ analytics?.learning?.std2ReadingPct || 0 }}%
          </b>

          <small>
            Learners reaching the reading benchmark
          </small>

        </div>

        <div class="card summary-card">

          <span>
            MOVING UP
          </span>

          <b>
            {{ analytics?.learning?.movingUpPct || 0 }}%
          </b>

          <small>
            Learners currently at Group A or B
          </small>

        </div>

      </div>

      <!-- LEARNING GROUPS -->

      <div class="section-label">
        CLASS LEARNING GROUPS
      </div>

      <div class="group-layout">

        <!-- READING -->

        <div class="card group-card">

          <div class="group-header">

            <div>

              <span class="subject">
                READING
              </span>

              <h2>
                Reading groups
              </h2>

              <p>
                Students are grouped by their current reading level.
              </p>

            </div>

            <div class="group-total">
              {{ students.length }}
              <small>
                students
              </small>
            </div>

          </div>

          <div class="group-list">

            <div
              v-for="group in readingGroupList"
              :key="group.name"
              class="learning-group"
            >

              <div class="group-main">

                <div class="group-name">
                  {{ group.name }}
                </div>

                <div class="group-description">
                  {{ group.description }}
                </div>

              </div>

              <div class="group-count">
                {{ group.count }}
              </div>

            </div>

          </div>

        </div>

        <!-- ARITHMETIC -->

        <div class="card group-card">

          <div class="group-header">

            <div>

              <span class="subject">
                ARITHMETIC
              </span>

              <h2>
                Arithmetic groups
              </h2>

              <p>
                Students are grouped by their current arithmetic level.
              </p>

            </div>

            <div class="group-total">
              {{ students.length }}
              <small>
                students
              </small>
            </div>

          </div>

          <div class="group-list">

            <div
              v-for="group in arithmeticGroupList"
              :key="group.name"
              class="learning-group"
            >

              <div class="group-main">

                <div class="group-name">
                  {{ group.name }}
                </div>

                <div class="group-description">
                  {{ group.description }}
                </div>

              </div>

              <div class="group-count">
                {{ group.count }}
              </div>

            </div>

          </div>

        </div>

      </div>

      <!-- PERSISTENT GAPS -->

      <div class="section-label">
        AREAS NEEDING ATTENTION
      </div>

      <div class="card persistent-card">

        <div class="persistent-header">

          <div>

            <span class="subject">
              PERSISTENT GAPS
            </span>

            <h2>
              Learning areas needing attention
            </h2>

            <p>
              These signals help the head teacher support classroom intervention.
            </p>

          </div>

        </div>

        <div
          v-if="
            analytics &&
            analytics.skills &&
            analytics.skills.length
          "
          class="persistent-list"
        >

          <div
            v-for="skill in analytics.skills"
            :key="skill.name"
            class="persistent-item"
          >

            <div class="persistent-title">
              <strong>
                {{ skill.name }}
              </strong>

              <span>
                {{ skill.gap }} students
              </span>
            </div>

            <div class="progress">
              <i
                :style="{
                  width:
                    Math.min(
                      100,
                      totalStudents
                        ? (skill.gap / totalStudents) * 100
                        : 0
                    ) + '%'
                }"
              ></i>
            </div>

            <small>
              {{ skill.gap }} learners currently show this gap signal.
            </small>

          </div>

        </div>

        <div
          v-else
          class="no-gaps"
        >
          No persistent gaps have been identified yet.
        </div>

      </div>

    </section>

  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.page {
  min-height: 100vh;
  padding: 38px 42px 55px;
  background: #f5f8f6;
  color: #12201b;
  font-family: Arial, Helvetica, sans-serif;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 34px;
}

.eyebrow,
.section-label,
.selection-label,
.subject {
  color: #648b30;
  font-size: 10px;
  letter-spacing: 1.8px;
  font-weight: 900;
}

.h1 {
  font-size: 38px;
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: -1.5px;
  margin-top: 10px;
}

.muted {
  color: #65766f;
  font-size: 14px;
  line-height: 1.5;
  margin-top: 9px;
}

.section-label,
.selection-label {
  margin-bottom: 13px;
}

.card {
  background: #fff;
  border: 1px solid #dce6e1;
  border-radius: 15px;
}

/* =========================
   CLASS SELECTION
   ========================= */

.class-selection {
  max-width: 1200px;
  margin: 0 auto;
}

.class-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(270px, 1fr)
  );
  gap: 18px;
}

.class-card {
  border: 1px solid #dce6e1;
  background: #fff;
  border-radius: 16px;
  padding: 22px;
  display: flex;
  align-items: center;
  gap: 18px;
  text-align: left;
  cursor: pointer;
  transition: .18s ease;
}

.class-card:hover {
  border-color: #9fc35d;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(16,71,56,.08);
}

.class-icon {
  width: 58px;
  height: 58px;
  flex: none;
  border-radius: 14px;
  background: #c7ff24;
  color: #104738;
  display: grid;
  place-items: center;
  font-size: 21px;
  font-weight: 900;
}

.class-info h2 {
  font-size: 19px;
  margin: 0;
}

.class-info p {
  margin: 5px 0;
  color: #687a72;
  font-size: 11px;
}

.class-info span {
  display: block;
  color: #4f7825;
  font-size: 10px;
  font-weight: 800;
  margin-top: 10px;
}

.empty {
  background: #fff;
  border: 1px solid #dce6e1;
  border-radius: 14px;
  padding: 30px;
  text-align: center;
  color: #687a72;
}

/* =========================
   OVERVIEW
   ========================= */

.overview {
  max-width: 1250px;
  margin: 0 auto;
}

.title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 25px;
}

.change-class {
  border: 1px solid #ccd9d2;
  background: #fff;
  border-radius: 9px;
  padding: 10px 15px;
  color: #174c3b;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.change-class:hover {
  background: #edf7df;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(
    4,
    minmax(0, 1fr)
  );
  gap: 16px;
  margin-bottom: 16px;
}

.operations {
  margin-bottom: 32px;
}

.summary-card {
  padding: 22px;
  min-height: 135px;
}

.summary-card span {
  display: block;
  color: #648b30;
  font-size: 9px;
  letter-spacing: 1.2px;
  font-weight: 900;
}

.summary-card b {
  display: block;
  font-size: 31px;
  margin-top: 13px;
  letter-spacing: -1px;
}

.summary-card small {
  display: block;
  color: #687a72;
  font-size: 10px;
  margin-top: 6px;
  line-height: 1.4;
}

/* =========================
   GROUPS
   ========================= */

.group-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 32px;
}

.group-card {
  padding: 24px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  padding-bottom: 18px;
  border-bottom: 1px solid #e5ebe7;
}

.group-header h2 {
  font-size: 21px;
  margin: 7px 0 5px;
}

.group-header p {
  color: #687a72;
  font-size: 11px;
  margin: 0;
  line-height: 1.45;
}

.group-total {
  font-size: 25px;
  font-weight: 800;
  text-align: right;
  white-space: nowrap;
}

.group-total small {
  display: block;
  color: #687a72;
  font-size: 9px;
  font-weight: 400;
  margin-top: 2px;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.learning-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  background: #f3f7f4;
  border: 1px solid #e2eae5;
  border-radius: 10px;
  padding: 12px 14px;
}

.group-name {
  font-size: 12px;
  font-weight: 800;
}

.group-description {
  color: #6c7c75;
  font-size: 9px;
  margin-top: 3px;
}

.group-count {
  min-width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e8f3d8;
  color: #4f7626;
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 12px;
}

/* =========================
   PERSISTENT GAPS
   ========================= */

.persistent-card {
  padding: 25px;
  margin-bottom: 20px;
}

.persistent-header {
  padding-bottom: 17px;
  border-bottom: 1px solid #e5ebe7;
}

.persistent-header h2 {
  font-size: 21px;
  margin: 7px 0 5px;
}

.persistent-header p {
  color: #687a72;
  font-size: 11px;
  margin: 0;
}

.persistent-list {
  display: grid;
  grid-template-columns: repeat(
    3,
    minmax(0, 1fr)
  );
  gap: 12px;
  margin-top: 17px;
}

.persistent-item {
  background: #f2f6f3;
  border: 1px solid #dce6e1;
  border-radius: 11px;
  padding: 15px;
}

.persistent-title {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.persistent-title strong {
  font-size: 11px;
  line-height: 1.35;
}

.persistent-title span {
  color: #557d2a;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
}

.progress {
  height: 7px;
  background: #e1e9e4;
  border-radius: 20px;
  overflow: hidden;
  margin-top: 13px;
}

.progress i {
  display: block;
  height: 100%;
  background: #63a987;
  border-radius: 20px;
}

.persistent-item small {
  display: block;
  color: #6b7b74;
  font-size: 9px;
  margin-top: 7px;
}

.no-gaps {
  padding: 24px 0 5px;
  color: #687a72;
  font-size: 11px;
}

.loading {
  min-height: 70vh;
  display: grid;
  place-items: center;
  color: #687a72;
  font-size: 13px;
}

.error {
  background: #fff0f0;
  border: 1px solid #e0b5b5;
  color: #963b3b;
  border-radius: 10px;
  padding: 14px;
}

/* =========================
   RESPONSIVE
   ========================= */

@media (max-width: 1050px) {

  .summary-grid {
    grid-template-columns: repeat(
      2,
      minmax(0, 1fr)
    );
  }

  .persistent-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 800px) {

  .page {
    padding: 28px 22px 45px;
  }

  .group-layout {
    grid-template-columns: 1fr;
  }

  .title-row {
    flex-direction: column;
  }

  .h1 {
    font-size: 31px;
  }
}

@media (max-width: 560px) {

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .class-grid {
    grid-template-columns: 1fr;
  }

  .page {
    padding: 22px 16px 40px;
  }

  .top {
    margin-bottom: 25px;
  }

  .h1 {
    font-size: 27px;
  }
}
</style>