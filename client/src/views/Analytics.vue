<script setup>
import { ref, computed, onMounted } from 'vue'
import { get } from '../services/api.js'

const loading = ref(true)
const error = ref('')
const students = ref([])
const analytics = ref(null)

/* =====================================================
   HELPERS
===================================================== */

function percent(score, max) {
  if (score === null || score === undefined || max === null || max === undefined || Number(max) === 0) {
    return null
  }

  return Math.round((Number(score) / Number(max)) * 100)
}

function readingGroup(student) {
  const p = percent(student.readingScore, student.readingMax)

  if (p === null) return 'Not assessed'
  if (p >= 80) return 'Group A'
  if (p >= 60) return 'Group B'
  if (p >= 35) return 'Group C'
  return 'Group D'
}

function arithmeticGroup(student) {
  const p = percent(student.arithmeticScore, student.arithmeticMax)

  if (p === null) return 'Not assessed'
  if (p >= 80) return 'Secure'
  if (p >= 50) return 'Practice'
  return 'Foundation'
}

/* =====================================================
   READING ANALYSIS
===================================================== */

const readingStudents = computed(() =>
  students.value.filter(
    student => percent(student.readingScore, student.readingMax) !== null
  )
)

const readingAverage = computed(() => {
  if (!readingStudents.value.length) return 0

  const total = readingStudents.value.reduce(
    (sum, student) =>
      sum + percent(student.readingScore, student.readingMax),
    0
  )

  return Math.round(total / readingStudents.value.length)
})

const readingA = computed(() =>
  readingStudents.value.filter(student => readingGroup(student) === 'Group A').length
)

const readingB = computed(() =>
  readingStudents.value.filter(student => readingGroup(student) === 'Group B').length
)

const readingC = computed(() =>
  readingStudents.value.filter(student => readingGroup(student) === 'Group C').length
)

const readingD = computed(() =>
  readingStudents.value.filter(student => readingGroup(student) === 'Group D').length
)

const readingSupport = computed(() =>
  readingStudents.value.filter(
    student => percent(student.readingScore, student.readingMax) < 60
  ).length
)

const readingAtStd2 = computed(() =>
  readingStudents.value.filter(
    student => percent(student.readingScore, student.readingMax) >= 80
  ).length
)

/* =====================================================
   ARITHMETIC ANALYSIS
===================================================== */

const arithmeticStudents = computed(() =>
  students.value.filter(
    student =>
      percent(student.arithmeticScore, student.arithmeticMax) !== null
  )
)

const arithmeticAverage = computed(() => {
  if (!arithmeticStudents.value.length) return 0

  const total = arithmeticStudents.value.reduce(
    (sum, student) =>
      sum + percent(student.arithmeticScore, student.arithmeticMax),
    0
  )

  return Math.round(total / arithmeticStudents.value.length)
})

const arithmeticFoundation = computed(() =>
  arithmeticStudents.value.filter(
    student => arithmeticGroup(student) === 'Foundation'
  ).length
)

const arithmeticPractice = computed(() =>
  arithmeticStudents.value.filter(
    student => arithmeticGroup(student) === 'Practice'
  ).length
)

const arithmeticSecure = computed(() =>
  arithmeticStudents.value.filter(
    student => arithmeticGroup(student) === 'Secure'
  ).length
)

const arithmeticSupport = computed(() =>
  arithmeticStudents.value.filter(
    student => percent(student.arithmeticScore, student.arithmeticMax) < 50
  ).length
)

/* =====================================================
   OVERALL
===================================================== */

const totalStudents = computed(() => students.value.length)

const assessedReading = computed(() => readingStudents.value.length)

const assessedArithmetic = computed(() => arithmeticStudents.value.length)

const overallNeedsSupport = computed(
  () => readingSupport.value + arithmeticSupport.value
)

/* =====================================================
   LOAD DATA
===================================================== */

async function loadAnalytics() {
  loading.value = true
  error.value = ''

  try {
    const [analyticsResponse, studentsResponse] = await Promise.all([
      get('/analytics'),
      get('/students')
    ])

    analytics.value = analyticsResponse
    students.value = Array.isArray(studentsResponse)
      ? studentsResponse
      : []
  } catch (err) {
    error.value =
      err?.message ||
      'Unable to load class analytics.'
  } finally {
    loading.value = false
  }
}

/* =====================================================
   NAVIGATION
===================================================== */

function goToDiagnose() {
  window.location.href = '/diagnose'
}

function goToAct() {
  window.location.href = '/act'
}

onMounted(() => {
  loadAnalytics()
})
</script>

