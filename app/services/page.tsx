import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Truck, Scissors, ShieldCheck, Snowflake, Package, Tag } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

const services = [
  {
    icon: Clock,
    title: "60-Minute Express Delivery",
    description: "Get your fresh meat and fish delivered to your doorstep in just 60 minutes. Our efficient delivery network ensures your order arrives hot and fresh.",
    badge: "Popular",
  },
  {
    icon: Tag,
    title: "10% off on first order",
    description: "Get started with us and enjoy a 10% discount on your very first order! Fresh cuts, perfect portions, and flavors made just for you.",
    badge: null,
  },
  {
    icon: Snowflake,
    title: "Fresh & Chilled",
    description: "All our products are stored at optimal temperatures to ensure maximum freshness. Never frozen, always fresh.",
    badge: null,
  },
  {
    icon: Package,
    title: "Marination Service",
    description: "Choose from our range of pre-marinated options or request custom marination with your favorite spices and flavors.",
    badge: "New",
  },
  {
    icon: ShieldCheck,
    title: "Quality Assurance",
    description: "Every piece of meat goes through strict quality checks. We source only from trusted farms and fisheries.",
    badge: null,
  },
  {
    icon: Truck,
    title: "Free Delivery",
    description: "Enjoy free delivery on all orders above ₹499. No hidden charges, no surprise fees.",
    badge: null,
  },
]

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-primary py-12 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold">Our Services</h1>
          <p className="mt-2 text-primary-foreground/80">
            Everything we do to make your experience better
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.title} className="relative transition-all hover:shadow-lg">
                {service.badge && (
                  <Badge className="absolute right-4 top-4 bg-accent text-accent-foreground">
                    {service.badge}
                  </Badge>
                )}
                <CardHeader>
                  <service.icon className="mb-2 h-10 w-10 text-primary" />
                  <CardTitle className="text-primary">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center text-3xl font-bold text-foreground">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { step: "1", title: "Browse", desc: "Choose from our wide range of fresh products" },
              { step: "2", title: "Select Product", desc: "Select your favorite products easily" },
              { step: "3", title: "Order", desc: "Place your order with secure payment" },
              { step: "4", title: "Enjoy", desc: "Get it delivered in 60 minutes" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
