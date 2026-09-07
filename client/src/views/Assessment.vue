<script setup>
import { ref, computed, onMounted } from 'vue'
import { get, post } from '../services/api.js'

const students = ref([])
const selected = ref('')
const subject = ref('reading')
const score = ref('')
const max = ref(13)
const saving = ref(false)
const result = ref(null)
const error = ref('')
const evidenceSubject = ref('reading')

async function load() {
  try {
    students.value = await get('/students')
    if (students.value.length && !selected.value) {
      selected.value = students.value[0].id
    }
  } catch (e) {
    error.value = e.message || 'Could not load students.'
  }
}

onMounted(load)

const current = computed(() =>
  students.value.find(s => s.id === selected.value)
)

const pct = computed(() => {
  if (score.value === '' || Number(max.value) <= 0) return 0
  return Math.round((Number(score.value) / Number(max.value)) * 100)
})

const readingBand = computed(() => {
  if (pct.value >= 80) return 'A'
  if (pct.value >= 60) return 'B'
  if (pct.value >= 35) return 'C'
  return 'D'
})

const arithmeticLevel = computed(() => {
  if (pct.value >= 80) return 'Secure'
  if (pct.value >= 50) return 'Practice'
  return 'Foundation'
})

const evidenceTitle = computed(() =>
  evidenceSubject.value === 'reading'
    ? 'Reading evidence'
    : 'Arithmetic evidence'
)

function selectSubject(value) {
  subject.value = value
  score.value = ''
  max.value = value === 'reading' ? 13 : 12
  result.value = null
  error.value = ''
}

function evidenceMark(student) {
  if (evidenceSubject.value === 'reading') {
    if (student.readingScore == null) return 'Not assessed'
    return `${student.readingScore}/${student.readingMax}`
  }

  if (student.arithmeticScore == null) return 'Not assessed'
  return `${student.arithmeticScore}/${student.arithmeticMax}`
}

function evidencePercent(student) {
  if (evidenceSubject.value === 'reading') {
    if (student.readingScore == null) return null
    return Math.round((student.readingScore / student.readingMax) * 100)
  }

  if (student.arithmeticScore == null) return null
  return Math.round((student.arithmeticScore / student.arithmeticMax) * 100)
}

function evidenceLevel(student) {
  const value = evidencePercent(student)

  if (value === null) return 'Not assessed'

  if (evidenceSubject.value === 'reading') {
    if (value >= 80) return 'Group A'
    if (value >= 60) return 'Group B'
    if (value >= 35) return 'Group C'
    return 'Group D'
  }

  if (value >= 80) return 'Secure'
  if (value >= 50) return 'Practice'
  return 'Foundation'
}

