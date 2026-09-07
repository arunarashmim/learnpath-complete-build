<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const selectedRole = ref('')
const email = ref('')
const password = ref('')
const name = ref('')
const mode = ref('login')
const loading = ref(false)
const error = ref('')

const roles = [
  {
    id: 'teacher',
    title: 'Teacher',

  },
  {
    id: 'student',
    title: 'Student',
    
  },
  {
    id: 'headteacher',
    title: 'Head Teacher',
    
  },
  {
    id: 'official',
    title: 'Education Official',
    
  }
]

const roleName = computed(() => {
  const role = roles.find(
    item => item.id === selectedRole.value
  )

  return role ? role.title : ''
})

function choose(role) {
  selectedRole.value = role
  mode.value = 'login'
  error.value = ''
  email.value = ''
  password.value = ''
  name.value = ''
}

function switchMode(newMode) {
  mode.value = newMode
  error.value = ''
  password.value = ''
}

function fillDemo() {
  const demos = {
    teacher: {
      email: 'teacher@learnpath.com',
      password: 'Teacher@123'
    },
    student: {
      email: 'tom@gmail.com',
      password: 'tom123'
    },
    headteacher: {
      email: 'headteacher@learnpath.com',
      password: 'Head@123'
    },
    official: {
      email: 'official@learnpath.com',
      password: 'Official@123'
    }
  }

  const demo = demos[selectedRole.value]

  if (demo) {
    email.value = demo.email
    password.value = demo.password
  }
}

async function submit() {
  error.value = ''

  if (!selectedRole.value) {
    error.value = 'Please choose a workspace first.'
    return
  }

  if (!email.value.trim()) {
    error.value = 'Please enter your email.'
    return
  }

  if (!password.value) {
    error.value = 'Please enter your password.'
    return
  }

  loading.value = true

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value,
        role: selectedRole.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.message || 'Unable to sign in.'
      )
    }

    if (!data.user) {
      throw new Error(
        'The server did not return user information.'
      )
    }

    localStorage.setItem(
      'learnpathUser',
      JSON.stringify(data.user)
    )

    localStorage.setItem(
      'sessionUser',
      JSON.stringify(data.user)
    )

    localStorage.setItem(
      'role',
      data.user.role
    )

    localStorage.removeItem(
      'learnpath_class_selected'
    )

    if (data.user.role === 'teacher') {
      await router.push('/teacher')
      return
    }

    if (data.user.role === 'student') {
      await router.push('/student')
      return
    }

    if (data.user.role === 'headteacher') {
      await router.push('/head-teacher')
      return
    }

    if (data.user.role === 'official') {
      await router.push('/official')
      return
    }

    throw new Error('Unknown user role.')
  } catch (err) {
    console.error(err)

    error.value =
      err.message || 'Unable to sign in.'
  } finally {
    loading.value = false
  }
}

