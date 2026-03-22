"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Facebook, Twitter, Instagram, Youtube, Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  const [links, setLinks] = useState({
    facebook: "https://www.facebook.com/share/16qvqvN8DL/",
    instagram: "https://www.instagram.com/minutesdeliveryudt?igsh=MWEybXdjanFkNHd2Mw==",
    whatsapp: "https://wa.me/919363737641"
  })

  useEffect(() => {
    fetch("/api/config/social-links")
      .then(res => res.json())
      .then(data => setLinks(data))
      .catch(err => console.error("Error fetching social links:", err))
  }, [])

  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">

          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-black tracking-tight text-white uppercase">
              Minutes <span className="text-primary">Delivery</span>
            </h3>
            <p className="text-gray-400 leading-relaxed text-sm">
              Premium quality chicken, fish, and meat — freshly cut and delivered straight to your doorstep in minutes.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a 
                href={links.facebook} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-primary transition-all duration-300 hover:scale-110" 
                title="Facebook"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href={links.instagram} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-primary transition-all duration-300 hover:scale-110" 
                title="Instagram"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href={links.whatsapp} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-primary transition-all duration-300 hover:scale-110" 
                title="WhatsApp"
                aria-label="WhatsApp"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.445L0 24l6.835-1.793a11.85 11.85 0 005.637 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-widest">Quick Links</h4>
            <div className="flex flex-col gap-3">
              {[
                { href: "/", label: "Home" },
                { href: "/products", label: "Products" },
                { href: "/services", label: "Services" },
                { href: "/contact", label: "Contact" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-gray-400 hover:text-primary transition-colors text-sm font-medium"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-widest">Contact Us</h4>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 text-sm text-gray-400">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>5/149/3, Kuralkuttai Pirivu<br />Dhali Road, Udumalpet - 642154</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span>+91 93637 37641</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <a href="mailto:minutesdeliverysm@gmail.com" className="hover:text-primary transition-colors">
                  minutesdeliverysm@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Minutes Delivery. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
