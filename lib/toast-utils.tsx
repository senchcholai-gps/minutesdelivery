import toast from "react-hot-toast"
import { ShoppingCart, ArrowRight } from "lucide-react"

interface ToastProps {
  productName: string
  quantity: number
  onViewCart: () => void
}

export const showAddedToCartToast = ({ productName, quantity, onViewCart }: ToastProps) => {
  toast.dismiss('add-to-cart') // Dismiss any existing ones to prevent stacking if desired, or let them stack
  
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-in fade-in slide-in-from-top-4" : "animate-out fade-out slide-out-to-top-2"
        } pointer-events-auto flex w-full max-w-md items-center gap-4 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/5 transition-all duration-300`}
      >
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShoppingCart className="h-6 w-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">
            {quantity > 1 ? `${quantity}x ` : ""}{productName}
          </p>
          <p className="text-xs font-medium text-gray-500 italic">
            Added to your delivery basket
          </p>
        </div>

        <button
          onClick={() => {
            toast.dismiss(t.id)
            onViewCart()
          }}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 flex-shrink-0"
        >
          View Cart
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    ),
    { 
      duration: 3500, 
      id: "add-to-cart",
      position: "top-center"
    }
  )
}
