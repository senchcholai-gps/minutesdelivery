"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Save } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import toast from "react-hot-toast"

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    free_delivery_threshold: 499,
    flat_rate: 25,
    enabled: true,
    acceptingOrders: true,
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings")
        if (res.ok) {
          const data = await res.json()
          setSettings(data)
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      })

      if (!res.ok) throw new Error("Failed to save settings")
      toast.success("Settings saved successfully")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
          <p className="text-sm text-gray-500">Configure global application preferences.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Global Delivery Settings (Recommended)</CardTitle>
          <CardDescription>Configure the primary delivery rules for all orders across the system.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <Label htmlFor="threshold" className="text-sm font-black text-gray-700 uppercase tracking-widest">Free Delivery Threshold (₹)</Label>
              <Input 
                id="threshold"
                type="number"
                value={settings.free_delivery_threshold}
                onChange={(e) => setSettings(s => ({ ...s, free_delivery_threshold: parseInt(e.target.value) || 0 }))}
                className="rounded-xl border-gray-200 h-11"
                placeholder="499"
              />
              <p className="text-xs text-primary font-bold italic">Free delivery applies when cart total reaches this threshold.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="flat_rate" className="text-sm font-black text-gray-700 uppercase tracking-widest">Standard Delivery Charge (₹)</Label>
              <Input 
                id="flat_rate"
                type="number"
                value={settings.flat_rate}
                onChange={(e) => setSettings(s => ({ ...s, flat_rate: parseInt(e.target.value) || 0 }))}
                className="rounded-xl border-gray-200 h-11"
                placeholder="25"
              />
              <p className="text-xs text-gray-400 font-bold italic">Delivery charge is applied per order, not per product.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`border-2 transition-all duration-500 ${settings.acceptingOrders ? 'border-green-100 bg-white' : 'border-red-100 bg-red-50/10'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Ordering Configuration
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${settings.acceptingOrders ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
                  {settings.acceptingOrders ? 'Accepting Orders' : 'Orders Disabled'}
                </span>
              </CardTitle>
              <CardDescription>Manage how the storefront handles customer orders.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
            <div className="space-y-1">
              <Label className="text-base font-black text-gray-900">Accept New Orders</Label>
              <p className="text-sm text-gray-500 font-medium italic">
                {settings.acceptingOrders 
                  ? "Customers can currently place new orders normally." 
                  : "Turn OFF to temporarily stop receiving new orders."}
              </p>
            </div>
            <Switch 
              checked={settings.acceptingOrders} 
              onCheckedChange={(val) => setSettings(s => ({ ...s, acceptingOrders: val }))}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-2xl px-10 h-12 font-black shadow-lg shadow-accent/20 bg-accent text-accent-foreground transition-all hover:scale-105 active:scale-95 gap-2"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Preferences
        </Button>
      </div>
    </div>
  )
}
