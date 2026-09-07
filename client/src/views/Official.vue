<script setup>
import { ref, computed, onMounted } from 'vue'

const loading = ref(true)
const error = ref('')

const districtData = ref(null)
const analytics = ref(null)

const selectedDistrict = ref('Mysore')

const districts = [
  {
    value: 'Mysore',
    label: 'Mysore'
  }
]

const selectedDistrictData = computed(() => {
  const list = districtData.value?.districts || []

  return (
    list.find(d => {
      const name = String(d.name || '').toLowerCase()

      return (
        name === 'mysore' ||
        name === 'mysuru'
      )
    }) || {
      name: 'Mysore',
      schools: 0,
      students: 0,
      prioritySkills: []
    }
  )
})

const trend = computed(() => {
  return districtData.value?.trend || []
})

const prioritySchools = computed(() => {
  return districtData.value?.prioritySchools || []
})

const prioritySkills = computed(() => {
  return selectedDistrictData.value?.prioritySkills || []
})

const latestTrend = computed(() => {
  if (!trend.value.length) return null

  return trend.value[trend.value.length - 1]
})

const previousTrend = computed(() => {
  if (trend.value.length < 2) return null

  return trend.value[trend.value.length - 2]
})

const readingChange = computed(() => {
  if (
    !latestTrend.value ||
    !previousTrend.value
  ) {
    return 0
  }

  return Number(
    (
      latestTrend.value.reading -
      previousTrend.value.reading
    ).toFixed(1)
  )
})

const subtractionChange = computed(() => {
  if (
    !latestTrend.value ||
    !previousTrend.value
  ) {
    return 0
  }

  return Number(
    (
      latestTrend.value.subtraction -
      previousTrend.value.subtraction
    ).toFixed(1)
  )
})

const std2Reading = computed(() => {
  return (
    analytics.value?.learning?.std2ReadingPct ??
    0
  )
})

const subtraction = computed(() => {
  return (
    analytics.value?.learning
      ?.subtractionOrAbovePct ??
    0
  )
})

const movingUp = computed(() => {
  return (
    analytics.value?.learning?.movingUpPct ??
    0
  )
})

const assessmentCoverage = computed(() => {
  return (
    analytics.value?.operations
      ?.assessmentCoverage ??
    0
  )
})

const interventionCompletion = computed(() => {
  return (
    analytics.value?.operations
      ?.interventionCompletion ??
    0
  )
})

const reassessmentRate = computed(() => {
  return (
    analytics.value?.operations
      ?.reassessmentRate ??
    0
  )
})

function formatChange(value) {
  if (value > 0) {
    return `+${value} pts`
  }

  if (value < 0) {
    return `${value} pts`
  }

  return 'No change'
}

async function loadDashboard() {
  loading.value = true
  error.value = ''

  try {
    const [
      officialResponse,
      analyticsResponse
    ] = await Promise.all([
      fetch('/api/official'),
      fetch('/api/analytics')
    ])

    if (!officialResponse.ok) {
      throw new Error(
        'Unable to load district data.'
      )
    }

    districtData.value =
      await officialResponse.json()

    if (analyticsResponse.ok) {
      analytics.value =
        await analyticsResponse.json()
    }
  } catch (err) {
    console.error(err)

    error.value =
      err.message ||
      'Unable to load the official dashboard.'
  } finally {
    loading.value = false
  }
}

function exportPowerBI() {
  window.location.href = '/api/export'
}

onMounted(loadDashboard)
</script>

