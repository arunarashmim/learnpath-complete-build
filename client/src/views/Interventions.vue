<script setup>

import { ref, onMounted, watch, computed } from 'vue'
import { get, post } from '../services/api.js'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()


/* =========================================================
   DATA
========================================================= */

const readingGroups = ref([])
const arithmeticGroups = ref([])

const selectedGroup = ref(null)

const suggestions = ref([])
const selectedSuggestion = ref(null)

const loading = ref(true)
const aiLoading = ref(false)
const assigning = ref(false)

const assigned = ref(false)

const error = ref('')

const seed = ref(0)


/* =========================================================
   SUBJECT
========================================================= */

const selectedSubject = computed(() => {

  if (!selectedGroup.value) {
    return route.query.subject === 'arithmetic'
      ? 'arithmetic'
      : 'reading'
  }

  return selectedGroup.value.subject || 'reading'

})


/* =========================================================
   SUBJECT NAME
========================================================= */

const selectedSubjectName = computed(() => {

  return selectedSubject.value === 'arithmetic'
    ? 'Arithmetic'
    : 'Reading'

})


/* =========================================================
   CURRENT LEVEL
========================================================= */

const selectedLevel = computed(() => {

  if (!selectedGroup.value) {
    return ''
  }

  return selectedGroup.value.level || 'A'

})


/* =========================================================
   CURRENT SUBJECT GROUPS
========================================================= */

const currentSubjectGroups = computed(() => {

  if (
    selectedSubject.value === 'arithmetic'
  ) {

    return arithmeticGroups.value

  }

  return readingGroups.value

})


/* =========================================================
   GET CLEAN GROUP LETTER
========================================================= */

function getCleanLevel(group, index = 0) {

  /*
   * If backend already provides A/B/C/D,
   * use it.
   */

  if (
    group &&
    ['A', 'B', 'C', 'D']
      .includes(
        String(group.level || '').toUpperCase()
      )
  ) {

    return String(group.level).toUpperCase()

  }


  /*
   * Check ID.
   */

  const id =
    String(group?.id || '').toLowerCase()


  /*
   * Reading groups may be:
   * reading-A
   * reading-B
   * reading-C
   * reading-D
   */

  const letterMatch =
    id.match(
      /(?:^|[-_])([abcd])$/
    )


  if (letterMatch) {

    return letterMatch[1].toUpperCase()

  }


  /*
   * Arithmetic internal IDs.
   *
   * These are converted into clean
   * teacher-facing groups.
   */

  if (
    id.includes('foundation')
  ) {

    return 'A'

  }


  if (
    id.includes('practice')
  ) {

    return 'B'

  }


  if (
    id.includes('secure')
  ) {

    return 'C'

  }


  if (
    id.includes('extension')
  ) {

    return 'D'

  }


  /*
   * If backend gives a numeric level.
   */

  if (
    String(group?.level) === '1'
  ) {
    return 'A'
  }

  if (
    String(group?.level) === '2'
  ) {
    return 'B'
  }

  if (
    String(group?.level) === '3'
  ) {
    return 'C'
  }

  if (
    String(group?.level) === '4'
  ) {
    return 'D'
  }


  /*
   * Final fallback based on position.
   */

  return String.fromCharCode(
    65 + index
  )

}


/* =========================================================
   DEFAULT GOALS
========================================================= */

function getDefaultGoal(
  subject,
  level
) {

  if (
    subject === 'arithmetic'
  ) {

    const goals = {

      A:
        'Number sense → Addition',

      B:
        'Addition → Subtraction',

      C:
        'Subtraction → Multiplication',

      D:
        'Earlier support → Number sense'

    }

    return (
      goals[level] ||
      'Core arithmetic practice'
    )

  }


  const goals = {

    A:
      'Maintain and extend',

    B:
      'Sentences → Std II text',

    C:
      'Words → Sentences',

    D:
      'Earlier support → Words'

  }


  return (
    goals[level] ||
    'Foundational reading support'
  )

}


/* =========================================================
   NORMALISE GROUPS
========================================================= */

