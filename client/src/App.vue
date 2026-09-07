<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

/* =====================================================
   ONLINE STATUS
   ===================================================== */

const isOnline = ref(
  typeof window !== 'undefined'
    ? window.navigator.onLine
    : true
)

/* =====================================================
   USER
   ===================================================== */

const currentUser = ref(null)

function loadUser() {
  try {
    const stored =
      localStorage.getItem('learnpathUser') ||
      localStorage.getItem('learnpath_user')

    currentUser.value = stored
      ? JSON.parse(stored)
      : null
  } catch {
    currentUser.value = null
  }
}

loadUser()


/* =====================================================
   ROLE
   ===================================================== */

const role = computed(() => {
  return (
    currentUser.value?.role ||
    localStorage.getItem('role') ||
    'teacher'
  )
})


/* =====================================================
   USER NAME
   ===================================================== */

const userName = computed(() => {
  return (
    currentUser.value?.name ||
    'User'
  )
})


/* =====================================================
   NAVIGATION
   ===================================================== */

const navigation = {

  /* ================================================
     TEACHER
     ================================================ */

  teacher: [
    {
      label: 'Class 3',
      path: '/teacher'
    },
    {
      label: 'Assess',
      path: '/assessment'
    },
    {
      label: 'Diagnose & Group',
      path: '/diagnose'
    },
    {
      label: 'Act',
      path: '/act'
    },
    {
      label: 'Reassess',
      path: '/reassess'
    },
    {
      label: 'Analytics',
      path: '/analytics'
    }
  ],


  /* ================================================
     STUDENT
     ================================================ */

  student: [
    {
      label: 'My Learning Path',
      path: '/student'
    },
    {
      label: 'My Activity',
      path: '/student/activity'
    },
    {
      label: 'My Progress',
      path: '/student/progress'
    }
  ],


  /* ================================================
     HEAD TEACHER
     ================================================ */

  headteacher: [
    {
      label: 'School Pulse',
      path: '/head-teacher'
    },
    {
      label: 'Analytics',
      path: '/analytics'
    }
  ],


  /* ================================================
     EDUCATION OFFICIAL

     ONLY DISTRICT OVERVIEW
     NO ANALYTICS
     ================================================ */

  official: [
    {
      label: 'District Overview',
      path: '/official'
    }
  ]
}


/* =====================================================
   CURRENT NAVIGATION
   ===================================================== */

const currentNavigation = computed(() => {
  return (
    navigation[role.value] ||
    navigation.teacher
  )
})


/* =====================================================
   ACTIVE NAVIGATION

   Exact route matching prevents:
   /diagnose from also highlighting /teacher
   etc.
   ===================================================== */

function isActive(path) {
  return route.path === path
}


/* =====================================================
   NAVIGATION FUNCTION
   ===================================================== */

function navigate(path) {
  if (route.path !== path) {
    router.push(path)
  }
}


/* =====================================================
   ONLINE / OFFLINE
   ===================================================== */

function updateOnline() {
  isOnline.value =
    window.navigator.onLine
}


/* =====================================================
   CLASS SELECTION SYNC
   ===================================================== */

function syncUser() {
  loadUser()
}


/* =====================================================
   LOGOUT
   ===================================================== */

function logout() {

  localStorage.removeItem(
    'learnpathUser'
  )

  localStorage.removeItem(
    'learnpath_user'
  )

  localStorage.removeItem(
    'learnpath_token'
  )

  localStorage.removeItem(
    'role'
  )

  localStorage.removeItem(
    'learnpath_class_selected'
  )

  router.push('/login')
}


/* =====================================================
   MOUNT
   ===================================================== */

onMounted(() => {

  window.addEventListener(
    'online',
    updateOnline
  )

  window.addEventListener(
    'offline',
    updateOnline
  )

  window.addEventListener(
    'storage',
    syncUser
  )

})