async function save() {
  if (!selected.value || score.value === '') return

  saving.value = true
  error.value = ''
  result.value = null

  try {
    result.value = await post('/assessments', {
      studentId: selected.value,
      subject: subject.value,
      score: Number(score.value),
      max: Number(max.value),
      type: 'baseline'
    })

    await load()
    score.value = ''
    evidenceSubject.value = subject.value
  } catch (e) {
    error.value = e.message || 'Could not save assessment.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page">
    <header class="top">
      <div>
        <div class="eyebrow">STEP 1 · ASSESS</div>
        <h1>Record assessment marks</h1>
      </div>
    </header>

    <div v-if="error" class="card error-card">
      {{ error }}
    </div>

    <section class="card form-card">
      <div class="eyebrow">CLASS 3 · MANUAL ENTRY</div>
      <h2>Student assessment</h2>

      <label>Student</label>
      <select v-model="selected">
        <option
          v-for="student in students"
          :key="student.id"
          :value="student.id"
        >
          {{ student.name }} · {{ student.email }}
        </option>
      </select>

      <label>Subject</label>
      <div class="subject-buttons">
        <button
          type="button"
          :class="{ active: subject === 'reading' }"
          @click="selectSubject('reading')"
        >
          📖 Reading
        </button>

        <button
          type="button"
          :class="{ active: subject === 'arithmetic' }"
          @click="selectSubject('arithmetic')"
        >
          🔢 Arithmetic
        </button>
      </div>


      <label>Score</label>
      <input
        v-model="score"
        type="number"
        min="0"
        :max="max"
        placeholder="e.g. 8"
      />

      <label>Maximum mark</label>
      <input
        v-model="max"
        type="number"
        min="1"
      />

      <div class="preview">
        <strong>{{ pct }}%</strong>
        <span>
          <template v-if="subject === 'reading'">
            Reading · Group {{ readingBand }}
          </template>
          <template v-else>
            Arithmetic · {{ arithmeticLevel }}
          </template>
        </span>
      </div>

      <button
        class="btn lime save-button"
        :disabled="saving || !selected || score === ''"
        @click="save"
      >
        {{ saving ? 'Saving…' : 'Save assessment →' }}
      </button>

      <div v-if="result" class="saved">
        ✓ Saved {{ subject === 'reading' ? 'reading' : 'arithmetic' }} marks for
        <strong>{{ result.student.name }}</strong>.
        <span>{{ result.group }}</span>
      </div>
    </section>

    <section class="card table-card">
      <div class="evidence-head">
        <div>
          <div class="eyebrow">CLASS 3 · ASSESSMENT RECORD</div>
          <h2>{{ evidenceTitle }}</h2>
        </div>

        <div class="evidence-switch">
          <button
            type="button"
            :class="{ active: evidenceSubject === 'reading' }"
            @click="evidenceSubject = 'reading'"
          >
            Reading
          </button>

          <button
            type="button"
            :class="{ active: evidenceSubject === 'arithmetic' }"
            @click="evidenceSubject = 'arithmetic'"
          >
            Arithmetic
          </button>
        </div>
      </div>

      <div class="table-header">
        <span>Student</span>
        <span>Mark</span>
        <span>Score</span>
        <span>Learning level</span>
      </div>

      <div
        v-for="student in students"
        :key="student.id"
        class="evidence-row"
      >
        <strong>{{ student.name }}</strong>

        <span>
          {{ evidenceMark(student) }}
        </span>

        <span>
          <template v-if="evidencePercent(student) !== null">
            {{ evidencePercent(student) }}%
          </template>
          <template v-else>—</template>
        </span>

        <span
          class="level"
          :class="{
            unassessed: evidencePercent(student) === null
          }"
        >
          {{ evidenceLevel(student) }}
        </span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.top {
  margin-bottom: 18px;
}

.form-card {
  width: 100%;
}

label {
  display: block;
  margin: 14px 0 6px;
  font-size: 12px;
  font-weight: 800;
}

select,
input {
  width: 100%;
  padding: 12px;
  border: 1px solid #dbe4dc;
  border-radius: 10px;
  background: #fff;
  outline: none;
}

select:focus,
input:focus {
  border-color: #9abd70;
}

.subject-buttons,
.evidence-switch {
  display: flex;
  gap: 8px;
}

.subject-buttons button,
.evidence-switch button {
  flex: 1;
  padding: 12px;
  border: 1px solid #dbe4dc;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  font-weight: 700;
}

.subject-buttons button.active,
.evidence-switch button.active {
  background: #e8f8d3;
  border-color: #a3d977;
  color: #26332d;
}

.subject-note {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 9px;
  background: #f7faf5;
  color: #64748b;
  font-size: 11px;
}

.subject-note strong {
  color: #35551d;
}

.preview {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 20px 0;
}

.preview strong {
  font-size: 34px;
}

.preview span {
  color: #64748b;
}

.save-button {
  min-width: 190px;
}

.saved {
  margin-top: 14px;
  padding: 12px;
  background: #effbea;
  border-radius: 9px;
  color: #35551d;
  font-size: 12px;
}

.saved span {
  margin-left: 5px;
  font-weight: 800;
}

.table-card {
  margin-top: 18px;
}

.evidence-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.evidence-head h2 {
  margin: 6px 0;
}

.evidence-switch {
  min-width: 250px;
}

.table-header,
.evidence-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr .8fr 1.2fr;
  gap: 12px;
  align-items: center;
}

.table-header {
  padding: 10px 12px;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .6px;
}

.evidence-row {
  padding: 13px 12px;
  border-top: 1px solid #eef2f0;
  font-size: 12px;
}

.evidence-row span {
  color: #64748b;
}

.level {
  font-weight: 800;
  color: #35551d !important;
}

.level.unassessed {
  color: #94a3b8 !important;
  font-weight: 500;
}

.error-card {
  border: 1px solid #fecaca;
  color: #9d402c;
  margin-bottom: 14px;
}

@media (max-width: 700px) {
  .evidence-head {
    flex-direction: column;
  }

  .evidence-switch {
    width: 100%;
    min-width: 0;
  }

  .table-header,
  .evidence-row {
    grid-template-columns: 1.2fr 1fr .8fr 1fr;
  }
}
</style>
