"use client"

import React, { useEffect, useState } from "react"
import { ListOrdered, Search, Filter, Loader2, AlertCircle, Eye, CheckCircle, Truck, XCircle, Clock, FileDown } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/SearchInput"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function AdminOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null)

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterOrderId, setFilterOrderId] = useState("")
  const [filterCustomer, setFilterCustomer] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterFromDate, setFilterFromDate] = useState("")
  const [filterToDate, setFilterToDate] = useState("")

  const fetchOrders = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (!silent) setIsLoading(false)
        return
      }

      const params = new URLSearchParams()
      if (filterOrderId) params.append("orderId", filterOrderId)
      if (filterCustomer) params.append("customer", filterCustomer)
      if (filterStatus && filterStatus !== "all") params.append("status", filterStatus)
      if (filterFromDate) params.append("dateFrom", filterFromDate)
      if (filterToDate) params.append("dateTo", filterToDate)

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${session?.access_token}`
        }
      })
      if (!res.ok) throw new Error("Failed to fetch orders")
      const data = await res.json()
      setOrders(data)
    } catch (error: any) {
      if (!silent) toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  // Capture latest fetchOrders state
  const fetchOrdersRef = React.useRef(fetchOrders)
  useEffect(() => { fetchOrdersRef.current = fetchOrders }, [fetchOrders])

  useEffect(() => {
    fetchOrdersRef.current(false)
    const intervalId = setInterval(() => fetchOrdersRef.current(true), 5000)
    return () => clearInterval(intervalId)
  }, [])

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/admin/order/update-status`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ orderId: id, status: newStatus }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to update status")
      }
      
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o))
      toast({
        title: "Status Updated",
        description: `Order #${id.slice(0, 8)} is now ${newStatus}`,
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const downloadPdf = async (orderId: string) => {
    setDownloadingPdfId(orderId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/orders/${orderId}/pdf`, {
        headers: { "Authorization": `Bearer ${session?.access_token}` }
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to generate PDF" }))
        throw new Error(err.error || "Failed to generate PDF")
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `order_${orderId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      toast({ variant: "destructive", title: "PDF Error", description: error.message })
    } finally {
      setDownloadingPdfId(null)
    }
  }

  const updatePaymentStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id + "-payment")
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/admin/order/update-payment`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ orderId: id, status: newStatus }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to update payment status")
      }
      
      setOrders(orders.map(o => o.id === id ? { ...o, payment_status: newStatus } : o))
      toast({
        title: "Payment Updated",
        description: `Payment for Order #${id.slice(0, 8)} marked as ${newStatus}`,
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":    return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none font-bold">🟡 Pending</Badge>
      case "processing": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold">🔵 Processing</Badge>
      case "picked_up":  return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none font-bold">🟠 Picked Up</Badge>
      case "on_the_way": return <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border-none font-bold">🚚 On The Way</Badge>
      case "delivered":  return <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none font-bold">🟢 Delivered</Badge>
      case "cancelled":  return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold">🔴 Cancelled</Badge>
      default: return <Badge variant="outline" className="font-bold">{status}</Badge>
    }
  }

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.user_profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Order Management</h2>
            <p className="text-sm text-gray-500">Track and fulfill customer orders.</p>
          </div>
        </div>

      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border shadow-sm flex-wrap">
        <div className="flex-1 min-w-[250px]">
          <SearchInput 
            placeholder="Search orders..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => {
              setSearchQuery("")
              setFilterOrderId("")
              setFilterCustomer("")
              setFilterStatus("all")
              setFilterFromDate("")
              setFilterToDate("")
              fetchOrders(false)
            }}
            className="w-full h-10 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-gray-100 italic font-medium h-10" onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <Filter className="h-4 w-4 text-gray-400" />
            Refine
          </Button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="bg-white p-4 rounded-xl border shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <Input placeholder="Order ID..." value={filterOrderId} onChange={e => setFilterOrderId(e.target.value)} />
          <Input placeholder="Customer Name..." value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} />
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">🟡 Pending</option>
            <option value="processing">🔵 Processing</option>
            <option value="picked_up">🟠 Picked Up</option>
            <option value="on_the_way">🚚 On The Way</option>
            <option value="delivered">🟢 Delivered</option>
            <option value="cancelled">🔴 Cancelled</option>
          </select>
          <Input type="date" placeholder="From Date" value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} />
          <Input type="date" placeholder="To Date" value={filterToDate} onChange={e => setFilterToDate(e.target.value)} />
          <div className="md:col-span-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setFilterOrderId(""); setFilterCustomer(""); setFilterStatus("all"); setFilterFromDate(""); setFilterToDate("");
            }}>Clear</Button>
            <Button onClick={() => fetchOrders(false)}>Apply Filters</Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b">
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                      <p className="mt-4 text-sm text-gray-400 italic">Fetching orders...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <AlertCircle className="h-12 w-12 opacity-10 mb-4" />
                      <p className="text-lg font-medium italic">No orders found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 leading-tight">#{order.id.slice(0,8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(order.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{order.customer_name || order.user_profiles?.full_name || "Guest User"}</span>
                        <span className="text-xs text-gray-500 italic">{order.phone || order.user_profiles?.phone || "No phone"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary flex flex-col gap-1 items-start h-full mt-4">
                      ₹{order.total}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <Badge variant="outline" className="w-fit bg-gray-50 font-bold tracking-widest text-[10px] uppercase text-gray-500">{order.payment_method || "COD"}</Badge>
                        <Select 
                          defaultValue={order.payment_status || "pending"} 
                          onValueChange={(val) => updatePaymentStatus(order.id, val)}
                          disabled={updatingId === order.id + "-payment"}
                        >
                          <SelectTrigger className={`w-[110px] h-7 text-xs border-2 shadow-sm font-bold ${order.payment_status === 'paid' ? 'border-primary text-primary' : 'border-yellow-200 text-yellow-600'}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-none shadow-xl rounded-xl">
                            <SelectItem value="pending" className="text-yellow-600 font-bold">Pending</SelectItem>
                            <SelectItem value="paid" className="text-primary font-bold">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Select 
                        value={order.status} 
                        onValueChange={(val) => updateStatus(order.id, val)}
                        disabled={updatingId === order.id}
                      >
                        <SelectTrigger className="w-[160px] border-none shadow-none focus:ring-0 p-0 h-auto bg-transparent">
                          {getStatusBadge(order.status)}
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                          <SelectItem value="pending"    className="text-yellow-600 font-bold">🟡 Pending</SelectItem>
                          <SelectItem value="processing" className="text-blue-600 font-bold">🔵 Processing</SelectItem>
                          <SelectItem value="picked_up"  className="text-orange-600 font-bold">🟠 Picked Up</SelectItem>
                          <SelectItem value="on_the_way" className="text-teal-600 font-bold">🚚 On The Way</SelectItem>
                          <SelectItem value="delivered"  className="text-primary font-bold">🟢 Delivered</SelectItem>
                          <SelectItem value="cancelled"  className="text-red-600 font-bold">🔴 Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Download PDF"
                        disabled={downloadingPdfId === order.id}
                        onClick={() => downloadPdf(order.id)}
                      >
                        {downloadingPdfId === order.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <FileDown className="h-4 w-4" />}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl rounded-2xl border-none shadow-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-bold tracking-tight">Order Details #{order.id.slice(0,8).toUpperCase()}</DialogTitle>
                            <DialogDescription className="text-gray-500 font-medium italic">
                              Complete breakdown of the requested items.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4 bg-gray-50 rounded-xl">
                              <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Customer Info</h4>
                                <p className="font-bold text-gray-900">{order.customer_name || order.user_profile?.full_name || "Guest"}</p>
                                <p className="text-sm text-gray-600">{order.phone || order.user_profile?.phone}</p>
                                <p className="text-xs text-gray-400">{order.user_profile?.email}</p>
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Delivery Address</h4>
                                {order.delivery_address ? (
                                  <p className="text-sm text-gray-600 italic leading-relaxed">{order.delivery_address}</p>
                                ) : (
                                  <div className="text-sm text-gray-600 leading-relaxed">
                                    <p>{order.user_profile?.address_line1 || "No address provided"}</p>
                                    {order.user_profile?.address_line2 && <p>{order.user_profile.address_line2}</p>}
                                    {(order.user_profile?.city || order.user_profile?.pincode) && (
                                      <p>{order.user_profile?.city} {order.user_profile?.pincode}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Payment Details</h4>
                                <p className="font-bold text-gray-900 uppercase">{order.payment_method || "COD"}</p>
                                <p className="text-sm text-gray-600">Status: <span className={order.payment_status === 'paid' ? 'text-primary font-bold' : 'text-yellow-600 font-bold'}>{order.payment_status?.toUpperCase() || "PENDING"}</span></p>
                                {order.transaction_id && (
                                  <p className="text-xs text-gray-500 mt-2 p-2 bg-white border border-gray-100 rounded-lg break-all">
                                    <span className="font-bold uppercase block mb-1">TXN ID:</span> {order.transaction_id}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Order Items</h4>
                              {order.order_items?.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between p-3 border-b border-gray-50 group hover:bg-gray-50 transition-colors rounded-lg">
                                  <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-muted rounded flex items-center justify-center font-bold text-gray-400">
                                      {item.quantity}x
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900 leading-tight">{item.products?.name || "Unknown Product"}</p>
                                      {item.products?.categories?.name && (
                                        <Badge variant="outline" className="text-[10px] mt-1 h-4 px-1 py-0">{item.products.categories.name}</Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-gray-500">{item.quantity} × ₹{item.unit_price}</p>
                                    <p className="font-bold text-gray-900">₹{item.total_price || (item.unit_price * item.quantity)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-between items-center p-4 bg-primary/5 rounded-xl">
                              <span className="font-bold text-gray-600">Total Paid</span>
                              <span className="text-2xl font-black text-primary tracking-tighter">₹{order.total}</span>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      </div>
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
