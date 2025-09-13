// lib/api.ts

type ApiOptions = RequestInit & {
  headers?: Record<string, string>
}

// Get API base URL - empty string for same-origin requests
function getApiBase(): string {
  return process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE || ''
}

async function refreshToken(): Promise<string | null> {
  if (typeof window === "undefined") return null
  
  const refreshToken = localStorage.getItem("refresh_token")
  if (!refreshToken) return null

  try {
    const res = await fetch(
      `${getApiBase()}/api/token/refresh/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      }
    )

    if (!res.ok) throw new Error("Token refresh failed")

    const { access } = await res.json()
    localStorage.setItem("access_token", access)
    return access
  } catch (error) {
    console.error("Token refresh failed:", error)
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    return null
  }
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const token = localStorage.getItem("access_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleResponse<T>(res: Response, originalRequest?: () => Promise<Response>): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    
    // Special handling for 401 Unauthorized
    if (res.status === 401 && originalRequest) {
      console.log("Token expired, attempting refresh...")
      const newToken = await refreshToken()
      
      if (newToken) {
        console.log("Token refreshed successfully, retrying request...")
        // Retry the original request with new token
        const retryResponse = await originalRequest()
        return handleResponse<T>(retryResponse) // Recursive call without retry to avoid infinite loop
      } else {
        console.error("Token refresh failed - redirecting to login")
        // Clear invalid tokens and redirect
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          window.location.href = "/login"
        }
        throw new Error("Authentication required. Please log in again.")
      }
    }
    
    const message = errorBody.detail || res.statusText || "Request failed"
    throw new Error(message)
  }
  
  // Handle responses with no content (e.g., DELETE 204)
  const contentType = res.headers.get('content-type')
  if (res.status === 204 || !contentType || !contentType.includes('application/json')) {
    return null as T
  }
  
  return res.json()
}

// Generic GET
export async function apiGet<T>(url: string, options: ApiOptions = {}): Promise<T> {
  const makeRequest = () => fetch(url, {
    ...options,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
  })

  const res = await makeRequest()
  return handleResponse<T>(res, makeRequest)
}

// POST
export async function apiPost<T>(
  url: string,
  body: Record<string, any>,
  options: ApiOptions = {}
): Promise<T> {
  const makeRequest = () => fetch(url, {
    ...options,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
    body: JSON.stringify(body),
  })

  const res = await makeRequest()
  return handleResponse<T>(res, makeRequest)
}

// PATCH
export async function apiPatch<T>(
  url: string,
  body: Record<string, any>,
  options: ApiOptions = {}
): Promise<T> {
  const makeRequest = () => fetch(url, {
    ...options,
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
    body: JSON.stringify(body),
  })

  const res = await makeRequest()
  return handleResponse<T>(res, makeRequest)
}

// PUT
export async function apiPut<T>(
  url: string,
  body: Record<string, any>,
  options: ApiOptions = {}
): Promise<T> {
  const makeRequest = () => fetch(url, {
    ...options,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
    body: JSON.stringify(body),
  })

  const res = await makeRequest()
  return handleResponse<T>(res, makeRequest)
}

// DELETE
export async function apiDelete<T>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const makeRequest = () => fetch(url, {
    ...options,
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
  })

  const res = await makeRequest()
  return handleResponse<T>(res, makeRequest)
}