function normaliseGroups(
  groups,
  subject
) {

  if (
    !Array.isArray(groups)
  ) {

    return []

  }


  return groups.map(
    (group, index) => {

      const level =
        getCleanLevel(
          group,
          index
        )


      const subjectName =
        subject === 'arithmetic'
          ? 'Arithmetic'
          : 'Reading'


      const students =
        Array.isArray(group.students)
          ? group.students
          : []


      return {

        ...group,

        subject,

        level,

        /*
         * IMPORTANT:
         *
         * Never expose the internal
         * group ID as the label.
         */

        label:
          `${subjectName} • Group ${level}`,

        goal:
          getDefaultGoal(
            subject,
            level
          ),

        students

      }

    }
  )

}


/* =========================================================
   LOAD GROUPS
========================================================= */

async function loadGroups() {

  loading.value = true

  error.value = ''


  try {

    const data =
      await get('/groups')


    readingGroups.value =
      normaliseGroups(
        data?.reading || [],
        'reading'
      )


    arithmeticGroups.value =
      normaliseGroups(
        data?.arithmetic || [],
        'arithmetic'
      )


    /*
     * Sort groups A → B → C → D.
     */

    readingGroups.value.sort(
      sortGroups
    )

    arithmeticGroups.value.sort(
      sortGroups
    )


    /*
     * If already on Act page,
     * open selected group.
     */

    if (
      route.path === '/act' &&
      route.query.group
    ) {

      openGroupFromUrl()

    }

  } catch (e) {

    error.value =
      e?.message ||
      'Could not load learning groups.'

  } finally {

    loading.value = false

  }

}


/* =========================================================
   SORT GROUPS
========================================================= */

function sortGroups(a, b) {

  return (
    String(a.level)
      .localeCompare(
        String(b.level)
      )
  )

}


/* =========================================================
   OPEN GROUP FROM URL
========================================================= */

async function openGroupFromUrl() {

  const groupId =
    route.query.group


  const subject =
    route.query.subject === 'arithmetic'
      ? 'arithmetic'
      : 'reading'


  const groups =
    subject === 'arithmetic'
      ? arithmeticGroups.value
      : readingGroups.value


  let found =
    groups.find(
      group =>
        String(group.id) ===
        String(groupId)
    )


  /*
   * Some backends may use a different
   * internal ID while the URL contains
   * the group level.
   */

  if (!found) {

    const level =
      getLevelFromUrl(groupId)


    if (level) {

      found =
        groups.find(
          group =>
            group.level === level
        )

    }

  }


  if (!found) {

    return

  }


  selectedGroup.value =
    found


  assigned.value =
    false

  selectedSuggestion.value =
    null

  suggestions.value =
    []


  await generateSuggestions()

}


/* =========================================================
   GET LEVEL FROM URL
========================================================= */

function getLevelFromUrl(id) {

  const value =
    String(id || '')
      .toLowerCase()


  if (
    value.includes('foundation')
  ) {
    return 'A'
  }


  if (
    value.includes('practice')
  ) {
    return 'B'
  }


  if (
    value.includes('secure')
  ) {
    return 'C'
  }


  if (
    value.includes('extension')
  ) {
    return 'D'
  }


  const match =
    value.match(
      /(?:^|[-_])([abcd])$/
    )


  return match
    ? match[1].toUpperCase()
    : null

}


/* =========================================================
   INITIAL LOAD
========================================================= */

onMounted(
  loadGroups
)


/* =========================================================
   WATCH ROUTE
========================================================= */

watch(

  () => [
    route.path,
    route.query.group,
    route.query.subject
  ],

  async () => {

    if (
      route.path !== '/act'
    ) {

      return

    }


    if (
      !route.query.group
    ) {

      selectedGroup.value =
        null

      suggestions.value =
        []

      selectedSuggestion.value =
        null

      assigned.value =
        false

      return

    }


    await openGroupFromUrl()

  }

)


/* =========================================================
   OPEN GROUP FROM DIAGNOSE
========================================================= */

function openGroup(group) {

  router.push({

    path: '/act',

    query: {

      group:
        group.id,

      subject:
        group.subject

    }

  })

}


/* =========================================================
   CHANGE SUBJECT
========================================================= */

function changeSubject(subject) {

  const groups =
    subject === 'arithmetic'
      ? arithmeticGroups.value
      : readingGroups.value


  if (
    !groups.length
  ) {

    selectedGroup.value =
      null

    suggestions.value =
      []

    return

  }


  const firstGroup =
    groups[0]


  router.push({

    path: '/act',

    query: {

      group:
        firstGroup.id,

      subject

    }

  })

}