/* =====================================================
   UNMOUNT
   ===================================================== */

onBeforeUnmount(() => {

  window.removeEventListener(
    'online',
    updateOnline
  )

  window.removeEventListener(
    'offline',
    updateOnline
  )

  window.removeEventListener(
    'storage',
    syncUser
  )

})


/* =====================================================
   WATCH ROUTE
   ===================================================== */

watch(
  () => route.path,
  () => {
    loadUser()
  }
)

</script>


<template>

  <div class="app-shell">


    <!-- =================================================
         LEFT SIDEBAR

         IMPORTANT:
         Sidebar is hidden ONLY on Login.
         It will now appear on /teacher as well.
         ================================================= -->

    <aside
      v-if="route.path !== '/login'"
      class="sidebar"
    >

      <!-- ===============================================
           BRAND
           =============================================== -->

      <div class="brand">

        <div class="logo">
          LP
        </div>

        <div class="brand-text">

          <strong>
            LearnPath
          </strong>

          <small>
            Turning Signals to Actions
          </small>

        </div>

      </div>


      <!-- ===============================================
           ROLE LABEL
           =============================================== -->

      <div class="role-label">

        <template
          v-if="role === 'teacher'"
        >
          TEACHER
        </template>

        <template
          v-else-if="role === 'student'"
        >
          STUDENT
        </template>

        <template
          v-else-if="role === 'headteacher'"
        >
          HEAD TEACHER
        </template>

        <template
          v-else-if="role === 'official'"
        >
          EDUCATION OFFICIAL
        </template>

        <template v-else>
          {{ role.toUpperCase() }}
        </template>

      </div>


      <!-- ===============================================
           NAVIGATION
           =============================================== -->

      <nav class="navigation">

        <button
          v-for="item in currentNavigation"
          :key="item.path"
          class="nav-item"
          :class="{
            active: isActive(item.path)
          }"
          @click="navigate(item.path)"
        >

          {{ item.label }}

        </button>

      </nav>


      <!-- ===============================================
           SIDEBAR BOTTOM
           =============================================== -->

      <div class="sidebar-bottom">

        <div class="signed-in">

          <span>
            Signed in as
          </span>

          <strong>
            {{ userName }}
          </strong>

          <small
            v-if="role === 'teacher'"
          >
            Teacher · Class 3
          </small>

          <small
            v-else-if="role === 'student'"
          >
            Student · Class 3
          </small>

          <small
            v-else-if="role === 'headteacher'"
          >
            Head Teacher
          </small>

          <small
            v-else-if="role === 'official'"
          >
            Education Official
          </small>

        </div>


        <button
          class="logout"
          @click="logout"
        >
          Log out
        </button>

      </div>

    </aside>


    <!-- =================================================
         MAIN CONTENT
         ================================================= -->

    <main
      class="main-content"
      :class="{
        'login-content':
          route.path === '/login'
      }"
    >

      <!-- ===============================================
           OFFLINE NOTICE
           =============================================== -->

      <div
        v-if="
          route.path !== '/login' &&
          !isOnline
        "
        class="offline-notice"
      >
        Offline — core classroom workflow remains
        available; sync when connected.
      </div>


      <!-- ===============================================
           ROUTER CONTENT
           =============================================== -->

      <router-view />

    </main>

  </div>

</template>


<style scoped>

/* =====================================================
   RESET
   ===================================================== */

* {
  box-sizing: border-box;
}


/* =====================================================
   APP
   ===================================================== */

.app-shell {
  min-height: 100vh;
  width: 100%;
  background: #f5f8f6;
}


/* =====================================================
   SIDEBAR
   ===================================================== */

.sidebar {
  position: fixed;

  left: 0;
  top: 0;
  bottom: 0;

  width: 245px;

  background: #104d3d;

  color: #ffffff;

  display: flex;
  flex-direction: column;

  padding: 24px 16px 18px;

  z-index: 1000;
}


