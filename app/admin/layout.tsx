"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { SidebarIcon, LayoutDashboard, ShoppingBag, ListOrdered, Users, Settings, LogOut, Loader2, ChevronRight, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { isAdmin } from "@/lib/adminCheck"
import { supabase } from "@/lib/supabaseClient"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkAccess() {
      const admin = await isAdmin()
      if (!admin) {
        router.push("/")
      } else {
        setIsAuthorized(true)
      }
    }
    checkAccess()
  }, [router])

  if (isAuthorized === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-50 overflow-y-auto">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-xl text-primary">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              M
            </div>
            <span>Admin Panel</span>
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          <p className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</p>
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group">
            <LayoutDashboard className="h-5 w-5 text-gray-400 group-hover:text-primary" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/admin/revenue" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group">
            <DollarSign className="h-5 w-5 text-gray-400 group-hover:text-primary" />
            <span className="font-medium">Revenue</span>
          </Link>
          
          <p className="px-2 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Inventory</p>
          <Link href="/admin/products" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group">
            <ShoppingBag className="h-5 w-5 text-gray-400 group-hover:text-primary" />
            <span className="font-medium">Products</span>
            <ChevronRight className="ml-auto h-4 w-4 text-gray-300 group-hover:text-gray-400" />
          </Link>
          
          <p className="px-2 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Orders</p>
          <Link href="/admin/orders" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group">
            <ListOrdered className="h-5 w-5 text-gray-400 group-hover:text-primary" />
            <span className="font-medium">Orders</span>
            <ChevronRight className="ml-auto h-4 w-4 text-gray-300 group-hover:text-gray-400" />
          </Link>

          <p className="px-2 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">System</p>
          <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group">
            <Users className="h-5 w-5 text-gray-400 group-hover:text-primary" />
            <span className="font-medium">Active Users</span>
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group">
            <Settings className="h-5 w-5 text-gray-400 group-hover:text-primary" />
            <span className="font-medium">Settings</span>
          </Link>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t">
          <Button variant="ghost" className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border shadow-sm">
              <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-600 italic">System Online</span>
            </div>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  )
}