<template>
  <div class="analytics-page">

    <!-- =================================================
         HEADER
    ================================================== -->

    <div class="page-header">
      <div>
        <div class="eyebrow">
          CLASS 3 · OVERALL ANALYSIS
        </div>

        <h1>
          Class learning overview
        </h1>

        <p class="subtitle">
          See how students are performing across Reading and Arithmetic.
        </p>
      </div>

      <div class="class-badge">
        <strong>
          CLASS 3
        </strong>

        <span>
          {{ totalStudents }} learners
        </span>
      </div>
    </div>

    <!-- =================================================
         LOADING
    ================================================== -->

    <div
      v-if="loading"
      class="state-card"
    >
      <strong>
        Loading class analysis...
      </strong>

      <p>
        Preparing the latest student performance data.
      </p>
    </div>

    <!-- =================================================
         ERROR
    ================================================== -->

    <div
      v-else-if="error"
      class="state-card error-card"
    >
      <strong>
        Could not load analytics
      </strong>

      <p>
        {{ error }}
      </p>

      <button
        class="primary-button"
        @click="loadAnalytics"
      >
        Try again
      </button>
    </div>

    <!-- =================================================
         CONTENT
    ================================================== -->

    <template v-else>

      <!-- =================================================
           OVERALL METRICS
      ================================================== -->

      <section class="metric-grid">

        <div class="metric-card">
          <span class="metric-label">
            STUDENTS
          </span>

          <strong class="metric-value">
            {{ totalStudents }}
          </strong>

          <span class="metric-description">
            Class 3 learners
          </span>
        </div>

        <div class="metric-card">
          <span class="metric-label">
            READING
          </span>

          <strong class="metric-value">
            {{ readingAverage }}%
          </strong>

          <span class="metric-description">
            Class reading average
          </span>
        </div>

        <div class="metric-card">
          <span class="metric-label">
            ARITHMETIC
          </span>

          <strong class="metric-value">
            {{ arithmeticAverage }}%
          </strong>

          <span class="metric-description">
            Class arithmetic average
          </span>
        </div>

        <div class="metric-card">
          <span class="metric-label">
            NEEDING SUPPORT
          </span>

          <strong class="metric-value">
            {{ overallNeedsSupport }}
          </strong>

          <span class="metric-description">
            Learners below the current support level
          </span>
        </div>

      </section>

      <!-- =================================================
           READING
      ================================================== -->

      <section class="analysis-card">

        <div class="analysis-header">

          <div>
            <div class="eyebrow">
              READING
            </div>

            <h2>
              Reading performance
            </h2>

            <p>
              {{ assessedReading }} of {{ totalStudents }}
              learners have a Reading assessment.
            </p>
          </div>

          <button
            class="secondary-button"
            @click="goToDiagnose"
          >
            View learning groups →
          </button>

        </div>

        <!-- Reading summary -->

        <div class="subject-summary">

          <div class="summary-box">
            <span>
              Average
            </span>

            <strong>
              {{ readingAverage }}%
            </strong>
          </div>

          <div class="summary-box">
            <span>
              At Std II text
            </span>

            <strong>
              {{ readingAtStd2 }}
            </strong>

            <small>
              learners
            </small>
          </div>

          <div class="summary-box">
            <span>
              Need support
            </span>

            <strong>
              {{ readingSupport }}
            </strong>

            <small>
              learners
            </small>
          </div>

        </div>

        <!-- Reading groups -->

        <div class="group-section">

          <div class="group-title">
            <strong>
              Reading learning groups
            </strong>

            <span>
              {{ assessedReading }} assessed
            </span>
          </div>

          <div class="group-grid">

            <div class="group-card">

              <div class="group-top">
                <span class="group-letter">
                  A
                </span>

                <strong>
                  Group A
                </strong>
              </div>

              <div class="group-count">
                {{ readingA }}
              </div>

              <span>
                80–100% · Std II text
              </span>

              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{
                    width:
                      assessedReading
                        ? `${(readingA / assessedReading) * 100}%`
                        : '0%'
                  }"
                ></div>
              </div>

            </div>

            <div class="group-card">

              <div class="group-top">
                <span class="group-letter">
                  B
                </span>

                <strong>
                  Group B
                </strong>
              </div>

              <div class="group-count">
                {{ readingB }}
              </div>

              <span>
                60–79% · Sentences → Std II text
              </span>

              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{
                    width:
                      assessedReading
                        ? `${(readingB / assessedReading) * 100}%`
                        : '0%'
                  }"
                ></div>
              </div>

            </div>

            <div class="group-card">

              <div class="group-top">
                <span class="group-letter">
                  C
                </span>

                <strong>
                  Group C
                </strong>
              </div>

              <div class="group-count">
                {{ readingC }}
              </div>

              <span>
                35–59% · Words → Sentences
              </span>

              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{
                    width:
                      assessedReading
                        ? `${(readingC / assessedReading) * 100}%`
                        : '0%'
                  }"
                ></div>
              </div>

            </div>

            <div class="group-card">

              <div class="group-top">
                <span class="group-letter">
                  D
                </span>

                <strong>
                  Group D
                </strong>
              </div>

              <div class="group-count">
                {{ readingD }}
              </div>

              <span>
                0–34% · Earlier support → Words
              </span>

              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{
                    width:
                      assessedReading
                        ? `${(readingD / assessedReading) * 100}%`
                        : '0%'
                  }"
                ></div>
              </div>

            </div>

          </div>

        </div>

        <!-- Reading student table -->

        <div class="student-analysis">

          <div class="table-title">
            <strong>
              Student Reading performance
            </strong>
          </div>

          <div class="student-table">

            <div class="table-row table-heading">
              <span>
                STUDENT
              </span>

              <span>
                MARK
              </span>

              <span>
                RESULT
              </span>

              <span>
                GROUP
              </span>
            </div>

            <div
              v-for="student in students"
              :key="`reading-${student.id}`"
              class="table-row"
            >

              <span class="student-name">
                <span class="avatar">
                  {{ student.name?.charAt(0) || '?' }}
                </span>

                {{ student.name }}
              </span>

              <span>
                {{
                  student.readingScore !== null &&
                  student.readingScore !== undefined
                    ? `${student.readingScore}/${student.readingMax}`
                    : '—'
                }}
              </span>

              <span>
                {{
                  percent(
                    student.readingScore,
                    student.readingMax
                  ) !== null
                    ? `${percent(
                        student.readingScore,
                        student.readingMax
                      )}%`
                    : 'Not assessed'
                }}
              </span>

              <span
                class="group-result"
              >
                {{ readingGroup(student) }}
              </span>

            </div>

          </div>

        </div>

      </section>

      <!-- =================================================
           ARITHMETIC
      ================================================== -->

      <section class="analysis-card">

        <div class="analysis-header">

          <div>
            <div class="eyebrow">
              ARITHMETIC
            </div>

            <h2>
              Arithmetic performance
            </h2>

            <p>
              {{ assessedArithmetic }} of {{ totalStudents }}
              learners have an Arithmetic assessment.
            </p>
          </div>

          <button
            class="secondary-button"
            @click="goToAct"
          >
            View today's action →
          </button>

        </div>

        <!-- Arithmetic summary -->

        <div class="subject-summary">

          <div class="summary-box">
            <span>
              Average
            </span>

            <strong>
              {{ arithmeticAverage }}%
            </strong>
          </div>

          <div class="summary-box">
            <span>
              Secure
            </span>

            <strong>
              {{ arithmeticSecure }}
            </strong>

            <small>
              learners
            </small>
          </div>

          <div class="summary-box">
            <span>
              Need support
            </span>

            <strong>
              {{ arithmeticSupport }}
            </strong>

            <small>
              learners
            </small>
          </div>

        </div>

        <!-- Arithmetic groups -->

        <div class="group-section">

          <div class="group-title">
            <strong>
              Arithmetic learning levels
            </strong>

            <span>
              {{ assessedArithmetic }} assessed
            </span>
          </div>

          <div class="group-grid arithmetic-grid">

            <div class="group-card">

              <div class="group-top">
                <span class="group-letter">
                  F
                </span>

                <strong>
                  Foundation
                </strong>
              </div>

              <div class="group-count">
                {{ arithmeticFoundation }}
              </div>

              <span>
                Below 50% · Number sense → Addition
              </span>

              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{
                    width:
                      assessedArithmetic
                        ? `${(arithmeticFoundation / assessedArithmetic) * 100}%`
                        : '0%'
                  }"
                ></div>
              </div>

            </div>

            <div class="group-card">

              <div class="group-top">
                <span class="group-letter">
                  P
                </span>

                <strong>
                  Practice
                </strong>
              </div>

              <div class="group-count">
                {{ arithmeticPractice }}
              </div>

              <span>
                50–79% · Addition → Subtraction
              </span>

              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{
                    width:
                      assessedArithmetic
                        ? `${(arithmeticPractice / assessedArithmetic) * 100}%`
                        : '0%'
                  }"
                ></div>
              </div>

            </div>

            <div class="group-card">

              <div class="group-top">
                <span class="group-letter">
                  S
                </span>

                <strong>
                  Secure
                </strong>
              </div>

              <div class="group-count">
                {{ arithmeticSecure }}
              </div>

              <span>
                80–100% · Subtraction → Division
              </span>

              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{
                    width:
                      assessedArithmetic
                        ? `${(arithmeticSecure / assessedArithmetic) * 100}%`
                        : '0%'
                  }"
                ></div>
              </div>

            </div>

          </div>

        </div>

        <!-- Arithmetic student table -->

        <div class="student-analysis">

          <div class="table-title">
            <strong>
              Student Arithmetic performance
            </strong>
          </div>

          <div class="student-table">

            <div class="table-row table-heading">
              <span>
                STUDENT
              </span>

              <span>
                MARK
              </span>

              <span>
                RESULT
              </span>

              <span>
                LEVEL
              </span>
            </div>

            <div
              v-for="student in students"
              :key="`math-${student.id}`"
              class="table-row"
            >

              <span class="student-name">
                <span class="avatar">
                  {{ student.name?.charAt(0) || '?' }}
                </span>

                {{ student.name }}
              </span>

              <span>
                {{
                  student.arithmeticScore !== null &&
                  student.arithmeticScore !== undefined
                    ? `${student.arithmeticScore}/${student.arithmeticMax}`
                    : '—'
                }}
              </span>

              <span>
                {{
                  percent(
                    student.arithmeticScore,
                    student.arithmeticMax
                  ) !== null
                    ? `${percent(
                        student.arithmeticScore,
                        student.arithmeticMax
                      )}%`
                    : 'Not assessed'
                }}
              </span>

              <span class="group-result">
                {{ arithmeticGroup(student) }}
              </span>

            </div>

          </div>

        </div>

      </section>

      <!-- =================================================
           CLASS TAKEAWAY
      ================================================== -->

      <section class="takeaway-card">

        <div>
          <div class="eyebrow">
            CLASS TAKEAWAY
          </div>

          <h2>
            What the class data shows
          </h2>

          <p>
            Reading is currently at an average of
            <strong>{{ readingAverage }}%</strong>,
            while Arithmetic is at
            <strong>{{ arithmeticAverage }}%</strong>.
            The learning groups show where support should be
            focused and which learners are ready to move ahead.
          </p>
        </div>

        <div class="takeaway-actions">

          <button
            class="primary-button"
            @click="goToDiagnose"
          >
            Open learning groups →
          </button>

          

        </div>

      </section>

    </template>

  </div>
