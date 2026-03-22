"use client"

import Image from "next/image"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { useCartStore } from "@/lib/store"
import Link from "next/link"
import { cleanProductName } from "@/lib/utils"

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getCartSummary, clearCart, deliverySettings } = useCartStore()
  const { subtotal, deliveryCharge, total } = getCartSummary()

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Your Cart
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="rounded-full bg-muted p-6">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">Your cart is empty</p>
            <Link href="/products" onClick={closeCart}>
              <Button className="bg-primary text-primary-foreground">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto py-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-lg border bg-card p-3"
                  >
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-white">
                      <Image
                        src={item.image}
                        alt={cleanProductName(item.name)}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">{cleanProductName(item.name)}</h4>
                        <p className="text-sm text-muted-foreground">{item.variant_label}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary">
                          ₹{(item.unit_price || 0) * item.quantity}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Summary */}
            <div className="border-t pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="font-medium">
                    {deliveryCharge === 0 ? (
                      <span className="text-primary">FREE</span>
                    ) : (
                      `₹${deliveryCharge}`
                    )}
                  </span>
                </div>
                {deliverySettings.enabled && subtotal < deliverySettings.free_delivery_threshold && (
                  <p className="text-xs text-muted-foreground">
                    Add ₹{deliverySettings.free_delivery_threshold - subtotal} more for free delivery
                  </p>
                )}
                <div className="flex justify-between border-t pt-2 text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">₹{total}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Link href="/cart" onClick={closeCart}>
                  <Button className="w-full bg-primary text-primary-foreground">
                    Checkout
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearCart}
                >
                  Clear Cart
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
