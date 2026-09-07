<script setup>
import { ref, computed, onMounted } from 'vue'
import { get, post } from '../services/api.js'

const students = ref([])
const interventions = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')

const selectedStudentId = ref('')
const score = ref('')
const max = ref('10')

async function load() {
  loading.value = true
  error.value = ''

  try {
    const [studentData, interventionData] = await Promise.all([
      get('/students'),
      get('/interventions')
    ])

    students.value = Array.isArray(studentData) ? studentData : []
    interventions.value = Array.isArray(interventionData)
      ? interventionData
      : []
  } catch (e) {
    console.error(e)
    error.value = e.message || 'Could not load reassessment data.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

const selectedStudent = computed(() => {
  return students.value.find(
    student => student.id === selectedStudentId.value
  ) || null
})

const currentPercent = computed(() => {
  if (!selectedStudent.value) return null

  const s = selectedStudent.value

  if (
    s.readingScore === null ||
    s.readingScore === undefined ||
    !s.readingMax
  ) {
    return null
  }

  return Math.round(
    (Number(s.readingScore) / Number(s.readingMax)) * 100
  )
})

const newPercent = computed(() => {
  if (!score.value || !max.value || Number(max.value) <= 0) {
    return null
  }

  return Math.round(
    (Number(score.value) / Number(max.value)) * 100
  )
})

const newLevel = computed(() => {
  if (newPercent.value === null) return ''

  if (newPercent.value >= 80) return 'Std II text'
  if (newPercent.value >= 60) return 'Sentences'
  if (newPercent.value >= 35) return 'Words'

  return 'Earlier support'
})

function levelLabel(student) {
  if (!student) return 'Not assessed'

  if (student.readingBand === 'A') return 'Std II text'
  if (student.readingBand === 'B') return 'Sentences'
  if (student.readingBand === 'C') return 'Words'
  if (student.readingBand === 'D') return 'Earlier support'

  if (student.readingScore != null && student.readingMax) {
    const percentage =
      (Number(student.readingScore) / Number(student.readingMax)) * 100

    if (percentage >= 80) return 'Std II text'
    if (percentage >= 60) return 'Sentences'
    if (percentage >= 35) return 'Words'
  }

  return 'Not assessed'
}

async function submitReassessment() {
  error.value = ''
  success.value = ''

  if (!selectedStudentId.value) {
    error.value = 'Please select a student.'
    return
  }

  if (
    score.value === '' ||
    max.value === '' ||
    Number(max.value) <= 0
  ) {
    error.value = 'Please enter a valid score and maximum score.'
    return
  }

  if (Number(score.value) < 0 || Number(score.value) > Number(max.value)) {
    error.value = 'Score must be between 0 and the maximum score.'
    return
  }

  saving.value = true

  try {
    const result = await post('/reassess', {
      studentId: selectedStudentId.value,
      score: Number(score.value),
      max: Number(max.value)
    })

    success.value =
      `${result.student?.name || selectedStudent.value?.name} was reassessed successfully. ` +
      `New level: ${newLevel.value}.`

    await load()

    score.value = ''
    max.value = '10'
  } catch (e) {
    console.error(e)
    error.value = e.message || 'Could not complete reassessment.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page">

    <header class="top">
      <div>
        <div class="eyebrow">TEACHER · REASSESS</div>

        <h1>Check whether the support worked.</h1>

        <p class="muted">
          Reassess students after an intervention and use the new result
          to decide whether they should move to the next learning level.
        </p>
      </div>

      <div class="step-card">
        <span>LEARNING LOOP</span>
        <strong>Assess → Diagnose → Act → Reassess</strong>
      </div>
    </header>

    <div v-if="error" class="message error">
      {{ error }}
    </div>

    <div v-if="success" class="message success">
      {{ success }}
    </div>

    <div v-if="loading" class="card loading">
      Loading reassessment data...
    </div>

    <template v-else>

      <section class="grid">

        <div class="card">

          <div class="section-heading">
            <div>
              <div class="eyebrow">STEP 1</div>
              <h2>Select student</h2>
            </div>

            <span class="count">
              {{ students.length }} students
            </span>
          </div>

          <label>
            Student
          </label>

          <select v-model="selectedStudentId">
            <option value="">
              Select a student
            </option>

            <option
              v-for="student in students"
              :key="student.id"
              :value="student.id"
            >
              {{ student.name }}
            </option>
          </select>

          <div
            v-if="selectedStudent"
            class="student-summary"
          >
            <div class="avatar">
              {{ selectedStudent.name?.charAt(0)?.toUpperCase() }}
            </div>

            <div>
              <strong>{{ selectedStudent.name }}</strong>

              <span>
                Current level:
                <b>{{ levelLabel(selectedStudent) }}</b>
              </span>

              <span v-if="currentPercent !== null">
                Current score:
                <b>{{ currentPercent }}%</b>
              </span>
            </div>
          </div>

        </div>


        <div class="card">

          <div class="section-heading">
            <div>
              <div class="eyebrow">STEP 2</div>
              <h2>Enter reassessment</h2>
            </div>
          </div>

          <div class="score-grid">

            <div>
              <label>Score</label>

              <input
                v-model="score"
                type="number"
                min="0"
                :max="max"
                placeholder="e.g. 7"
              />
            </div>

            <div>
              <label>Maximum score</label>

              <input
                v-model="max"
                type="number"
                min="1"
                placeholder="10"
              />
            </div>

          </div>

          <div
            v-if="newPercent !== null"
            class="result-preview"
          >
            <span>New result</span>

            <strong>{{ newPercent }}%</strong>

            <small>
              {{ newLevel }}
            </small>
          </div>

          <button
            class="primary"
            :disabled="saving"
            @click="submitReassessment"
          >
            {{ saving ? 'Saving...' : 'Save Reassessment →' }}
          </button>

        </div>

      </section>


      <section class="card loop-card">

        <div class="section-heading">
          <div>
            <div class="eyebrow">WHAT HAPPENS NEXT</div>
            <h2>Turn the new result into the next action.</h2>
          </div>
        </div>

        <div class="loop">

          <div class="loop-item">
            <span class="number">1</span>
            <div>
              <strong>Reassess</strong>
              <p>
                Record the student's new performance.
              </p>
            </div>
          </div>

          <div class="arrow">→</div>

          <div class="loop-item">
            <span class="number">2</span>
            <div>
              <strong>Compare</strong>
              <p>
                See whether the student moved to a stronger level.
              </p>
            </div>
          </div>

          <div class="arrow">→</div>

          <div class="loop-item">
            <span class="number">3</span>
            <div>
              <strong>Regroup</strong>
              <p>
                Use the new level to decide the next support.
              </p>
            </div>
          </div>

        </div>

      </section>


      <section class="card students-card">

        <div class="section-heading">
          <div>
            <div class="eyebrow">CLASS 3</div>
            <h2>Student learning levels</h2>
          </div>
        </div>

        <div
          v-if="students.length"
          class="student-table"
        >

          <div class="table-row table-head">
            <span>Student</span>
            <span>Current level</span>
            <span>Reading score</span>
          </div>

          <div
            v-for="student in students"
            :key="student.id"
            class="table-row"
          >
            <span class="student-name">
              {{ student.name }}
            </span>

            <span>
              {{ levelLabel(student) }}
            </span>

            <span>
              {{
                student.readingScore != null
                  ? `${student.readingScore}/${student.readingMax}`
                  : 'Not assessed'
              }}
            </span>
          </div>

        </div>

        <div v-else class="empty">
          No students available.
        </div>

      </section>

    </template>

  </div>
</template>

<style scoped>
.page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 42px;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #173f35;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 30px;
  margin-bottom: 30px;
}

.eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: #6b8d82;
  margin-bottom: 9px;
}

h1 {
  margin: 0;
  font-size: 38px;
  line-height: 1.08;
  letter-spacing: -1px;
}

h2 {
  margin: 0;
  font-size: 21px;
  letter-spacing: -0.3px;
}

.muted {
  color: #71857f;
  max-width: 650px;
  line-height: 1.6;
  margin-top: 12px;
}

.step-card {
  min-width: 250px;
  background: #f3f7e9;
  border-left: 4px solid #b7df35;
  padding: 18px 20px;
}

.step-card span {
  display: block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.2px;
  color: #789084;
  margin-bottom: 8px;
}

.step-card strong {
  font-size: 14px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.card {
  background: white;
  border: 1px solid #dce5e0;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 5px 20px rgba(20, 60, 50, 0.04);
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 24px;
}

.count {
  background: #f0f5ef;
  border-radius: 20px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 700;
}

label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 8px;
  color: #47655d;
}

select,
input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #ccd9d4;
  border-radius: 10px;
  padding: 13px 14px;
  background: white;
  color: #173f35;
  font-size: 14px;
  outline: none;
}

select:focus,
input:focus {
  border-color: #91ba34;
}

.student-summary {
  display: flex;
  gap: 13px;
  align-items: center;
  margin-top: 20px;
  padding: 15px;
  background: #f6f8f2;
  border-radius: 12px;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: #d0f63a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: #173f35;
}

.student-summary strong {
  display: block;
  margin-bottom: 5px;
}

.student-summary span {
  display: block;
  font-size: 12px;
  color: #71857f;
  margin-top: 3px;
}

.score-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.result-preview {
  margin-top: 20px;
  padding: 18px;
  border-radius: 12px;
  background: #f3f7e9;
  display: flex;
  align-items: center;
  gap: 15px;
}

.result-preview span {
  font-size: 12px;
  color: #6c837b;
  font-weight: 700;
}

.result-preview strong {
  font-size: 26px;
}

.result-preview small {
  margin-left: auto;
  font-weight: 800;
}

.primary {
  width: 100%;
  margin-top: 18px;
  border: none;
  border-radius: 10px;
  padding: 14px 18px;
  background: #c9f52e;
  color: #102f28;
  font-weight: 900;
  cursor: pointer;
  font-size: 14px;
}

.primary:hover {
  background: #b9e522;
}

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loop-card {
  margin-bottom: 20px;
}

.loop {
  display: flex;
  align-items: center;
  gap: 18px;
}

.loop-item {
  flex: 1;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.number {
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e9f5d2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
}

.loop-item strong {
  display: block;
  margin-bottom: 5px;
}

.loop-item p {
  margin: 0;
  color: #71857f;
  font-size: 12px;
  line-height: 1.5;
}

.arrow {
  font-size: 22px;
  font-weight: 800;
  color: #91b32e;
}

.students-card {
  margin-bottom: 30px;
}

.student-table {
  border: 1px solid #e0e7e3;
  border-radius: 10px;
  overflow: hidden;
}

.table-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  gap: 15px;
  padding: 14px 16px;
  border-bottom: 1px solid #e8eeeb;
  font-size: 13px;
  align-items: center;
}

.table-row:last-child {
  border-bottom: none;
}

.table-head {
  background: #f4f7f3;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  font-weight: 800;
  color: #70867e;
}

.student-name {
  font-weight: 800;
}

.message {
  padding: 14px 17px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 13px;
  font-weight: 700;
}

.error {
  background: #fff0ed;
  color: #a53c2d;
  border: 1px solid #f0c9c1;
}

.success {
  background: #eff8df;
  color: #426e20;
  border: 1px solid #d5e9ae;
}

.loading,
.empty {
  color: #71857f;
  text-align: center;
  padding: 50px;
}

@media (max-width: 850px) {
  .page {
    padding: 25px;
  }

  .top {
    flex-direction: column;
  }

  .grid {
    grid-template-columns: 1fr;
  }

  .loop {
    flex-direction: column;
    align-items: stretch;
  }

  .arrow {
    display: none;
  }
}

@media (max-width: 600px) {
  h1 {
    font-size: 30px;
  }

  .score-grid {
    grid-template-columns: 1fr;
  }

  .table-row {
    grid-template-columns: 1fr;
    gap: 5px;
  }
}
</style>