/* =====================================================
   BRAND
   ===================================================== */

.brand {
  display: flex;
  align-items: center;

  gap: 10px;

  padding: 0 8px;
}


.logo {
  width: 40px;
  height: 40px;

  border-radius: 11px;

  background: #c7ff24;

  color: #104d3d;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 15px;
  font-weight: 900;
}


.brand-text strong {
  display: block;

  font-size: 16px;

  line-height: 1.1;

  font-weight: 900;
}


.brand-text small {
  display: block;

  margin-top: 4px;

  color: #88aa9f;

  font-size: 8px;

  line-height: 1.2;
}


/* =====================================================
   ROLE
   ===================================================== */

.role-label {
  margin:

    30px 8px 12px;

  color: #86a79c;

  font-size: 10px;

  font-weight: 800;

  letter-spacing: .13em;
}


/* =====================================================
   NAVIGATION
   ===================================================== */

.navigation {
  display: flex;

  flex-direction: column;

  gap: 4px;
}


.nav-item {
  width: 100%;

  border: none;

  outline: none;

  background: transparent;

  color: #ffffff;

  text-align: left;

  padding: 12px 12px;

  border-radius: 8px;

  font-size: 12px;

  font-weight: 700;

  cursor: pointer;

  transition:
    background .15s ease,
    color .15s ease;
}


.nav-item:hover {
  background: rgba(
    255,
    255,
    255,
    .07
  );
}


.nav-item.active {
  background: #28765f;

  color: #ffffff;
}


/* =====================================================
   SIDEBAR BOTTOM
   ===================================================== */

.sidebar-bottom {
  margin-top: auto;

  padding-top: 18px;

  border-top: 1px solid
    rgba(
      255,
      255,
      255,
      .12
    );
}


.signed-in {
  display: flex;

  flex-direction: column;

  gap: 3px;

  margin-bottom: 18px;
}


.signed-in span {
  color: #87a89d;

  font-size: 9px;
}


.signed-in strong {
  color: #ffffff;

  font-size: 12px;

  font-weight: 800;
}


.signed-in small {
  color: #78988e;

  font-size: 9px;
}


.logout {
  border: none;

  background: transparent;

  color: #ffffff;

  font-size: 11px;

  font-weight: 800;

  cursor: pointer;

  padding: 0;

  text-align: left;
}


.logout:hover {
  color: #c7ff24;
}


/* =====================================================
   MAIN CONTENT

   This is the important fix.

   Sidebar = 245px
   Main content starts after sidebar.
   ===================================================== */

.main-content {
  min-height: 100vh;

  margin-left: 245px;

  width: calc(
    100% - 245px
  );

  padding: 0;

  overflow-x: hidden;
}


.login-content {
  margin-left: 0;

  width: 100%;
}


/* =====================================================
   OFFLINE NOTICE
   ===================================================== */

.offline-notice {
  margin: 12px 20px 0;

  padding: 9px 13px;

  border-radius: 8px;

  background: #fff5d8;

  border: 1px solid #ead79c;

  color: #715918;

  font-size: 10px;

  font-weight: 700;
}


/* =====================================================
   TABLET
   ===================================================== */

@media (max-width: 900px) {

  .sidebar {
    width: 220px;
  }

  .main-content {
    margin-left: 220px;

    width: calc(
      100% - 220px
    );
  }

}


/* =====================================================
   MOBILE
   ===================================================== */

@media (max-width: 650px) {

  .sidebar {
    position: relative;

    width: 100%;

    min-height: auto;

    padding: 16px;
  }


  .role-label {
    margin-top: 20px;
  }


  .navigation {
    flex-direction: row;

    flex-wrap: wrap;
  }


  .nav-item {
    width: auto;

    white-space: nowrap;
  }


  .sidebar-bottom {
    margin-top: 20px;
  }


  .main-content {
    margin-left: 0;

    width: 100%;
  }

}

</style>