/* =========================================================
   CHANGE GROUP A/B/C/D
========================================================= */

function changeGroup(group) {

  router.push({

    path: '/act',

    query: {

      group:
        group.id,

      subject:
        group.subject

    }

  })

}


/* =========================================================
   GENERATE AI SUGGESTIONS
========================================================= */

async function generateSuggestions() {

  if (
    !selectedGroup.value
  ) {

    return

  }


  const students =
    selectedGroup.value.students || []


  if (
    !students.length
  ) {

    suggestions.value =
      []

    return

  }


  aiLoading.value =
    true

  error.value =
    ''


  try {

    const response =
      await post(
        '/ai/interventions',
        {

          studentIds:
            students.map(
              student =>
                student.id
            ),

          seed:
            seed.value,

          subject:
            selectedSubject.value

        }
      )


    suggestions.value =
      response?.suggestions ||
      []

    selectedSuggestion.value =
      null

  } catch (e) {

    error.value =
      e?.message ||
      'Could not generate AI interventions.'

  } finally {

    aiLoading.value =
      false

  }

}


/* =========================================================
   RELOAD AI
========================================================= */

async function reloadSuggestions() {

  seed.value += 1

  await generateSuggestions()

}


/* =========================================================
   SELECT SUGGESTION
========================================================= */

function selectSuggestion(item) {

  selectedSuggestion.value =
    item

}


/* =========================================================
   ASSIGN ACTIVITY
========================================================= */

async function assignActivity() {

  if (
    !selectedGroup.value ||
    !selectedSuggestion.value
  ) {

    return

  }


  assigning.value =
    true

  error.value =
    ''


  try {

    await post(
      '/interventions/start',
      {

        studentIds:
          selectedGroup.value.students.map(
            student =>
              student.id
          ),

        interventionId:
          selectedSuggestion.value.id

      }
    )


    assigned.value =
      true

  } catch (e) {

    error.value =
      e?.message ||
      'Could not assign this activity.'

  } finally {

    assigning.value =
      false

  }

}


/* =========================================================
   BACK TO DIAGNOSE
========================================================= */

function backToGroups() {

  router.push(
    '/diagnose'
  )

}


/* =========================================================
   ASSESSMENT
========================================================= */

function goAssessment() {

  router.push(
    '/assessment'
  )

}


/* =========================================================
   STUDENT SCORE
========================================================= */

function getStudentScore(student) {

  if (
    selectedSubject.value ===
    'arithmetic'
  ) {

    if (
      student.arithmeticScore !==
      undefined &&
      student.arithmeticScore !==
      null
    ) {

      return (
        `${student.arithmeticScore}/` +
        `${student.arithmeticMax || 12}`
      )

    }


    if (
      student.arithmeticMarks !==
      undefined &&
      student.arithmeticMarks !==
      null
    ) {

      return (
        `${student.arithmeticMarks}/` +
        `${student.arithmeticMax || 12}`
      )

    }

  }


  if (
    student.readingScore !==
    undefined &&
    student.readingScore !==
    null
  ) {

    return (
      `${student.readingScore}/` +
      `${student.readingMax || 13}`
    )

  }


  if (
    student.readingMarks !==
    undefined &&
    student.readingMarks !==
    null
  ) {

    return (
      `${student.readingMarks}/` +
      `${student.readingMax || 13}`
    )

  }


  return null

}

</script>


<template>