async function register() {
  error.value = ''

  if (!name.value.trim()) {
    error.value = 'Please enter your name.'
    return
  }

  if (!email.value.trim()) {
    error.value = 'Please enter your email.'
    return
  }

  if (!password.value) {
    error.value = 'Please enter a password.'
    return
  }

  if (password.value.length < 6) {
    error.value =
      'Password must be at least 6 characters.'
    return
  }

  loading.value = true

  try {
    const response = await fetch(
      '/api/auth/register',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: name.value.trim(),
          email: email.value.trim(),
          password: password.value
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.message || 'Registration failed.'
      )
    }

    selectedRole.value = 'student'
    mode.value = 'login'

    password.value = ''
    name.value = ''

    error.value =
      'Student account created successfully. Please sign in as Student.'
  } catch (err) {
    console.error(err)

    error.value =
      err.message || 'Registration failed.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">

    <!-- LEFT SIDE -->
    <section class="hero">

      <div class="hero-content">

        <div class="eyebrow">
          LEARNPATH · TURNING SIGNALS TO ACTIONS
        </div>

        <h1>
          From learning
          <br />
          <span>signals to action.</span>
        </h1>

        <p>
          LearnPath turns a short assessment
          into a practical next step for the
          classroom.
        </p>

        <div class="hero-flow">

          <span>Assess</span>

          <b>→</b>

          <span>Group</span>

          <b>→</b>

          <span>Act</span>

          <b>→</b>

          <span>Reassess</span>

        </div>

      </div>

    </section>

    <!-- RIGHT SIDE -->
    <section class="auth-section">

      <div class="auth-card">

        <div class="eyebrow dark">
          CHOOSE WORKSPACE
        </div>

        <h2>
          Who are you signing in as?
        </h2>

        <p class="description">
          Your workspace controls which
          information and actions you can access.
        </p>

        <!-- ROLES -->
        <div class="roles">

          <button
            v-for="role in roles"
            :key="role.id"
            type="button"
            class="role-card"
            :class="{
              selected: selectedRole === role.id
            }"
            @click="choose(role.id)"
          >

            <span class="role-icon">

              {{
                role.id === 'teacher'
                  ? 'T'
                  : role.id === 'student'
                    ? 'S'
                    : role.id === 'headteacher'
                      ? 'H'
                      : 'O'
              }}

            </span>

            <div class="role-text">

              <strong>
                {{ role.title }}
              </strong>

              <small>
                {{ role.description }}
              </small>

            </div>

            <span
              v-if="selectedRole === role.id"
              class="check"
            >
              ✓
            </span>

          </button>

        </div>

        <!-- LOGIN AREA -->
        <div
          v-if="selectedRole"
          class="login-area"
        >

          <div class="workspace">

            <span>
              SELECTED WORKSPACE
            </span>

            <strong>
              {{ roleName }}
            </strong>

          </div>

          <!-- STUDENT TABS -->
          <div
            v-if="selectedRole === 'student'"
            class="tabs"
          >

            <button
              type="button"
              :class="{
                active: mode === 'login'
              }"
              @click="switchMode('login')"
            >
              Sign in
            </button>

            <button
              type="button"
              :class="{
                active: mode === 'register'
              }"
              @click="switchMode('register')"
            >
              New student
            </button>

          </div>

          <!-- LOGIN FORM -->
          <form
            v-if="mode === 'login'"
            @submit.prevent="submit"
          >

            <label>
              Email

              <input
                v-model="email"
                type="email"
                placeholder="Enter your email"
                autocomplete="email"
              />
            </label>

            <label>
              Password

              <input
                v-model="password"
                type="password"
                placeholder="Enter your password"
                autocomplete="current-password"
              />
            </label>

            <button
              type="button"
              class="demo-button"
              @click="fillDemo"
            >
              Use demo credentials
            </button>

            <div
              v-if="error"
              class="message"
            >
              {{ error }}
            </div>

            <button
              type="submit"
              class="continue-button"
              :disabled="loading"
            >

              {{
                loading
                  ? 'Signing in...'
                  : 'Continue as ' + roleName + ' →'
              }}

            </button>

          </form>

          <!-- REGISTER FORM -->
          <form
            v-else
            @submit.prevent="register"
          >

            <label>
              Name

              <input
                v-model="name"
                type="text"
                placeholder="Student name"
                autocomplete="name"
              />
            </label>

            <label>
              Email

              <input
                v-model="email"
                type="email"
                placeholder="Student email"
                autocomplete="email"
              />
            </label>

            <label>
              Password

              <input
                v-model="password"
                type="password"
                placeholder="At least 6 characters"
                autocomplete="new-password"
              />
            </label>

            <div
              v-if="error"
              class="message"
            >
              {{ error }}
            </div>

            <button
              type="submit"
              class="continue-button"
              :disabled="loading"
            >

              {{
                loading
                  ? 'Creating account...'
                  : 'Create student account →'
              }}

            </button>

          </form>

        </div>

        <!-- NOTHING SELECTED -->
        <div
          v-else
          class="choose-message"
        >
          Select a workspace above to continue.
        </div>

      </div>

    </section>

  </div>
</template>

<style scoped>

* {
  box-sizing: border-box;
}

.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 55% 45%;
  background: #f7f9f7;
}

.hero {
  min-height: 100vh;
  padding: 70px;
  display: flex;
  align-items: center;
  background: #173d31;
  color: white;
}

.hero-content {
  max-width: 620px;
}

.eyebrow {
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 2px;
}

.eyebrow.dark {
  color: #78943d;
}

