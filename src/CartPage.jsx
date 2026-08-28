import { useState } from 'react'
import { formatPrice, parsePriceNumber } from './productUtils'
import {
  CartIcon,
  TrashIcon,
  SparklesIcon,
  TruckIcon,
  CheckCircleIcon,
  GiftIcon,
  TagIcon,
  MapPinIcon,
  CashIcon,
  MobileIcon,
  CreditCardIcon,
  UserIcon,
} from './Icons'

const VALID_COUPONS = {
  BLOOM10: { type: 'percent', value: 0.1, desc: '10% OFF Sitewide' },
  GLOSS20: { type: 'percent', value: 0.2, desc: '20% VIP Artisan Promo (Min. ৳2000)', minSpend: 2000 },
  FREESHIP: { type: 'shipping', value: 0, desc: '100% Free Shipping in BD' },
  WELCOME50: { type: 'flat', value: 50, desc: '৳50 Off First Order' },
}

const SHIPPING_RATES = {
  dhaka: { name: 'Inside Dhaka Delivery (1-2 Days)', price: 60 },
  outside: { name: 'Outside Dhaka Courier (2-4 Days)', price: 120 },
  express: { name: 'VIP Same-Day Express (Dhaka)', price: 150 },
}

function generateOrderId() {
  return `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`
}