</template>

<style scoped>

.analytics-page {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding-bottom: 60px;
}

/* =====================================================
   HEADER
===================================================== */

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 26px;
}

.page-header h1 {
  margin: 6px 0 8px;
  font-size: 36px;
  line-height: 1.1;
  color: #071b17;
}

.eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.7px;
  color: #62816f;
}

.subtitle {
  margin: 0;
  color: #657b78;
  font-size: 16px;
}

.class-badge {
  min-width: 120px;
  padding: 14px 18px;
  border-radius: 12px;
  background: #eef4ee;
  text-align: center;
}

.class-badge strong {
  display: block;
  font-size: 13px;
  color: #17372e;
}

.class-badge span {
  display: block;
  margin-top: 4px;
  color: #6b817b;
  font-size: 11px;
}

/* =====================================================
   METRICS
===================================================== */

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 18px;
}

.metric-card {
  background: #ffffff;
  border: 1px solid #dce5df;
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 5px 18px rgba(20, 54, 44, 0.04);
}

.metric-label {
  display: block;
  color: #678079;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.4px;
}

.metric-value {
  display: block;
  margin-top: 9px;
  font-size: 32px;
  line-height: 1;
  color: #071b17;
}

.metric-description {
  display: block;
  margin-top: 8px;
  color: #71837f;
  font-size: 13px;
}

