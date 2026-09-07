const API_BASE = '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  const text = await response.text()

  let data = {}

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(
        `Server returned an invalid response (${response.status})`
      )
    }
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      `Request failed with status ${response.status}`
    )
  }

  return data
}

export function get(path) {
  return request(path, {
    method: 'GET'
  })
}

export function post(path, body = {}) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export function put(path, body = {}) {
  return request(path, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

export function del(path) {
  return request(path, {
    method: 'DELETE'
  })
}

export default {
  get,
  post,
  put,
  del
}