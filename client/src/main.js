import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('./views/Login.vue') },
  { path: '/teacher', component: () => import('./views/Teacher.vue'), meta: { roles: ['teacher'] } },
  { path: '/dashboard', redirect: '/teacher' },
  { path: '/student', component: () => import('./views/Student.vue'), meta: { roles: ['student'] } },
  { path: '/student/activity', component: () => import('./views/Student.vue'), meta: { roles: ['student'] } },
  { path: '/student/progress', component: () => import('./views/Student.vue'), meta: { roles: ['student'] } },
  { path: '/head-teacher', component: () => import('./views/HeadTeacher.vue'), meta: { roles: ['headteacher'] } },
  { path: '/official', component: () => import('./views/Official.vue'), meta: { roles: ['official'] } },
  { path: '/assessment', component: () => import('./views/Assessment.vue'), meta: { roles: ['teacher'] } },
  { path: '/diagnose', component: () => import('./views/Interventions.vue'), meta: { roles: ['teacher'] } },
  { path: '/act', component: () => import('./views/Interventions.vue'), meta: { roles: ['teacher'] } },
  { path: '/reassess', component: () => import('./views/Reassess.vue'), meta: { roles: ['teacher'] } },
  { path: '/interventions', redirect: '/diagnose' },
  { path: '/analytics', component: () => import('./views/Analytics.vue'), meta: { roles: ['teacher', 'headteacher', 'official'] } },
  { path: '/governance', component: () => import('./views/Governance.vue'), meta: { roles: ['headteacher', 'official'] } }
]

const router = createRouter({ history: createWebHistory(), routes })

function user() {
  try { return JSON.parse(localStorage.getItem('learnpathUser') || 'null') } catch { return null }
}

function home(role) {
  if (role === 'teacher') return '/teacher'
  if (role === 'student') return '/student'
  if (role === 'headteacher') return '/head-teacher'
  if (role === 'official') return '/official'
  return '/login'
}

router.beforeEach(to => {
  const u = user()
  if (to.path === '/login') return u?.role ? home(u.role) : true
  if (!u?.role) return '/login'
  if (to.meta.roles && !to.meta.roles.includes(u.role)) return home(u.role)
  return true
})

createApp(App).use(router).mount('#app')