.hero h1 {
  margin: 18px 0 25px;
  font-size: 58px;
  line-height: 1.02;
  letter-spacing: -2px;
}

.hero h1 span {
  color: #d9ff48;
}

.hero p {
  max-width: 500px;
  color: #d4e2dc;
  font-size: 16px;
  line-height: 1.7;
}

.hero-flow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 38px;
}

.hero-flow span {
  padding: 9px 14px;
  border: 1px solid rgba(255, 255, 255, .2);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.hero-flow b {
  color: #d9ff48;
}

.auth-section {
  min-height: 100vh;
  padding: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  width: 100%;
  max-width: 520px;
  padding: 32px;
  background: white;
  border: 1px solid #e0e7e2;
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(20, 50, 40, .08);
}

.auth-card h2 {
  margin: 10px 0 7px;
  font-size: 26px;
  color: #17202a;
}

.description {
  margin: 0 0 22px;
  color: #68756f;
  font-size: 13px;
  line-height: 1.5;
}

.roles {
  display: grid;
  gap: 9px;
}

.role-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px;
  background: white;
  border: 1px solid #dce5df;
  border-radius: 12px;
  text-align: left;
  cursor: pointer;
  transition: .15s;
}

.role-card:hover {
  border-color: #9abd70;
}

.role-card.selected {
  background: #f4f9ed;
  border-color: #9abd70;
}

.role-icon {
  width: 36px;
  height: 36px;
  min-width: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #edf4e7;
  color: #35551d;
  font-weight: 900;
}

.role-text {
  flex: 1;
}

.role-text strong,
.role-text small {
  display: block;
}

.role-text strong {
  color: #17202a;
  font-size: 13px;
}

.role-text small {
  margin-top: 3px;
  color: #64748b;
  font-size: 10px;
  line-height: 1.4;
}

.check {
  color: #78943d;
  font-weight: 900;
}

.login-area {
  margin-top: 22px;
  padding-top: 22px;
  border-top: 1px solid #e8ede9;
}

.workspace {
  padding: 11px 13px;
  background: #f5f8ed;
  border-left: 3px solid #9abd70;
}

.workspace span {
  display: block;
  color: #78837e;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 1px;
}

.workspace strong {
  display: block;
  margin-top: 3px;
  color: #26332d;
  font-size: 13px;
}

.tabs {
  display: flex;
  gap: 6px;
  margin: 15px 0;
}

.tabs button {
  padding: 8px 13px;
  border: 0;
  border-radius: 8px;
  background: #f1f5f2;
  color: #52605a;
  cursor: pointer;
  font-size: 11px;
}

.tabs button.active {
  background: #dff7bd;
  color: #26332d;
  font-weight: 800;
}

form {
  display: flex;
  flex-direction: column;
}

label {
  margin: 10px 0;
  color: #26332d;
  font-size: 11px;
  font-weight: 800;
}

input {
  width: 100%;
  margin-top: 6px;
  padding: 12px;
  border: 1px solid #d7e0da;
  border-radius: 9px;
  outline: none;
  font-size: 13px;
}

input:focus {
  border-color: #9abd70;
}

.demo-button {
  align-self: flex-start;
  margin: 3px 0 5px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #536b25;
  text-decoration: underline;
  cursor: pointer;
  font-size: 10px;
  font-weight: 800;
}

.message {
  margin-top: 10px;
  padding: 10px;
  border-radius: 8px;
  background: #fff3ef;
  color: #a33a2e;
  font-size: 11px;
  line-height: 1.4;
}

.continue-button {
  width: 100%;
  margin-top: 12px;
  padding: 13px;
  border: 0;
  border-radius: 9px;
  background: #d9ff48;
  color: #17202a;
  font-weight: 900;
  cursor: pointer;
}

.continue-button:hover {
  filter: brightness(.96);
}

.continue-button:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.choose-message {
  margin-top: 20px;
  padding: 13px;
  border-radius: 9px;
  background: #f7f9f7;
  color: #78837e;
  text-align: center;
  font-size: 11px;
}

@media (max-width: 850px) {

  .login-page {
    grid-template-columns: 1fr;
  }

  .hero {
    min-height: auto;
    padding: 45px;
  }

  .hero h1 {
    font-size: 44px;
  }

  .auth-section {
    padding: 25px;
  }

}

</style>