/* =====================================================
   ANALYSIS CARD
===================================================== */

.analysis-card {
  background: #ffffff;
  border: 1px solid #dce5df;
  border-radius: 18px;
  padding: 22px;
  margin-top: 18px;
  box-shadow: 0 5px 18px rgba(20, 54, 44, 0.04);
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e8eeea;
}

.analysis-header h2 {
  margin: 6px 0 6px;
  font-size: 25px;
  color: #071b17;
}

.analysis-header p {
  margin: 0;
  color: #71837f;
  font-size: 14px;
}

/* =====================================================
   BUTTONS
===================================================== */

.primary-button,
.secondary-button {
  border: none;
  border-radius: 10px;
  padding: 12px 17px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.15s ease;
  white-space: nowrap;
}

.primary-button {
  background: #c8ff25;
  color: #12251f;
}

.primary-button:hover {
  transform: translateY(-1px);
}

.secondary-button {
  background: #edf2ef;
  color: #18382f;
}

.secondary-button:hover {
  background: #e2ebe5;
}

/* =====================================================
   SUBJECT SUMMARY
===================================================== */

.subject-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin: 20px 0;
}

.summary-box {
  background: #f5f8f5;
  border: 1px solid #e3ebe5;
  border-radius: 13px;
  padding: 17px;
}