<template>

  <div class="official-page">

    <!-- LOADING -->

    <div
      v-if="loading"
      class="loading"
    >
      Loading Mysore district dashboard...
    </div>

    <!-- ERROR -->

    <div
      v-else-if="error"
      class="error"
    >
      {{ error }}
    </div>

    <!-- DASHBOARD -->

    <main
      v-else
      class="dashboard"
    >

      <!-- =================================
           HEADER
           ================================= -->

      <header class="header">

        <div>

          <div class="eyebrow">
            EDUCATION OFFICIAL · DISTRICT DASHBOARD
          </div>

          <h1>
            District Priorities
          </h1>

          <p>
            Aggregated learning signals for programme decisions.
          </p>

        </div>

        <div class="header-right">

          <div class="district-control">

            <label>
              SELECT DISTRICT
            </label>

            <select
              v-model="selectedDistrict"
            >

              <option
                v-for="district in districts"
                :key="district.value"
                :value="district.value"
              >
                {{ district.label }}
              </option>

            </select>

          </div>

          <button
            class="export-button"
            @click="exportPowerBI"
          >
            Export Power BI CSV
          </button>

        </div>

      </header>


      <!-- =================================
           DISTRICT TITLE
           ================================= -->

      <div class="district-title">

        <div>

          <span>
            SELECTED DISTRICT
          </span>

          <strong>
            {{ selectedDistrictData.name }}
          </strong>

        </div>

        <div class="district-meta">

          <span>
            {{ selectedDistrictData.schools }}
            Schools
          </span>

          <span>
            {{ selectedDistrictData.students }}
            Learners
          </span>

        </div>

      </div>


      <!-- =================================
           KPI ROW
           ================================= -->

      <section>

        <div class="section-label">
          DISTRICT SNAPSHOT
        </div>

        <div class="kpi-grid">

          <article class="kpi">

            <span>
              SCHOOLS
            </span>

            <strong>
              {{ selectedDistrictData.schools }}
            </strong>

            <small>
              Schools represented
            </small>

          </article>


          <article class="kpi">

            <span>
              LEARNERS
            </span>

            <strong>
              {{ selectedDistrictData.students }}
            </strong>

            <small>
              Learners represented
            </small>

          </article>


          <article class="kpi">

            <span>
              STD II-LEVEL READING
            </span>

            <strong>
              {{ std2Reading }}%
            </strong>

            <small>
              Latest learning signal
            </small>

          </article>


          <article class="kpi">

            <span>
              SUBTRACTION
            </span>

            <strong>
              {{ subtraction }}%
            </strong>

            <small>
              Learners at or above subtraction
            </small>

          </article>


          <article class="kpi">

            <span>
              ASSESSMENT COVERAGE
            </span>

            <strong>
              {{ assessmentCoverage }}%
            </strong>

            <small>
              Assessment evidence available
            </small>

          </article>


          <article class="kpi">

            <span>
              REASSESSMENT RATE
            </span>

            <strong>
              {{ reassessmentRate }}%
            </strong>

            <small>
              Learners reassessed
            </small>

          </article>

        </div>

      </section>


      <!-- =================================
           TREND + CURRENT SIGNAL
           ================================= -->

      <section class="two-column">


        <!-- ASER TREND -->

        <article class="panel">

          <div class="eyebrow">
            ASER-ALIGNED TREND SIGNALS
          </div>

          <h2>
            Foundational learning trend
          </h2>

          <p class="description">
            Reading and arithmetic signals across the available trend years.
          </p>


          <div
            v-if="trend.length"
            class="chart"
          >

            <div
              v-for="item in trend"
              :key="item.year"
              class="year-column"
            >

              <div class="bars">

                <div class="bar-box">

                  <div
                    class="bar reading"
                    :style="{
                      height:
                        Math.max(
                          30,
                          item.reading * 4
                        ) + 'px'
                    }"
                  ></div>

                  <span>
                    {{ item.reading }}%
                  </span>

                </div>


                <div class="bar-box">

                  <div
                    class="bar arithmetic"
                    :style="{
                      height:
                        Math.max(
                          30,
                          item.subtraction * 4
                        ) + 'px'
                    }"
                  ></div>

                  <span>
                    {{ item.subtraction }}%
                  </span>

                </div>

              </div>

              <strong>
                {{ item.year }}
              </strong>

            </div>

          </div>


          <div class="legend">

            <span>
              <i class="reading-dot"></i>
              Reading
            </span>

            <span>
              <i class="arithmetic-dot"></i>
              Subtraction
            </span>

          </div>


          <div class="trend-summary">

            <div>

              <span>
                READING
              </span>

              <strong>
                {{ formatChange(readingChange) }}
              </strong>

              <small>
                {{ previousTrend?.year }}
                →
                {{ latestTrend?.year }}
              </small>

            </div>


            <div>

              <span>
                SUBTRACTION
              </span>

              <strong>
                {{ formatChange(subtractionChange) }}
              </strong>

              <small>
                {{ previousTrend?.year }}
                →
                {{ latestTrend?.year }}
              </small>

            </div>

          </div>

        </article>


        <!-- DISTRICT SIGNAL -->

        <article class="panel">

          <div class="eyebrow">
            CURRENT DISTRICT SIGNAL
          </div>

          <h2>
            Priority signals
          </h2>

          <p class="description">
            The most important signals for district-level programme decisions.
          </p>


          <div class="signal-list">


            <div class="signal">

              <div class="signal-icon">
                R
              </div>

              <div>

                <strong>
                  Reading progression
                </strong>

                <p>
                  {{ std2Reading }}% of learners are at the Std II-level reading benchmark.
                </p>

              </div>

            </div>


            <div class="signal">

              <div class="signal-icon">
                A
              </div>

              <div>

                <strong>
                  Arithmetic foundation
                </strong>

                <p>
                  {{ subtraction }}% of learners are at or above the subtraction level.
                </p>

              </div>

            </div>


            <div class="signal">

              <div class="signal-icon">
                ↗
              </div>

              <div>

                <strong>
                  Learning movement
                </strong>

                <p>
                  {{ movingUp }}% of tracked learners are currently in the higher learning bands.
                </p>

              </div>

            </div>


          </div>

        </article>

      </section>


      <!-- =================================
           PRIORITY SKILLS + SCHOOLS
           ================================= -->

      <section class="two-column">


        <!-- PRIORITY SKILLS -->

        <article class="panel">

          <div class="eyebrow">
            PRIORITY SKILLS
          </div>

          <h2>
            Mysore learning priorities
          </h2>

          <p class="description">
            Skills surfaced from aggregated district signals.
          </p>


          <div
            v-if="prioritySkills.length"
            class="priority-list"
          >

            <div
              v-for="(
                skill,
                index
              ) in prioritySkills"
              :key="index"
              class="priority-row"
            >

              <div class="number">
                {{ index + 1 }}
              </div>

              <div>

                <strong>
                  {{ skill }}
                </strong>

                <small>
                  Priority learning area
                </small>

              </div>

            </div>

          </div>


          <div
            v-else
            class="empty"
          >
            No priority skills reported.
          </div>

        </article>


        <!-- PRIORITY SCHOOLS -->

        <article class="panel">

          <div class="eyebrow">
            PRIORITY SCHOOLS
          </div>

          <h2>
            Schools needing attention
          </h2>

          <p class="description">
            Schools surfaced for closer programme support.
          </p>


          <div
            v-if="prioritySchools.length"
            class="school-list"
          >

            <div
              v-for="(
                school,
                index
              ) in prioritySchools"
              :key="index"
              class="school-row"
            >

              <div class="number">
                {{ index + 1 }}
              </div>

              <div class="school-info">

                <strong>
                  {{ school }}
                </strong>

                <small>
                  Priority school for programme attention
                </small>

              </div>

              <span class="priority">
                PRIORITY
              </span>

            </div>

          </div>


          <div
            v-else
            class="empty"
          >
            No priority schools reported.
          </div>

        </article>

      </section>


      <!-- =================================
           PROGRAMME IMPLEMENTATION
           ================================= -->

      <section>

        <div class="section-label">
          PROGRAMME IMPLEMENTATION
        </div>


        <div class="implementation-grid">


          <article class="implementation">

            <div class="implementation-header">

              <span>
                ASSESSMENT COVERAGE
              </span>

              <strong>
                {{ assessmentCoverage }}%
              </strong>

            </div>

            <div class="progress">

              <i
                :style="{
                  width:
                    assessmentCoverage + '%'
                }"
              ></i>

            </div>

            <small>
              Learners with assessment evidence
            </small>

          </article>


          <article class="implementation">

            <div class="implementation-header">

              <span>
                INTERVENTION COMPLETION
              </span>

              <strong>
                {{ interventionCompletion }}%
              </strong>

            </div>

            <div class="progress">

              <i
                :style="{
                  width:
                    interventionCompletion + '%'
                }"
              ></i>

            </div>

            <small>
              Planned interventions completed
            </small>

          </article>


          <article class="implementation">

            <div class="implementation-header">

              <span>
                REASSESSMENT RATE
              </span>

              <strong>
                {{ reassessmentRate }}%
              </strong>

            </div>

            <div class="progress">

              <i
                :style="{
                  width:
                    reassessmentRate + '%'
                }"
              ></i>

            </div>

            <small>
              Learners checked again after intervention
            </small>

          </article>


          <article class="implementation action">

            <span>
              DISTRICT ACTION
            </span>

            <strong>
              Focus support where learning gaps persist.
            </strong>

            <small>
              Use priority skills and schools to target programme support.
            </small>

          </article>


        </div>

      </section>


      <!-- =================================
           DECISION SUMMARY
           ================================= -->

      <section class="decision">

        <div>

          <div class="eyebrow">
            DISTRICT DECISION VIEW
          </div>

          <h2>
            Turn aggregated signals into targeted support.
          </h2>

          <p>
            Use district trends, priority skills and priority schools
            to focus support and monitor programme impact.
          </p>

        </div>


        <div class="decision-list">

          <span>
            01 · Identify priority skills
          </span>

          <span>
            02 · Target priority schools
          </span>

          <span>
            03 · Monitor implementation
          </span>

          <span>
            04 · Measure learning movement
          </span>

        </div>

      </section>


      <!-- =================================
           PRIVACY
           ================================= -->

      <footer class="privacy">

        <strong>
          Aggregated official view
        </strong>

        <p>
          Officials see district-level patterns rather than student-level details.
          This view supports programme decisions while keeping learner information protected.
        </p>

        <span>
          Role-based access · Governed aggregation · Audit trail
        </span>

      </footer>

    </main>

  </div>