<div class="page">


  <!-- =====================================================
       ERROR
  ====================================================== -->

  <div
    v-if="error"
    class="error-card"
  >

    {{ error }}

  </div>



  <!-- =====================================================
       DIAGNOSE & GROUP PAGE
  ====================================================== -->

  <template
    v-if="route.path !== '/act'"
  >

    <header class="top">

      <div>

        <div class="eyebrow">
          CLASS 3 · LEARNING LEVELS
        </div>


        <h1>
          Groups & Actions
        </h1>


        <p class="muted">
          Marks create the learning level.
          Students are grouped by their
          assessment evidence.
        </p>

      </div>


      <button
        class="btn secondary"
        @click="goAssessment"
      >

        Assessment

      </button>

    </header>



    <!-- =================================================
         READING
    ================================================== -->

    <section class="card subject-section">

      <div class="section-head">

        <div>

          <div class="eyebrow">
            READING
          </div>


          <h2>
            Reading learning levels
          </h2>


          <p class="muted">
            Students grouped according to
            their reading assessment marks.
          </p>

        </div>

      </div>



      <div
        v-if="readingGroups.length"
        class="group-grid"
      >

        <button
          v-for="group in readingGroups"
          :key="group.id"
          class="group-card"
          @click="openGroup(group)"
        >

          <!-- GROUP -->

          <span class="badge">
            {{ group.level }}
          </span>


          <strong>
            Reading • Group {{ group.level }}
          </strong>


          <small>
            {{ group.students.length }}
            {{
              group.students.length === 1
                ? 'learner'
                : 'learners'
            }}
          </small>


          <span class="goal">
            {{ group.goal }}
          </span>



          <!-- STUDENTS -->

          <div
            v-if="group.students.length"
            class="student-list"
          >

            <div
              v-for="student in group.students"
              :key="student.id"
              class="student-line"
            >

              <span class="student-avatar">

                {{
                  student.name
                    ?.charAt(0)
                    ?.toUpperCase()
                }}

              </span>


              <span class="student-name">

                {{ student.name }}

              </span>

            </div>

          </div>


          <div
            v-else
            class="no-students"
          >

            No assessed learners

          </div>



          <!-- ACTION -->

          <span class="group-action">

            Choose today's intervention →

          </span>

        </button>

      </div>


      <div
        v-else-if="!loading"
        class="empty"
      >

        No reading assessment groups available.

      </div>

    </section>



    <!-- =================================================
         ARITHMETIC
    ================================================== -->

    <section class="card subject-section">

      <div class="section-head">

        <div>

          <div class="eyebrow">
            ARITHMETIC
          </div>


          <h2>
            Arithmetic learning levels
          </h2>


          <p class="muted">
            Students grouped according to
            their arithmetic assessment marks.
          </p>

        </div>

      </div>



      <div
        v-if="arithmeticGroups.length"
        class="group-grid"
      >

        <button
          v-for="group in arithmeticGroups"
          :key="group.id"
          class="group-card"
          @click="openGroup(group)"
        >

          <span class="badge">
            {{ group.level }}
          </span>


          <strong>
            Arithmetic • Group {{ group.level }}
          </strong>


          <small>
            {{ group.students.length }}
            {{
              group.students.length === 1
                ? 'learner'
                : 'learners'
            }}
          </small>


          <span class="goal">
            {{ group.goal }}
          </span>



          <!-- STUDENTS -->

          <div
            v-if="group.students.length"
            class="student-list"
          >

            <div
              v-for="student in group.students"
              :key="student.id"
              class="student-line"
            >

              <span class="student-avatar">

                {{
                  student.name
                    ?.charAt(0)
                    ?.toUpperCase()
                }}

              </span>


              <span class="student-name">

                {{ student.name }}

              </span>

            </div>

          </div>


          <div
            v-else
            class="no-students"
          >

            No assessed learners

          </div>


          <span class="group-action">

            Choose today's intervention →

          </span>

        </button>

      </div>


      <div
        v-else-if="!loading"
        class="empty"
      >

        No arithmetic assessment groups available.

      </div>

    </section>

  </template>



  <!-- =====================================================
       ACT PAGE
  ====================================================== -->

  <template
    v-else
  >

    <!-- HEADER -->

    <header class="top">

      <div>

        <div class="eyebrow">
          CLASS 3 · ACT
        </div>


        <h1>
          Choose today's intervention
        </h1>


        <p class="muted">
          Select a learning group and choose
          one teacher-approved AI activity
          for today's support.
        </p>

      </div>


      <button
        class="btn secondary"
        @click="backToGroups"
      >

        ← Diagnose & Group

      </button>

    </header>



    <!-- =================================================
         SUBJECT SWITCH
    ================================================== -->

    <section class="card subject-switch-card">

      <div>

        <div class="eyebrow">
          LEARNING AREA
        </div>


        <h2>
          Choose the learning area
        </h2>

      </div>


      <div class="subject-buttons">

        <button
          class="subject-button"
          :class="{
            active:
              selectedSubject === 'reading'
          }"
          @click="
            changeSubject('reading')
          "
        >

          📖 Reading

        </button>


        <button
          class="subject-button"
          :class="{
            active:
              selectedSubject === 'arithmetic'
          }"
          @click="
            changeSubject('arithmetic')
          "
        >

          🔢 Arithmetic

        </button>

      </div>

    </section>



    <!-- =================================================
         GROUP A B C D
    ================================================== -->

    <section class="card level-selector">

      <div>

        <div class="eyebrow">
          LEARNING LEVEL
        </div>


        <h2>
          Choose a group
        </h2>

      </div>



      <div
        v-if="currentSubjectGroups.length"
        class="level-tabs"
      >

        <button
          v-for="
            group in currentSubjectGroups
          "
          :key="group.id"
          class="level-tab"
          :class="{
            active:
              selectedGroup?.id ===
              group.id
          }"
          @click="
            changeGroup(group)
          "
        >

          <span class="level-letter">

            {{ group.level }}

          </span>


          <span class="level-name">

            Group {{ group.level }}

          </span>


          <small>

            {{ group.students.length }}
            learners

          </small>

        </button>

      </div>


      <div
        v-else
        class="empty"
      >

        No groups available for this
        learning area.

      </div>

    </section>



    <!-- =================================================
         NO SELECTED GROUP
    ================================================== -->

    <section
      v-if="!selectedGroup"
      class="card empty-card"
    >

      <h2>
        Choose a learning group
      </h2>


      <p class="muted">

        Select Group A, B, C or D above
        to see today's intervention options.

      </p>

    </section>



    <!-- =================================================
         SELECTED GROUP
    ================================================== -->

    <template
      v-if="selectedGroup"
    >

      <section class="card selected-group-card">

        <div class="selected-header">

          <div>

            <div class="eyebrow">
              SELECTED LEARNING GROUP
            </div>


            <h2>

              {{ selectedSubjectName }}
              • Group {{ selectedLevel }}

            </h2>


            <p class="muted">

              {{ selectedGroup.students.length }}
              {{
                selectedGroup.students.length === 1
                  ? 'learner'
                  : 'learners'
              }}

              ·

              {{ selectedGroup.goal }}

            </p>

          </div>


          <button
            class="btn secondary"
            @click="backToGroups"
          >

            Change group

          </button>

        </div>



        <!-- =================================================
             STUDENTS
        ================================================== -->

        <div class="student-evidence">

          <div class="evidence-title">

            Students in this group

          </div>


          <div class="student-chips">

            <div
              v-for="
                student in selectedGroup.students
              "
              :key="student.id"
              class="student-chip"
            >

              <span class="chip-avatar">

                {{
                  student.name
                    ?.charAt(0)
                    ?.toUpperCase()
                }}

              </span>


              <span>

                {{ student.name }}

              </span>


              <span
                v-if="
                  getStudentScore(student)
                "
                class="chip-score"
              >

                {{ getStudentScore(student) }}

              </span>

            </div>

          </div>

        </div>

      </section>



      <!-- =================================================
           AI ACTION PLANNER
      ================================================== -->

      <section class="card ai-section">

        <div class="section-head">

          <div>

            <div class="eyebrow">
              AI ACTION PLANNER
            </div>


            <h2>
              3 suggested interventions
            </h2>


            <p class="muted">

              Suggestions are based on this
              group's current learning level
              and assessment evidence.
              The teacher chooses the final action.

            </p>

          </div>


          <button
            class="btn secondary reload-button"
            :disabled="aiLoading"
            @click="reloadSuggestions"
          >

            {{
              aiLoading
                ? 'Generating…'
                : '↻ Reload suggestions'
            }}

          </button>

        </div>



        <!-- LOADING -->

        <div
          v-if="aiLoading"
          class="ai-loading"
        >

          <div class="loading-circle">
            AI
          </div>


          <strong>
            AI is preparing three options…
          </strong>


          <span>
            Using this group's assessment evidence
          </span>

        </div>



        <!-- SUGGESTIONS -->

        <div
          v-else-if="suggestions.length"
          class="suggestion-grid"
        >

          <button
            v-for="
              item in suggestions
            "
            :key="item.id"
            class="suggestion-card"
            :class="{
              selected:
                selectedSuggestion?.id ===
                item.id
            }"
            @click="
              selectSuggestion(item)
            "
          >

            <div class="suggestion-top">

              <div>

                <strong>

                  {{ item.title }}

                </strong>


                <span class="focus">

                  {{ item.focus }}

                </span>

              </div>


              <span class="duration">

                {{ item.duration }}
                min

              </span>

            </div>



            <p class="suggestion-evidence">

              {{ item.evidence }}

            </p>



            <div class="steps-title">

              Guided steps

            </div>


            <ol>

              <li
                v-for="
                  step in item.steps
                "
                :key="step"
              >

                {{ step }}

              </li>

            </ol>



            <div
              v-if="
                selectedSuggestion?.id ===
                item.id
              "
              class="selected-label"
            >

              ✓ Selected for today

            </div>


            <div
              v-else
              class="select-label"
            >

              Select this activity →

            </div>

          </button>

        </div>



        <!-- EMPTY -->

        <div
          v-else
          class="empty"
        >

          No AI suggestions are available
          for this group yet.

        </div>

      </section>



      <!-- =================================================
           ASSIGN BAR
      ================================================== -->

      <section class="assign-section">

        <div
          v-if="!assigned"
          class="assign-bar"
        >

          <div>

            <div class="eyebrow">
              TODAY'S ACTION
            </div>


            <strong
              v-if="selectedSuggestion"
            >

              {{ selectedSuggestion.title }}

            </strong>


            <span
              v-else
              class="muted"
            >

              Select one intervention above

            </span>


            <small
              v-if="selectedSuggestion"
            >

              Will be assigned to
              {{ selectedGroup.students.length }}
              learners in
              {{ selectedSubjectName }}
              Group {{ selectedLevel }}

            </small>

          </div>


          <button
            class="btn lime assign-button"
            :disabled="
              assigning ||
              !selectedSuggestion
            "
            @click="assignActivity"
          >

            {{
              assigning
                ? 'Assigning…'
                : 'Assign for today →'
            }}

          </button>

        </div>



        <!-- SUCCESS -->

        <div
          v-else
          class="assigned-success"
        >

          <div class="success-icon">
            ✓
          </div>


          <div>

            <strong>
              Activity assigned successfully
            </strong>


            <p>

              <b>
                {{ selectedSuggestion.title }}
              </b>

              has been assigned to all
              {{ selectedGroup.students.length }}
              learners in

              {{ selectedSubjectName }}
              Group {{ selectedLevel }}.

              Students can complete it from
              their Student workspace.

            </p>

          </div>


          <button
            class="btn secondary"
            @click="
              selectedSuggestion = null;
              assigned = false
            "
          >

            Choose another

          </button>

        </div>

      </section>

    </template>

  </template>

