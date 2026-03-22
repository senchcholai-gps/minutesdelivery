"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, User, Menu, X, LogOut, ShoppingBag, Shield, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/lib/store"
import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
]

export function Navbar() {
  const { items } = useCartStore()
  const { user, loading, isAdmin, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  // ── HEADER SEARCH STATE (independent, no shared state) ──
  const [searchOpen, setSearchOpen] = useState(false)
  const [headerQuery, setHeaderQuery] = useState("")
  const headerSearchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setIsScrolled(window.scrollY > 0)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (headerSearchRef.current && !headerSearchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const cartItemCount = items.reduce((total: number, item: any) => total + item.quantity, 0)

  // Display name: first part of email or "Account"
  const displayName = user?.email?.split("@")[0] ?? "Account"
  const avatarLetter = displayName[0]?.toUpperCase() ?? "A"

  return (
    <nav className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${isScrolled ? "shadow-md" : "border-b border-gray-100"}`}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/logo.jpg"
            alt="Minutes Delivery Logo"
            width={40}
            height={40}
            className="rounded-lg object-cover flex-shrink-0 h-10 w-10"
            priority
          />
          <span className="text-xl md:text-2xl font-black tracking-tight text-gray-900 uppercase leading-none">
            Minutes <span className="text-primary">Delivery</span>
          </span>
        </Link>


        {/* Center Nav Links (desktop) */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-8">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`relative text-sm font-semibold transition-colors pb-1 ${
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-700 hover:text-primary"
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 md:gap-4">

          {/* Auth — Desktop */}
          {!loading && (
            <div className="hidden sm:block">
              {user ? (
                <div ref={dropdownRef} className="relative">
                  
                  {/* Avatar */}
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold"
                  >
                    {user.email?.charAt(0).toUpperCase()}
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white shadow-xl rounded-2xl border border-gray-100 z-50 overflow-hidden">
                      
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Signed in as</p>
                        <p className="text-sm text-gray-700 font-bold truncate">{user.email}</p>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <User className="h-4 w-4" />
                        My Profile & Address
                      </Link>

                      <Link
                        href="/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors border-t border-gray-50"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        My Orders
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors border-t border-gray-100"
                        >
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}

                      <button
                        onClick={async () => {
                          setDropdownOpen(false)
                          await signOut()
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>

                    </div>
                  )}
                  
                </div>
              ) : (
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 font-semibold text-gray-700 hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-all rounded-lg border-gray-200"
                  >
                    <User className="h-4 w-4" />
                    Sign In / Sign Up
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Header Search Icon + Expandable Input (independent, no shared state) */}
          <div ref={headerSearchRef} className="relative flex items-center">
            {searchOpen ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const q = headerQuery.trim()
                  console.log("Header search triggered:", q)
                  if (!q) return
                  setSearchOpen(false)
                  setHeaderQuery("")
                  router.push(`/search?q=${encodeURIComponent(q)}`)
                }}
                className="flex items-center gap-2 bg-gray-50 border-2 border-primary/20 rounded-xl px-3 py-1.5 transition-all"
              >
                <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={headerQuery}
                  onChange={(e) => setHeaderQuery(e.target.value)}
                  placeholder="Search..."
                  autoFocus
                  className="w-36 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setHeaderQuery("") }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="hover:bg-primary/10 transition-all rounded-lg"
                title="Search products"
              >
                <Search className="h-5 w-5 text-gray-700 hover:text-primary transition-colors" />
              </Button>
            )}
          </div>

          {/* Cart */}
          <Link href="/cart">
            <Button
              variant="ghost"
              size="icon"
              className="relative group hover:bg-primary/10 transition-all rounded-lg"
            >
              <ShoppingCart className="h-6 w-6 text-gray-700 group-hover:text-primary transition-colors" />
              {mounted && cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>


      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 pt-2 flex flex-col gap-3">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`text-sm font-semibold py-2 border-b border-gray-50 transition-colors ${
                  isActive ? "text-primary" : "text-gray-700 hover:text-primary"
                }`}
              >
                {label}
              </Link>
            )
          })}

          {!loading && (
            user ? (
              <div className="flex flex-col gap-1 pt-1">
                <div className="flex items-center gap-3 px-1 py-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {avatarLetter}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                <div className={`grid gap-2 mt-2 ${isAdmin ? "grid-cols-3" : "grid-cols-2"}`}>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-primary/10 hover:text-primary transition-all border border-gray-100"
                  >
                    <User className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase">Profile</span>
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setMenuOpen(false)}
                    className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-primary/10 hover:text-primary transition-all border border-gray-100"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase">Orders</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20"
                    >
                      <Shield className="h-5 w-5" />
                      <span className="text-[10px] font-bold uppercase">Admin</span>
                    </Link>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => { setMenuOpen(false); signOut() }}
                  className="w-full flex items-center gap-2 font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-all rounded-lg mt-3"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2 font-semibold text-gray-700 hover:text-primary hover:bg-primary/10 transition-all rounded-lg mt-1"
                >
                  <User className="h-4 w-4" />
                  Sign In / Sign Up
                </Button>
              </Link>
            )
          )}
        </div>
      )}
    </nav>
  )
}