</template>

<style scoped>

* {
  box-sizing: border-box;
}

.official-page {
  min-height: 100vh;
  background: #f4f8f6;
  color: #12201b;
  font-family:
    Arial,
    Helvetica,
    sans-serif;
}

.dashboard {
  width: 100%;
  max-width: 1450px;
  margin: 0 auto;
  padding: 32px 38px 50px;
}

/* HEADER */

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 25px;
  margin-bottom: 22px;
}

.eyebrow,
.section-label {
  color: #648b30;
  font-size: 9px;
  letter-spacing: 1.6px;
  font-weight: 900;
}

.header h1 {
  font-size: 37px;
  margin: 9px 0 7px;
  letter-spacing: -1.2px;
}

.header p {
  color: #687970;
  font-size: 13px;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.district-control {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.district-control label {
  color: #648b30;
  font-size: 8px;
  letter-spacing: 1px;
  font-weight: 900;
}

.district-control select {
  width: 150px;
  height: 39px;
  padding: 0 11px;
  background: #fff;
  border: 1px solid #dce6e1;
  border-radius: 8px;
  color: #173e31;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
}

.export-button {
  height: 39px;
  padding: 0 15px;
  border: 0;
  border-radius: 8px;
  background: #e8f0eb;
  color: #174b3b;
  font-size: 9px;
  font-weight: 900;
  cursor: pointer;
}

/* DISTRICT */

.district-title {
  background: #104738;
  color: #fff;
  border-radius: 13px;
  padding: 17px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 25px;
}

.district-title > div:first-child span {
  display: block;
  color: #a8c5ba;
  font-size: 8px;
  letter-spacing: 1.2px;
  font-weight: 900;
}

.district-title strong {
  display: block;
  font-size: 22px;
  margin-top: 4px;
}

.district-meta {
  display: flex;
  gap: 10px;
}

.district-meta span {
  background: rgba(255,255,255,.08);
  padding: 8px 11px;
  border-radius: 7px;
  color: #dce8e3;
  font-size: 9px;
}

/* KPI */

section {
  margin-bottom: 25px;
}

.section-label {
  margin-bottom: 11px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.kpi {
  background: #fff;
  border: 1px solid #dce6e1;
  border-radius: 12px;
  padding: 17px;
  min-height: 120px;
}

.kpi span {
  color: #648b30;
  font-size: 8px;
  letter-spacing: 1px;
  font-weight: 900;
}

.kpi strong {
  display: block;
  font-size: 28px;
  margin-top: 13px;
}

.kpi small {
  display: block;
  color: #718079;
  font-size: 8px;
  margin-top: 5px;
  line-height: 1.4;
}

/* TWO COLUMN */

.two-column {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
}

.panel {
  background: #fff;
  border: 1px solid #dce6e1;
  border-radius: 14px;
  padding: 23px;
}

.panel h2 {
  font-size: 21px;
  margin: 7px 0 5px;
}

.description {
  color: #718079;
  font-size: 9px;
  line-height: 1.5;
  margin: 0;
}

/* CHART */

.chart {
  height: 210px;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 35px;
  margin-top: 17px;
  padding: 10px 35px 0;
  border-bottom: 1px solid #e0e8e3;
}

.year-column {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}

.bars {
  height: 175px;
  display: flex;
  align-items: flex-end;
  gap: 9px;
}

.bar-box {
  height: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: flex-end;
}

.bar {
  width: 43px;
  border-radius: 6px 6px 0 0;
}

.reading {
  background: #7eae94;
}

.arithmetic {
  background: #c8dd78;
}

.bar-box span {
  font-size: 7px;
  color: #687970;
  margin-top: 4px;
}

.year-column > strong {
  font-size: 8px;
  color: #607169;
  margin: 8px 0;
}

.legend {
  display: flex;
  gap: 17px;
  margin-top: 12px;
}

.legend span {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #718079;
  font-size: 8px;
}

.legend i {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.reading-dot {
  background: #7eae94;
}

.arithmetic-dot {
  background: #c8dd78;
}

.trend-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
  margin-top: 14px;
}

.trend-summary > div {
  background: #f2f6f3;
  padding: 11px;
  border-radius: 9px;
}

.trend-summary span {
  display: block;
  color: #648b30;
  font-size: 7px;
  letter-spacing: 1px;
  font-weight: 900;
}

.trend-summary strong {
  display: block;
  font-size: 16px;
  margin-top: 6px;
}

.trend-summary small {
  color: #718079;
  font-size: 7px;
}

/* SIGNAL */

.signal-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-top: 19px;
}

.signal {
  display: flex;
  gap: 11px;
  padding: 13px;
  background: #f3f7f4;
  border: 1px solid #e0e9e4;
  border-radius: 10px;
}

.signal-icon {
  width: 31px;
  height: 31px;
  flex: none;
  display: grid;
  place-items: center;
  background: #e8f3d8;
  color: #557c2a;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 900;
}

.signal strong {
  font-size: 10px;
}

.signal p {
  color: #718079;
  font-size: 8px;
  line-height: 1.45;
  margin: 4px 0 0;
}

/* PRIORITY */

.priority-list,
.school-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 17px;
}

.priority-row,
.school-row {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px;
  background: #f3f7f4;
  border: 1px solid #e0e9e4;
  border-radius: 9px;
}

.number {
  width: 29px;
  height: 29px;
  flex: none;
  display: grid;
  place-items: center;
  background: #e8f3d8;
  color: #557c2a;
  border-radius: 7px;
  font-size: 9px;
  font-weight: 900;
}

.priority-row strong,
.school-info strong {
  display: block;
  font-size: 10px;
}

.priority-row small,
.school-info small {
  display: block;
  color: #718079;
  font-size: 7px;
  margin-top: 3px;
}

.school-info {
  flex: 1;
}

.priority {
  background: #e8f3d8;
  color: #557c2a;
  padding: 5px 7px;
  border-radius: 20px;
  font-size: 6px;
  font-weight: 900;
  letter-spacing: .8px;
}

/* IMPLEMENTATION */

.implementation-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.implementation {
  background: #fff;
  border: 1px solid #dce6e1;
  border-radius: 12px;
  padding: 17px;
}

.implementation-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.implementation-header span,
.action > span {
  color: #648b30;
  font-size: 7px;
  letter-spacing: 1px;
  font-weight: 900;
}

.implementation-header strong {
  font-size: 18px;
}

.progress {
  height: 7px;
  background: #e3ebe6;
  border-radius: 20px;
  overflow: hidden;
  margin: 12px 0 8px;
}

.progress i {
  display: block;
  height: 100%;
  background: #72aa8c;
  border-radius: 20px;
}

.implementation small {
  color: #718079;
  font-size: 7px;
  line-height: 1.4;
}

.action strong {
  display: block;
  font-size: 13px;
  line-height: 1.3;
  margin: 10px 0 7px;
}

/* DECISION */

.decision {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  align-items: center;
  background: #104738;
  color: #fff;
  border-radius: 13px;
  padding: 21px 23px;
  margin-bottom: 15px;
}

.decision .eyebrow {
  color: #b9d97a;
}

.decision h2 {
  font-size: 20px;
  margin: 7px 0;
}

.decision p {
  color: #adc3bb;
  font-size: 9px;
  line-height: 1.5;
  margin: 0;
}

.decision-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.decision-list span {
  padding: 10px;
  background: rgba(255,255,255,.07);
  border-radius: 8px;
  font-size: 8px;
  color: #dbe8e3;
}

/* PRIVACY */

.privacy {
  border-top: 1px solid #dce6e1;
  padding-top: 14px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
}

.privacy strong {
  font-size: 9px;
}

.privacy p {
  color: #718079;
  font-size: 7px;
  line-height: 1.4;
  margin: 3px 0 0;
  max-width: 600px;
}

.privacy span {
  color: #718079;
  font-size: 7px;
  white-space: nowrap;
}

/* STATES */

.loading {
  min-height: 70vh;
  display: grid;
  place-items: center;
  color: #687970;
  font-size: 13px;
}

.error {
  margin: 30px;
  padding: 14px;
  background: #fff0f0;
  color: #963b3b;
  border: 1px solid #e0b6b6;
  border-radius: 9px;
}

.empty {
  color: #718079;
  font-size: 9px;
  padding: 20px 3px;
}

/* RESPONSIVE */

@media (max-width: 1200px) {

  .kpi-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .implementation-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 850px) {

  .dashboard {
    padding: 25px 20px 45px;
  }

  .header {
    flex-direction: column;
  }

  .header-right {
    width: 100%;
  }

  .two-column,
  .decision {
    grid-template-columns: 1fr;
  }

  .privacy {
    flex-direction: column;
    align-items: flex-start;
  }

  .privacy span {
    white-space: normal;
  }
}

@media (max-width: 600px) {

  .kpi-grid,
  .implementation-grid {
    grid-template-columns: 1fr;
  }

  .header-right {
    flex-direction: column;
    align-items: stretch;
  }

  .district-control select {
    width: 100%;
  }

  .export-button {
    width: 100%;
  }

  .district-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .district-meta {
    flex-wrap: wrap;
  }

  .trend-summary,
  .decision-list {
    grid-template-columns: 1fr;
  }

  .chart {
    padding-left: 10px;
    padding-right: 10px;
  }
}

</style>