export function CartPage({
  cartItems = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onContinueShopping,
  onAddToCart,
  productList = [],
  customerProfile,
  onUpdateCustomerProfile,
  onNavigateToProfile,
  onOrderPlaced,
}) {
  const [shippingMethod, setShippingMethod] = useState('dhaka')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [giftNote, setGiftNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderComplete, setOrderComplete] = useState(null)

  // Customer Checkout Form fields
  const [checkoutForm, setCheckoutForm] = useState({
    name: customerProfile?.name || '',
    email: customerProfile?.email || '',
    phone: customerProfile?.phone || '',
    address: customerProfile?.address || '',
    city: customerProfile?.city || 'Dhaka',
    notes: (customerProfile?.notes || '').replace(/[^\w\s.,!'-]/g, '').trim(),
  })

  // Cart financial calculations
  const subtotal = cartItems.reduce((sum, item) => {
    const unitPrice = parsePriceNumber(item.price)
    return sum + unitPrice * (item.quantity || 1)
  }, 0)

  let discountAmount = 0
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      discountAmount = Math.round(subtotal * appliedCoupon.value)
    } else if (appliedCoupon.type === 'flat') {
      discountAmount = Math.min(appliedCoupon.value, subtotal)
    }
  }

  const baseShipping = SHIPPING_RATES[shippingMethod]?.price || 60
  const shippingAmount = appliedCoupon?.type === 'shipping' ? 0 : baseShipping
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingAmount)
  const estimatedPoints = Math.floor(grandTotal / 10)

  const handleApplyCoupon = (e) => {
    e.preventDefault()
    setCouponError('')
    const cleanCode = couponCode.trim().toUpperCase()

    if (!cleanCode) {
      setCouponError('Please enter a promo code')
      return
    }

    const matched = VALID_COUPONS[cleanCode]
    if (!matched) {
      setCouponError('Invalid coupon code. Try BLOOM10 or FREESHIP')
      return
    }

    if (matched.minSpend && subtotal < matched.minSpend) {
      setCouponError(`Minimum subtotal of ৳${matched.minSpend} required for ${cleanCode}`)
      return
    }

    setAppliedCoupon({ code: cleanCode, ...matched })
    setCouponCode('')
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponError('')
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setCheckoutForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (cartItems.length === 0) return

    if (!checkoutForm.name.trim() || !checkoutForm.phone.trim() || !checkoutForm.address.trim()) {
      alert('Please fill out all required delivery fields (Name, Phone, and Address).')
      return
    }

    setIsPlacingOrder(true)

    const newOrderId = generateOrderId()
    const orderData = {
      id: newOrderId,
      createdAt: new Date().toISOString(),
      status: 'Confirmed',
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        image: item.image,
      })),
      pricing: {
        subtotal,
        discount: discountAmount,
        shipping: shippingAmount,
        grandTotal,
        pointsEarned: estimatedPoints,
        couponUsed: appliedCoupon ? appliedCoupon.code : null,
      },
      customer: {
        name: checkoutForm.name.trim(),
        email: checkoutForm.email.trim(),
        phone: checkoutForm.phone.trim(),
        address: checkoutForm.address.trim(),
        city: checkoutForm.city.trim(),
        notes: checkoutForm.notes?.trim() || '',
      },
      giftNote: giftNote.trim(),
      shippingMethod: SHIPPING_RATES[shippingMethod]?.name || shippingMethod,
      paymentMethod,
    }

    // Save order to backend
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })
    } catch (err) {
      console.error('Failed to sync order to server:', err)
    }

    // Update customer loyalty points and profile in backend
    const updatedProfile = {
      ...customerProfile,
      name: checkoutForm.name.trim(),
      email: checkoutForm.email.trim() || customerProfile?.email,
      phone: checkoutForm.phone.trim() || customerProfile?.phone,
      address: checkoutForm.address.trim() || customerProfile?.address,
      city: checkoutForm.city.trim() || customerProfile?.city,
      notes: checkoutForm.notes?.trim() || customerProfile?.notes || '',
      loyaltyPoints: (customerProfile?.loyaltyPoints || 0) + estimatedPoints,
      totalOrders: (customerProfile?.totalOrders || 0) + 1,
      totalSpent: (customerProfile?.totalSpent || 0) + grandTotal,
      lastOrderAt: new Date().toISOString(),
    }

    onUpdateCustomerProfile(updatedProfile)

    if (updatedProfile.email) {
      try {
        await fetch(`/api/customers/${encodeURIComponent(updatedProfile.email.toLowerCase())}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProfile),
        })
      } catch (err) {
        console.error('Failed to sync profile to server:', err)
      }
    }

    if (onOrderPlaced) {
      onOrderPlaced(orderData)
    }

    onClearCart()
    setIsPlacingOrder(false)
    setOrderComplete(orderData)
  }

  // If order was placed successfully, display receipt
  if (orderComplete) {
    return (
      <div className="cart-page-container">
        <div className="order-success-card">
          <div className="order-success-icon">
            <CheckCircleIcon size={58} color="#27ae60" />
          </div>
          <h2>Thank You for Supporting Handcrafted Art!</h2>
          <p className="order-success-subtitle">
            Your resin piece order has been received and confirmed with Bloom & Gloss.
          </p>

          <div className="order-summary-pill-box">
            <div className="summary-pill">
              <span>Order Number</span>
              <strong>#{orderComplete.id}</strong>
            </div>
            <div className="summary-pill">
              <span>Grand Total</span>
              <strong>৳{orderComplete.pricing.grandTotal.toLocaleString('en-IN')}</strong>
            </div>
            <div className="summary-pill">
              <span>Bloom Points Earned</span>
              <strong>+{orderComplete.pricing.pointsEarned} Pts</strong>
            </div>
            <div className="summary-pill">
              <span>Estimated Delivery</span>
              <strong>1-3 Business Days</strong>
            </div>
          </div>

          <div className="order-details-box">
            <h3>Delivery Details</h3>
            <p>
              <strong>Recipient:</strong> {orderComplete.customer.name} ({orderComplete.customer.phone})
            </p>
            <p>
              <strong>Address:</strong> {orderComplete.customer.address}, {orderComplete.customer.city}
            </p>
            <p>
              <strong>Payment:</strong> {orderComplete.paymentMethod.toUpperCase()} (Pending on delivery)
            </p>
            {orderComplete.giftNote && (
              <p className="gift-note-preview">
                <GiftIcon size={14} color="#8b3ec4" /> <strong>Gift Note:</strong> "{orderComplete.giftNote}"
              </p>
            )}
          </div>

          <div className="order-success-actions">
            <button
              type="button"
              className="button primary"
              onClick={onNavigateToProfile}
            >
              <UserIcon size={16} color="#fff" /> View My Profile & Points
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={onContinueShopping}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page-container">
      {/* Top Header / Breadcrumbs */}
      <div className="cart-top-bar">
        <button
          type="button"
          className="back-link-btn"
          onClick={onContinueShopping}
        >
          ← Continue Shopping
        </button>

        <button
          type="button"
          className="profile-link-pill"
          onClick={onNavigateToProfile}
        >
          <UserIcon size={16} /> {customerProfile?.name || 'My Profile'}
          <span className="points-chip"><SparklesIcon size={12} color="#8b3ec4" /> {customerProfile?.loyaltyPoints || 0} Pts</span>
        </button>
      </div>

      <div className="cart-page-heading">
        <h1>Your Shopping Cart</h1>
        <p>Review your artisan resin selections and complete your delivery details.</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart-card">
          <div className="empty-cart-icon">
            <CartIcon size={54} color="#8b3ec4" />
          </div>
          <h2>Your Cart is Currently Empty</h2>
          <p>Explore our bespoke collection of handcrafted trays, mirrors, frames, and resin jewelry.</p>
          <button
            type="button"
            className="button primary"
            onClick={onContinueShopping}
          >
            <SparklesIcon size={16} color="#fff" /> Discover Signature Collection
          </button>
        </div>
      ) : (
        <div className="cart-layout-grid">
          {/* Left Column: Cart Items List */}
          <div className="cart-items-column">
            <div className="cart-items-card">
              <div className="cart-items-header">
                <h2>Items in Bag ({cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0)})</h2>
                <button
                  type="button"
                  className="clear-cart-text-btn"
                  onClick={onClearCart}
                >
                  <TrashIcon size={14} /> Clear all
                </button>
              </div>

              <div className="cart-items-list">
                {cartItems.map((item) => {
                  const qty = item.quantity || 1
                  const unitPrice = parsePriceNumber(item.price)
                  const itemSubtotal = unitPrice * qty

                  return (
                    <div className="cart-item-row" key={item.id}>
                      <img
                        src={item.image}
                        alt={item.name}
                        className="cart-item-thumb"
                      />

                      <div className="cart-item-info">
                        <h3>{item.name}</h3>
                        <p className="cart-item-category">{item.category || 'Handcrafted Resin Art'}</p>
                        <span className="cart-item-price">{formatPrice(item.price)} each</span>
                      </div>

                      <div className="cart-item-quantity-controls">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => onUpdateQuantity(item.id, qty - 1)}
                          title="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="qty-number">{qty}</span>
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => onUpdateQuantity(item.id, qty + 1)}
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="cart-item-subtotal">
                        <strong>৳{itemSubtotal.toLocaleString('en-IN')}</strong>
                        <button
                          type="button"
                          className="item-remove-btn"
                          onClick={() => onRemoveItem(item.id)}
                          title="Remove item"
                        >
                          <TrashIcon size={15} color="#e74c3c" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Complimentary Gift Message Box */}
              <div className="gift-message-box">
                <label htmlFor="cart-gift-note">
                  <GiftIcon size={16} color="#8b3ec4" /> Complimentary Hand-Written Gift Card Message
                </label>
                <textarea
                  id="cart-gift-note"
                  rows="2"
                  placeholder="Add a heartfelt note to be handwritten on premium gold-foil cardstock (optional)..."
                  value={giftNote}
                  onChange={(e) => setGiftNote(e.target.value)}
                />
              </div>
            </div>

            {/* Recommendations / Upsell */}
            {productList.length > 0 && (
              <div className="mini-recommendations-card">
                <h3><SparklesIcon size={16} color="#8b3ec4" /> Pair with Other Resin Treasures</h3>
                <div className="mini-recommendations-grid">
                  {productList.slice(0, 3).map((prod) => (
                    <div className="mini-rec-item" key={prod.id}>
                      <img src={prod.image} alt={prod.name} />
                      <div className="mini-rec-info">
                        <strong>{prod.name}</strong>
                        <span>{formatPrice(prod.price)}</span>
                      </div>
                      <button
                        type="button"
                        className="mini-add-btn"
                        onClick={() => onAddToCart(prod)}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Checkout & Order Summary Card */}
          <div className="cart-summary-column">
            <div className="checkout-summary-card">
              <h2>Order Summary</h2>

              {/* Promo Code Input */}
              <form onSubmit={handleApplyCoupon} className="coupon-form">
                <div className="coupon-input-group">
                  <span className="coupon-icon"><TagIcon size={16} /></span>
                  <input
                    type="text"
                    placeholder="Promo Code (e.g. BLOOM10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button type="submit" className="coupon-apply-btn">
                    Apply
                  </button>
                </div>
                {couponError && <p className="coupon-error-text">{couponError}</p>}
                {appliedCoupon && (
                  <div className="applied-coupon-pill">
                    <span>
                      <CheckCircleIcon size={14} color="#27ae60" /> {appliedCoupon.code} applied ({appliedCoupon.desc})
                    </span>
                    <button type="button" onClick={handleRemoveCoupon}>×</button>
                  </div>
                )}
              </form>

              {/* Price Breakdown */}
              <div className="summary-breakdown">
                <div className="breakdown-row">
                  <span>Subtotal</span>
                  <span>৳{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {appliedCoupon && discountAmount > 0 && (
                  <div className="breakdown-row discount-row">
                    <span>Voucher Discount</span>
                    <span>-৳{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="breakdown-row">
                  <span>Shipping</span>
                  <span>{shippingAmount === 0 ? 'FREE' : `৳${shippingAmount}`}</span>
                </div>

                <div className="breakdown-total-row">
                  <span>Total Amount</span>
                  <strong>৳{grandTotal.toLocaleString('en-IN')}</strong>
                </div>

                <div className="loyalty-reward-notice">
                  <SparklesIcon size={14} color="#8b3ec4" /> Earn <strong>+{estimatedPoints} Bloom Points</strong> on this order!
                </div>
              </div>

              {/* Delivery Destination & Shipping Options */}
              <div className="checkout-form-section">
                <h3><TruckIcon size={16} color="#8b3ec4" /> Delivery & Shipping Option</h3>

                <div className="shipping-radio-group">
                  {Object.entries(SHIPPING_RATES).map(([key, rate]) => (
                    <label
                      key={key}
                      className={`shipping-option-label ${shippingMethod === key ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={key}
                        checked={shippingMethod === key}
                        onChange={() => setShippingMethod(key)}
                      />
                      <div className="shipping-text">
                        <strong>{rate.name}</strong>
                        <span>{rate.price === 0 ? 'Free' : `৳${rate.price}`}</span>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Customer Details Form */}
                <h3 style={{ marginTop: '20px' }}>
                  <MapPinIcon size={16} color="#8b3ec4" /> Shipping Address
                </h3>

                <form onSubmit={handlePlaceOrder} className="customer-delivery-form">
                  <div className="form-group">
                    <label htmlFor="checkout-name">Full Name *</label>
                    <input
                      id="checkout-name"
                      name="name"
                      type="text"
                      required
                      placeholder="Receiver's name"
                      value={checkoutForm.name}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="checkout-phone">Phone Number *</label>
                      <input
                        id="checkout-phone"
                        name="phone"
                        type="tel"
                        required
                        placeholder="+880 17..."
                        value={checkoutForm.phone}
                        onChange={handleFormChange}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="checkout-email">Email (Optional)</label>
                      <input
                        id="checkout-email"
                        name="email"
                        type="email"
                        placeholder="For order receipt"
                        value={checkoutForm.email}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="checkout-address">Delivery Address *</label>
                    <textarea
                      id="checkout-address"
                      name="address"
                      rows="2"
                      required
                      placeholder="House No, Road No, Area, Landmark..."
                      value={checkoutForm.address}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="checkout-city">City / District *</label>
                    <input
                      id="checkout-city"
                      name="city"
                      type="text"
                      required
                      placeholder="e.g. Dhaka North, Dhanmondi, Chittagong..."
                      value={checkoutForm.city}
                      onChange={handleFormChange}
                    />
                  </div>

                  {/* Payment Method Selector */}
                  <h3 style={{ marginTop: '16px' }}>Payment Method</h3>
                  <div className="payment-options-grid">
                    <label className={`payment-pill ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                      />
                      <CashIcon size={16} /> Cash on Delivery
                    </label>

                    <label className={`payment-pill ${paymentMethod === 'bkash' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bkash"
                        checked={paymentMethod === 'bkash'}
                        onChange={() => setPaymentMethod('bkash')}
                      />
                      <MobileIcon size={16} /> bKash / Nagad
                    </label>

                    <label className={`payment-pill ${paymentMethod === 'card' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                      />
                      <CreditCardIcon size={16} /> Online Card
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="button primary checkout-submit-btn"
                    disabled={isPlacingOrder}
                  >
                    {isPlacingOrder ? 'Confirming Order...' : `Confirm Order • ৳${grandTotal.toLocaleString('en-IN')}`}
                  </button>

                  <p className="secure-checkout-notice">
                    🔒 100% Secure Checkout • Handcrafted with love in Bangladesh
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