</div>

</template>


<style scoped>

/* =========================================================
   TOP
========================================================= */

.top {

  display: flex;

  justify-content: space-between;

  align-items: flex-start;

  gap: 20px;

  margin-bottom: 20px;

}


.section-head {

  display: flex;

  justify-content: space-between;

  align-items: flex-start;

  gap: 20px;

}


.subject-section {

  margin-bottom: 18px;

}


/* =========================================================
   ERROR
========================================================= */

.error-card {

  background: #fff0ee;

  border: 1px solid #ffd3cc;

  color: #9f3d2f;

  padding: 12px 15px;

  border-radius: 12px;

  margin-bottom: 16px;

}


/* =========================================================
   GROUP CARDS
========================================================= */

.group-grid {

  display: grid;

  grid-template-columns:
    repeat(4, minmax(0, 1fr));

  gap: 12px;

  margin-top: 20px;

}


.group-card {

  border: 1px solid #dfe7e1;

  background: #fff;

  border-radius: 15px;

  padding: 16px;

  min-height: 285px;

  display: flex;

  flex-direction: column;

  align-items: flex-start;

  text-align: left;

  cursor: pointer;

  transition: .15s;

}


.group-card:hover {

  border-color: #b4d889;

  box-shadow:
    0 8px 22px rgba(0,0,0,.06);

  transform:
    translateY(-2px);

}