.summary-box span {
  display: block;
  color: #6b817a;
  font-size: 11px;
  font-weight: 700;
}

.summary-box strong {
  display: inline-block;
  margin-top: 6px;
  font-size: 27px;
  color: #0a211b;
}

.summary-box small {
  margin-left: 5px;
  color: #71827d;
}

/* =====================================================
   GROUPS
===================================================== */

.group-section {
  margin-top: 20px;
}

.group-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.group-title strong {
  font-size: 15px;
  color: #17372e;
}

.group-title span {
  font-size: 12px;
  color: #71827d;
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.arithmetic-grid {
  grid-template-columns: repeat(3, 1fr);
}

.group-card {
  border: 1px solid #dce5df;
  border-radius: 13px;
  padding: 15px;
  background: #ffffff;
}

.group-top {
  display: flex;
  align-items: center;
  gap: 9px;
}

.group-top strong {
  color: #17372e;
  font-size: 14px;
}

.group-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: #e9f6d9;
  color: #3f6825;
  font-size: 12px;
  font-weight: 900;
}

.group-count {
  margin-top: 14px;
  font-size: 27px;
  font-weight: 800;
  color: #071b17;
}

.group-card > span:not(.group-letter) {
  display: block;
  min-height: 30px;
  margin-top: 4px;
  color: #6e827c;
  font-size: 11px;
  line-height: 1.4;
}

.progress-track {
  height: 7px;
  margin-top: 13px;
  background: #e9efeb;
  border-radius: 20px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #9bd86d;
  border-radius: 20px;
}

/* =====================================================
   STUDENT TABLE
===================================================== */

.student-analysis {
  margin-top: 25px;
}

.table-title {
  margin-bottom: 10px;
  font-size: 15px;
  color: #17372e;
}

.student-table {
  border: 1px solid #dce5df;
  border-radius: 12px;
  overflow: hidden;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.2fr;
  align-items: center;
  min-height: 52px;
  padding: 0 14px;
  border-top: 1px solid #edf1ef;
  font-size: 12px;
  color: #536b64;
}

.table-row:first-child {
  border-top: none;
}

.table-heading {
  min-height: 38px;
  background: #f3f7f4;
  color: #72847e;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
}

.student-name {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #17372e;
  font-weight: 700;
}

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #edf6df;
  color: #48742c;
  font-size: 11px;
  font-weight: 800;
}

.group-result {
  color: #48732f;
  font-weight: 800;
}

/* =====================================================
   TAKEAWAY
===================================================== */

.takeaway-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 25px;
  margin-top: 18px;
  padding: 24px;
  background: #f1f6f1;
  border: 1px solid #dce8df;
  border-radius: 18px;
}

.takeaway-card h2 {
  margin: 6px 0 8px;
  color: #071b17;
  font-size: 23px;
}

.takeaway-card p {
  max-width: 720px;
  margin: 0;
  color: #657a73;
  font-size: 14px;
  line-height: 1.6;
}

.takeaway-actions {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

/* =====================================================
   STATE
===================================================== */

.state-card {
  padding: 35px;
  background: #ffffff;
  border: 1px solid #dce5df;
  border-radius: 16px;
  text-align: center;
}

.state-card strong {
  color: #17372e;
  font-size: 17px;
}

.state-card p {
  color: #71827d;
  font-size: 13px;
}

.error-card {
  border-color: #efcaca;
}

/* =====================================================
   RESPONSIVE
===================================================== */

@media (max-width: 1000px) {
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .group-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .arithmetic-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 720px) {
  .analytics-page {
    padding: 10px 0 40px;
  }

  .page-header,
  .analysis-header,
  .takeaway-card {
    flex-direction: column;
  }

  .metric-grid,
  .subject-summary,
  .group-grid,
  .arithmetic-grid {
    grid-template-columns: 1fr;
  }

  .student-table {
    overflow-x: auto;
  }

  .table-row {
    min-width: 650px;
  }

  .takeaway-actions {
    width: 100%;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
  }
}

</style>