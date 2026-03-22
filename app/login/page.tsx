"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  })

  const ensureProfile = async (name?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch("/api/profile", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.status === 404) {
        await fetch("/api/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ name: name || formData.email.split("@")[0] }),
        })
      }
    } catch (err) {
      console.error("Error ensuring profile:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (isLogin) {
      console.log("LOGIN CLICKED — email:", formData.email)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })
      console.log("LOGIN RESPONSE:", data, signInError)

      if (signInError) {
        setError(signInError.message)
      } else {
        await ensureProfile()
        try {
          if (data.user) {
            await supabase.from("user_profiles").update({ last_login: new Date().toISOString() }).eq("id", data.user.id);
          }
        } catch(e) { console.error("Could not record last_login", e)}

        window.location.href = "/"
      }
    } else {
      console.log("SIGNUP CLICKED — email:", formData.email)
      
      try {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.email, password: formData.password, name: formData.name })
        })
        const result = await res.json()

        if (!res.ok) {
          setError(result.error || "Failed to create account")
        } else {
          // Account created and auto-confirmed via API! Log them in instantly.
          const { data, error: autoLoginError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          })
          
          if (autoLoginError) {
             setError("Account created, but auto-login failed: " + autoLoginError.message)
          } else {
             await ensureProfile(formData.name)
             window.location.href = "/"
          }
        }
      } catch (e: any) {
        setError(e.message)
      }
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <section className="flex min-h-[calc(100vh-64px-200px)] items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-md">
            <div className="mb-8 text-center">
              <Link href="/">
                <Image
                  src="/images/logo.jpg"
                  alt="Minutes Delivery"
                  width={80}
                  height={80}
                  className="mx-auto rounded-xl"
                />
              </Link>
            </div>

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-primary">
                  {isLogin ? "Welcome Back" : "Create Account"}
                </CardTitle>
                <CardDescription>
                  {isLogin
                    ? "Sign in to your account to continue"
                    : "Sign up to start ordering fresh meat"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Google Login Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-50 mb-4"
                  onClick={async () => {
                    await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: {
                        redirectTo: typeof window !== "undefined" ? window.location.origin : "https://minutesdelivery.com"
                      }
                    })
                  }}
                >
                  <Image
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    width={20}
                    height={20}
                  />
                  Continue with Google
                </Button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-sm text-gray-500">OR</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <form onSubmit={handleSubmit}>
                  <FieldGroup>
                    {!isLogin && (
                      <Field>
                        <FieldLabel htmlFor="name">Full Name</FieldLabel>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </Field>
                    )}

                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                      />
                    </Field>

                    {error && (
                      <p className="text-sm font-semibold text-red-500 text-center mt-2">
                        {error}
                      </p>
                    )}

                    {/* Primary Login Button */}
                    <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground">
                      {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                    </Button>

                  </FieldGroup>
                </form>

                <div className="mt-6 text-center text-sm">
                  {isLogin ? (
                    <p className="text-muted-foreground">
                      {"Don't have an account? "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(false)
                          setError("")
                        }}
                        className="font-semibold text-primary hover:underline"
                      >
                        Sign up
                      </button>
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(true)
                          setError("")
                        }}
                        className="font-semibold text-primary hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