.badge {

  width: 34px;

  height: 34px;

  border-radius: 10px;

  display: grid;

  place-items: center;

  background: #e9f8d6;

  color: #173d31;

  font-weight: 900;

  margin-bottom: 10px;

}


.group-card > strong {

  font-size: 15px;

  color: #111827;

}


.group-card > small {

  color: #64748b;

  font-size: 11px;

  margin-top: 4px;

}


.goal {

  color: #536b25;

  font-size: 11px;

  margin-top: 5px;

}


/* =========================================================
   STUDENTS
========================================================= */

.student-list {

  width: 100%;

  margin-top: 13px;

  padding-top: 10px;

  border-top: 1px solid #edf1ee;

  display: grid;

  gap: 6px;

}


.student-line {

  display: flex;

  align-items: center;

  gap: 7px;

  font-size: 11px;

  color: #334155;

}


.student-avatar {

  width: 22px;

  height: 22px;

  min-width: 22px;

  border-radius: 50%;

  display: grid;

  place-items: center;

  background: #eff7e8;

  color: #49682b;

  font-size: 9px;

  font-weight: 900;

}


.student-name {

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

}


.no-students {

  margin-top: 13px;

  font-size: 11px;

  color: #94a3b8;

}


.group-action {

  margin-top: auto;

  padding-top: 13px;

  font-size: 11px;

  font-weight: 800;

  color: #173d31;

}


