"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import toast from "react-hot-toast"
import { 
  Loader2, User, MapPin, Phone, Save, Edit2, X, Mail, 
  MapPinned, CreditCard, ChevronRight, Hash
} from "lucide-react"

interface Profile {
  full_name?: string
  phone?: string
  address_line1?: string
  address_line2?: string
  city?: string
  district?: string
  state?: string
  pincode?: string
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile>({})
  const [isFetching, setIsFetching] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push("/login?redirect=/profile")
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    async function fetchProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setIsFetching(false); return }
      try {
        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setProfile(data ?? {})
          // Auto-edit if profile is empty or missing full_name
          if (!data || !data.full_name) {
            setIsEditing(true)
          } else {
            setIsEditing(false)
          }
        } else {
          setIsEditing(true) // First time user
        }
      } catch {
        setIsEditing(true)
      }
      setIsFetching(false)
    }
    fetchProfile()
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error("Not authenticated")

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save")
      
      toast.success("Profile updated successfully! ✅")
      setIsEditing(false) // Switch back to summary view
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || isFetching) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <Footer />
      </main>
    )
  }

  if (!user) return null

  const inputClass = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
  
  const labelClass = "block text-sm font-bold text-gray-600 mb-1.5 flex items-center gap-1.5"

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 pt-10 pb-20">

        {/* Header Section */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-white text-3xl font-black shadow-xl shrink-0">
              {user.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">My Profile</h1>
              <p className="text-gray-500 font-medium italic flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </p>
            </div>
          </div>
          
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-gray-100 px-6 py-3 text-sm font-black text-gray-700 shadow-sm transition hover:border-primary/50 hover:text-primary hover:bg-primary/5"
            >
              <Edit2 className="h-4 w-4" /> Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          /* ================= EDIT MODE (FORM) ================= */
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Personal Info Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
              <div className="flex items-center gap-2 pb-2">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-black text-gray-900">Personal Details</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input name="full_name" type="text" value={profile.full_name ?? ""} onChange={handleChange}
                    placeholder="Your full name" className={inputClass} required />
                </div>

                <div>
                  <label className={labelClass}>
                    <Phone className="h-3.5 w-3.5" /> Phone Number
                  </label>
                  <input name="phone" type="tel" value={profile.phone ?? ""} onChange={handleChange}
                    placeholder="+91 93637 37641" className={inputClass} required />
                </div>
              </div>
            </div>

            {/* Address Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
              <div className="flex items-center gap-2 pb-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-black text-gray-900">Delivery Address</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Address Line 1</label>
                  <input name="address_line1" type="text" value={profile.address_line1 ?? ""} onChange={handleChange}
                    placeholder="House no, Street, Area" className={inputClass} required />
                </div>

                <div>
                  <label className={labelClass}>
                    Address Line 2 <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input name="address_line2" type="text" value={profile.address_line2 ?? ""} onChange={handleChange}
                    placeholder="Landmark, Apartment" className={inputClass} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>City</label>
                    <input name="city" type="text" value={profile.city ?? ""} onChange={handleChange}
                      placeholder="Udumalpet" className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>District</label>
                    <input name="district" type="text" value={profile.district ?? ""} onChange={handleChange}
                      placeholder="Chennai District" className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>State</label>
                    <input name="state" type="text" value={profile.state ?? ""} onChange={handleChange}
                      placeholder="Tamil Nadu" className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Pincode</label>
                    <input name="pincode" type="text" value={profile.pincode ?? ""} onChange={handleChange}
                      placeholder="642154" maxLength={6} className={inputClass} required />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-primary py-4 text-white text-lg font-black shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving
                  ? <><Loader2 className="h-5 w-5 animate-spin" /> Saving...</>
                  : <><Save className="h-5 w-5" /> Save Changes</>
                }
              </button>
              
              {/* Only show cancel if we already have some data */}
              {profile.full_name && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-2xl border-2 border-gray-200 bg-white px-8 py-4 font-black text-gray-600 transition hover:bg-gray-50 hover:border-gray-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          /* ================= SUMMARY VIEW ================= */
          <div className="space-y-6">
            
            {/* Contact Overview Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
                  <p className="text-lg font-bold text-gray-900">{profile.full_name}</p>
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                  <p className="text-lg font-bold text-gray-900">{profile.phone || "Not provided"}</p>
                </div>
              </div>
            </div>

            {/* Address Overview Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <MapPinned className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-black text-gray-900">Default Address</h2>
              </div>
              
              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 overflow-hidden relative group">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <MapPin className="h-20 w-20 text-primary" />
                </div>
                
                <div className="space-y-4 relative z-10">
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-gray-900">{profile.address_line1}</p>
                    {profile.address_line2 && <p className="text-gray-600 font-medium">{profile.address_line2}</p>}
                    <p className="text-gray-600 font-medium">
                      {profile.city}, {profile.district && `${profile.district}, `}{profile.state} - {profile.pincode}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest bg-primary/10 w-fit px-3 py-1 rounded-full">
                    Primary Delivery Location
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-4">
               <div className="flex items-center justify-between py-2">
                 <div className="flex items-center gap-3">
                   <div className="bg-gray-100 p-2 rounded-lg text-gray-400">
                     <Mail className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Account Email</p>
                     <p className="text-sm font-bold text-gray-900">{user.email}</p>
                   </div>
                 </div>
                 <div className="text-primary bg-primary/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Verified</div>
               </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
