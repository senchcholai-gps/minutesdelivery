"use client"

import { useEffect, useState } from "react"
import { Users, Search, Filter, Loader2, AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabaseClient"

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterName, setFilterName] = useState("")
  const [filterEmail, setFilterEmail] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterFromDate, setFilterFromDate] = useState("")
  const [filterToDate, setFilterToDate] = useState("")

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setIsLoading(false)
        return
      }

      const params = new URLSearchParams()
      if (filterName) params.append("name", filterName)
      if (filterEmail) params.append("email", filterEmail)
      if (filterStatus && filterStatus !== "all") params.append("status", filterStatus)
      if (filterFromDate) params.append("fromDate", filterFromDate)
      if (filterToDate) params.append("toDate", filterToDate)

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${session?.access_token}`
        }
      })
      if (!res.ok) throw new Error("Failed to fetch users")
      const data = await res.json()
      setUsers(data)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery)
  )

  const formatLastLogin = (dateString: string | null) => {
    if (!dateString) return "Never logged in"
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return "Just now"
    if (diffHours < 24) return `${diffHours} hours ago`
    return date.toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Active Users</h2>
          <p className="text-sm text-gray-500">View real-time login activity and registered profiles.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search users by name, email, or phone..." 
            className="pl-9 bg-gray-50 border-gray-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 border-gray-100 italic font-medium" onClick={() => setIsFilterOpen(!isFilterOpen)}>
          <Filter className="h-4 w-4 text-gray-400" />
          More Filters
        </Button>
      </div>

      {isFilterOpen && (
        <div className="bg-white p-4 rounded-xl border shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <Input placeholder="Name..." value={filterName} onChange={e => setFilterName(e.target.value)} />
          <Input placeholder="Email..." value={filterEmail} onChange={e => setFilterEmail(e.target.value)} />
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Input type="date" placeholder="From Date" value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} />
          <Input type="date" placeholder="To Date" value={filterToDate} onChange={e => setFilterToDate(e.target.value)} />
          <div className="md:col-span-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setFilterName(""); setFilterEmail(""); setFilterStatus("all"); setFilterFromDate(""); setFilterToDate("");
            }}>Clear</Button>
            <Button onClick={fetchUsers}>Apply Filters</Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b">
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                      <p className="mt-4 text-sm text-gray-400 italic">Syncing user data...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <AlertCircle className="h-12 w-12 opacity-10 mb-4" />
                      <p className="text-lg font-medium italic">No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{user.full_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5 max-w-[150px] truncate" title={user.id}>ID: {user.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      <p className="text-xs text-gray-500 italic">{user.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.role === 'admin' ? "default" : "secondary"} className={user.role === 'admin' ? "bg-purple-100 text-purple-700 hover:bg-purple-100" : ""}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="font-semibold text-gray-700">{formatLastLogin(user.last_sign_in_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