/* =========================================================
   SUBJECT SWITCH
========================================================= */

.subject-switch-card {

  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 20px;

  margin-bottom: 16px;

}


.subject-buttons {

  display: flex;

  gap: 8px;

}


.subject-button {

  border: 1px solid #dbe5df;

  background: #f5f8f6;

  border-radius: 10px;

  padding: 11px 18px;

  font-weight: 800;

  cursor: pointer;

  color: #31483d;

}


.subject-button:hover {

  border-color: #9bc968;

}


.subject-button.active {

  background: #eaff72;

  border-color: #eaff72;

  color: #173d31;

}


/* =========================================================
   GROUP A B C D
========================================================= */

.level-selector {

  margin-bottom: 16px;

}


.level-tabs {

  display: grid;

  grid-template-columns:
    repeat(4, minmax(0, 1fr));

  gap: 10px;

  margin-top: 18px;

}


.level-tab {

  border: 1px solid #dfe7e1;

  background: #fff;

  border-radius: 13px;

  padding: 12px;

  display: flex;

  align-items: center;

  gap: 10px;

  cursor: pointer;

  text-align: left;

  color: #18251f;

}


.level-tab:hover {

  border-color: #a9d373;

}


.level-tab.active {

  border-color: #92c75a;

  background: #f4fbe9;

  box-shadow:
    inset 0 0 0 1px #92c75a;

}


.level-letter {

  width: 32px;

  height: 32px;

  min-width: 32px;

  border-radius: 9px;

  display: grid;

  place-items: center;

  background: #e9f8d6;

  font-weight: 900;

  color: #36521e;

}


.level-name {

  font-weight: 800;

}


.level-tab small {

  margin-left: auto;

  color: #64748b;

  font-size: 10px;

  white-space: nowrap;

}


/* =========================================================
   SELECTED GROUP
========================================================= */

.selected-group-card {

  margin-bottom: 16px;

}


.selected-header {

  display: flex;

  justify-content: space-between;

  align-items: flex-start;

  gap: 20px;

}


.selected-header h2 {

  margin:
    4px 0;

}


.student-evidence {

  margin-top: 20px;

  padding: 15px;

  background: #f7faf8;

  border: 1px solid #edf1ee;

  border-radius: 13px;

}


.evidence-title {

  font-size: 12px;

  font-weight: 800;

  color: #334155;

  margin-bottom: 10px;

}


.student-chips {

  display: flex;

  flex-wrap: wrap;

  gap: 8px;

}


.student-chip {

  display: flex;

  align-items: center;

  gap: 7px;

  background: #fff;

  border: 1px solid #e2e8e4;

  border-radius: 999px;

  padding: 6px 10px 6px 6px;

  font-size: 11px;

}


.chip-avatar {

  width: 24px;

  height: 24px;

  border-radius: 50%;

  display: grid;

  place-items: center;

  background: #eaf7d8;

  color: #49682b;

  font-size: 9px;

  font-weight: 900;

}


.chip-score {

  color: #64748b;

}


/* =========================================================
   AI
========================================================= */

.ai-section {

  margin-bottom: 16px;

}


.reload-button {

  min-width: 165px;

}


.ai-loading {

  min-height: 220px;

  display: flex;

  flex-direction: column;

  justify-content: center;

  align-items: center;

  gap: 8px;

  color: #64748b;

}


