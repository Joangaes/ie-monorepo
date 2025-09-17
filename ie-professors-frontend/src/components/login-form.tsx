"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const apiBase = process.env.NEXT_PUBLIC_PROFESSORS_API_SERVICE || ''
      const loginUrl = `${apiBase}/api/token/`
      
      // Debug log for URL construction to catch double-prefix issues
      console.log(`[login] POST ${loginUrl}`)
      
      const res = await fetch(
        loginUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      )

      // Debug log for response details
      console.log(`[login] status ${res.status}, content-type: ${res.headers.get('content-type')}`)
      
      // Check for redirect responses
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location')
        console.log(`[login] status ${res.status} ... ct= ${res.headers.get('content-type')} ... location= ${location}`)
      }

      if (!res.ok) {
        // Check if response is HTML instead of JSON
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('text/html')) {
          const htmlText = await res.text()
          const snippet = htmlText.substring(0, 100) + (htmlText.length > 100 ? '...' : '')
          console.log(`[login] NON-JSON RESPONSE { snippet: "${snippet}" }`)
          throw new Error(`Server returned HTML instead of JSON (status ${res.status})`)
        }
        
        let data
        try {
          data = await res.json()
        } catch (jsonError) {
          const responseText = await res.text()
          const snippet = responseText.substring(0, 100) + (responseText.length > 100 ? '...' : '')
          console.log(`[login] JSON PARSE ERROR - Response: { snippet: "${snippet}" }`)
          throw new Error(`Failed to parse error response as JSON (status ${res.status})`)
        }
        
        throw new Error(data.detail || "Login failed")
      }

      let tokenData
      try {
        tokenData = await res.json()
      } catch (jsonError) {
        const responseText = await res.text()
        const snippet = responseText.substring(0, 100) + (responseText.length > 100 ? '...' : '')
        console.log(`[login] SUCCESS JSON PARSE ERROR - Response: { snippet: "${snippet}" }`)
        throw new Error("Failed to parse successful login response as JSON")
      }

      const { access, refresh } = tokenData

      localStorage.setItem("access_token", access)
      localStorage.setItem("refresh_token", refresh)

      console.log(`[login] SUCCESS - tokens stored`)
      router.push("/dashboard")
    } catch (err: any) {
      console.log(`[login] ERROR: ${err.message}`)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your username below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_username"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 font-medium -mt-4">{error}</p>
              )}

              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
                <Button variant="outline" className="w-full" type="button">
                  Login with Google
                </Button>
              </div>
            </div>

            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