.loading-circle {

  width: 52px;

  height: 52px;

  border-radius: 50%;

  display: grid;

  place-items: center;

  background: #eaf7d8;

  color: #456226;

  font-weight: 900;

  margin-bottom: 5px;

}


.suggestion-grid {

  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 14px;

  margin-top: 20px;

}


.suggestion-card {

  border: 1px solid #dfe7e1;

  background: #fff;

  border-radius: 15px;

  padding: 17px;

  text-align: left;

  cursor: pointer;

  display: flex;

  flex-direction: column;

  min-height: 300px;

  transition: .15s;

}


.suggestion-card:hover {

  border-color: #b4d889;

  box-shadow:
    0 8px 20px rgba(0,0,0,.06);

}


.suggestion-card.selected {

  border:
    2px solid #91bd59;

  background: #f8fced;

}


.suggestion-top {

  display: flex;

  justify-content: space-between;

  gap: 10px;

}


.suggestion-top strong {

  display: block;

  font-size: 14px;

  line-height: 1.35;

}


.focus {

  display: block;

  margin-top: 5px;

  color: #557229;

  font-size: 11px;

  font-weight: 700;

}


.duration {

  white-space: nowrap;

  color: #64748b;

  font-size: 11px;

}


.suggestion-evidence {

  color: #64748b;

  font-size: 11px;

  line-height: 1.5;

  margin: 13px 0;

}


.steps-title {

  font-size: 11px;

  font-weight: 800;

  color: #334155;

}


.suggestion-card ol {

  padding-left: 18px;

  margin: 7px 0;

  color: #475569;

  font-size: 11px;

  line-height: 1.55;

}


.selected-label {

  margin-top: auto;

  padding-top: 12px;

  color: #4a7026;

  font-size: 11px;

  font-weight: 900;

}


.select-label {

  margin-top: auto;

  padding-top: 12px;

  color: #173d31;

  font-size: 11px;

  font-weight: 800;

}


/* =========================================================
   ASSIGN
========================================================= */

.assign-section {

  margin-bottom: 20px;

}


.assign-bar {

  background: #f3f7f4;

  border: 1px solid #e1e9e3;

  border-radius: 14px;

  padding: 16px 18px;

  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 20px;

}


.assign-bar strong {

  display: block;

  margin-top: 3px;

}


.assign-bar small {

  display: block;

  margin-top: 5px;

  color: #64748b;

}


.assign-button {

  min-width: 190px;

}


.assigned-success {

  background: #effbe3;

  border: 1px solid #d9edbc;

  border-radius: 14px;

  padding: 17px;

  display: flex;

  align-items: center;

  gap: 14px;

}


.success-icon {

  width: 40px;

  height: 40px;

  min-width: 40px;

  border-radius: 50%;

  display: grid;

  place-items: center;

  background: #d8f2b5;

  color: #41651f;

  font-weight: 900;

}


.assigned-success p {

  margin:
    5px 0 0;

  color: #52705d;

  font-size: 12px;

  line-height: 1.5;

}


.assigned-success > div:nth-child(2) {

  flex: 1;

}


/* =========================================================
   EMPTY
========================================================= */

.empty {

  text-align: center;

  padding: 35px;

  color: #64748b;

}


.empty-card {

  text-align: center;

}


/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 1100px) {

  .group-grid {

    grid-template-columns:
      repeat(2, minmax(0, 1fr));

  }


  .suggestion-grid {

    grid-template-columns:
      1fr;

  }

}


@media (max-width: 850px) {

  .level-tabs {

    grid-template-columns:
      repeat(2, minmax(0, 1fr));

  }


  .subject-switch-card {

    flex-direction: column;

    align-items: stretch;

  }


  .subject-buttons {

    width: 100%;

  }


  .subject-button {

    flex: 1;

  }

}


@media (max-width: 650px) {

  .top,
  .section-head,
  .selected-header {

    flex-direction: column;

  }


  .group-grid {

    grid-template-columns:
      1fr;

  }


  .level-tabs {

    grid-template-columns:
      1fr;

  }


  .assign-bar,
  .assigned-success {

    flex-direction: column;

    align-items: stretch;

  }


  .assign-button {

    width: 100%;

  }

}

</style>