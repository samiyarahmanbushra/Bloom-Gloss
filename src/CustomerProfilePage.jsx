import { useState } from 'react'
import { formatPrice } from './productUtils'
import {
  CartIcon,
  UserIcon,
  PackageIcon,
  GiftIcon,
  SparklesIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CreditCardIcon,
  LeafIcon,
  AwardIcon,
  CheckCircleIcon,
  ClockIcon,
} from './Icons'

export function CustomerProfilePage({
  customerProfile,
  onUpdateCustomerProfile,
  orders = [],
  onBackToShopping,
  onNavigateToCart,
  cartCount,
}) {
  const [activeTab, setActiveTab] = useState('profile')
  const [copiedCode, setCopiedCode] = useState('')
  const [profileForm, setProfileForm] = useState({
    name: customerProfile?.name || '',
    email: customerProfile?.email || '',
    phone: customerProfile?.phone || '',
    address: customerProfile?.address || '',
    city: customerProfile?.city || 'Dhaka',
    notes: (customerProfile?.notes || '').replace(/[^\w\s.,!'-]/g, '').trim(),
  })
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaveSuccess(false)

    const updatedProfile = {
      ...customerProfile,
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim(),
      address: profileForm.address.trim(),
      city: profileForm.city.trim(),
      notes: profileForm.notes?.trim() || '',
      updatedAt: new Date().toISOString(),
    }

    onUpdateCustomerProfile(updatedProfile)

    // Save to backend if email exists
    if (profileForm.email) {
      try {
        await fetch(`/api/customers/${encodeURIComponent(profileForm.email.toLowerCase())}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProfile),
        })
      } catch (err) {
        console.error('Error saving customer to backend:', err)
      }
    }

    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3500)
  }

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2500)
  }

  const totalSpent = orders.reduce((sum, order) => {
    return sum + (order.pricing?.grandTotal || 0)
  }, 0)

  const enrolledCourses = Array.isArray(customerProfile?.enrolledCourses)
    ? customerProfile.enrolledCourses
    : []

  return (
    <div className="profile-page-container">
      {/* Top Breadcrumbs & Cart shortcut */}
      <div className="profile-top-bar">
        <button
          type="button"
          className="back-link-btn"
          onClick={onBackToShopping}
        >
          ← Back to Gallery
        </button>

        <button
          type="button"
          className="cart-pill-shortcut"
          onClick={onNavigateToCart}
        >
          <CartIcon size={16} /> View Cart {cartCount > 0 ? `(${cartCount})` : ''}
        </button>
      </div>

      {/* Hero Profile Banner */}
      <div className="profile-hero-banner">
        <div className="profile-avatar-large">
          {customerProfile?.name ? customerProfile.name.charAt(0).toUpperCase() : <LeafIcon size={36} color="#fff" />}
        </div>

        <div className="profile-hero-content">
          <div className="profile-name-row">
            <h1>{customerProfile?.name || 'Valued Customer'}</h1>
            <span className="profile-tier-badge">
              <AwardIcon size={14} /> {customerProfile?.memberTier || 'Rose Gold VIP Member'}
            </span>
          </div>

          <p className="profile-email-phone">
            <span className="contact-chip"><MailIcon size={14} color="#8b3ec4" /> {customerProfile?.email || 'No email set'}</span>
            <span className="contact-chip"><PhoneIcon size={14} color="#8b3ec4" /> {customerProfile?.phone || 'No phone set'}</span>
          </p>

          <div className="profile-quick-stats">
            <div className="stat-pill points-pill">
              <div className="stat-pill-icon"><SparklesIcon size={18} color="#d45aa2" /></div>
              <div className="stat-pill-text">
                <strong>{customerProfile?.loyaltyPoints || 0}</strong>
                <span>Reward Points</span>
              </div>
            </div>
            <div className="stat-pill orders-pill">
              <div className="stat-pill-icon"><PackageIcon size={18} color="#8b3ec4" /></div>
              <div className="stat-pill-text">
                <strong>{orders.length}</strong>
                <span>Orders Placed</span>
              </div>
            </div>
            <div className="stat-pill courses-pill">
              <div className="stat-pill-icon"><AwardIcon size={18} color="#9b5de5" /></div>
              <div className="stat-pill-text">
                <strong>{enrolledCourses.length}</strong>
                <span>Workshops</span>
              </div>
            </div>
            <div className="stat-pill value-pill">
              <div className="stat-pill-icon"><LeafIcon size={18} color="#6d2f8c" /></div>
              <div className="stat-pill-text">
                <strong>৳{totalSpent.toLocaleString('en-IN')}</strong>
                <span>Resin Art Loved</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Segmented Pill Tabs */}
      <div className="profile-tabs-wrapper">
        <div className="profile-tabs-header">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <UserIcon size={16} /> Profile & Default Address
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <PackageIcon size={16} /> Order History ({orders.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            <AwardIcon size={16} /> My Workshops ({enrolledCourses.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'rewards' ? 'active' : ''}`}
            onClick={() => setActiveTab('rewards')}
          >
            <GiftIcon size={16} /> Bloom Rewards & Coupons
          </button>
        </div>
      </div>

      {/* Tab 1: Profile & Delivery Details */}
      {activeTab === 'profile' && (
        <div className="profile-tab-content">
          <div className="profile-form-card">
            <div className="card-intro">
              <h2>Personal Information & Delivery Destination</h2>
              <p>
                Keep your details updated for seamless 1-click cart checkout and custom resin notifications.
              </p>
            </div>

            {saveSuccess && (
              <div className="save-success-banner">
                <CheckCircleIcon size={16} color="#27ae60" /> Your customer profile & delivery details have been saved successfully!
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="profile-edit-form">
              <div className="profile-form-section">
                <h3 className="section-title"><UserIcon size={16} color="#8b3ec4" /> Contact Information</h3>
                <div className="form-group">
                  <label htmlFor="profile-name">Full Name *</label>
                  <input
                    id="profile-name"
                    name="name"
                    type="text"
                    required
                    placeholder="Your full name"
                    value={profileForm.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="profile-email">Email Address *</label>
                    <input
                      id="profile-email"
                      name="email"
                      type="email"
                      required
                      placeholder="name@domain.com"
                      value={profileForm.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="profile-phone">Phone Number *</label>
                    <input
                      id="profile-phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="+880 17..."
                      value={profileForm.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div className="profile-form-section">
                <h3 className="section-title"><MapPinIcon size={16} color="#8b3ec4" /> Default Delivery Address</h3>
                <div className="form-group">
                  <label htmlFor="profile-address">Street / House Address *</label>
                  <textarea
                    id="profile-address"
                    name="address"
                    rows="2"
                    required
                    placeholder="House, Road, Area / Apartment info..."
                    value={profileForm.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="profile-city">City / District *</label>
                    <input
                      id="profile-city"
                      name="city"
                      type="text"
                      required
                      placeholder="e.g. Dhaka, Chittagong..."
                      value={profileForm.city}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="profile-notes">Special Delivery Instructions</label>
                    <input
                      id="profile-notes"
                      name="notes"
                      type="text"
                      placeholder="e.g. Call before delivery, handle with care"
                      value={profileForm.notes}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div className="profile-form-actions">
                <button type="submit" className="button primary profile-save-btn">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="button secondary profile-cart-btn"
                  onClick={onNavigateToCart}
                >
                  <CartIcon size={16} /> Proceed to Cart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Order History */}
      {activeTab === 'orders' && (
        <div className="profile-tab-content">
          <div className="orders-history-container">
            <div className="card-intro">
              <h2>Your Order History</h2>
              <p>Review details, track status, and view past resin creations you have purchased.</p>
            </div>

            {orders.length === 0 ? (
              <div className="no-orders-box">
                <div className="empty-icon">
                  <PackageIcon size={52} color="#8b3ec4" />
                </div>
                <h3>No Orders Yet</h3>
                <p>You haven't placed any orders yet. Discover timeless handcrafted resin pieces!</p>
                <button
                  type="button"
                  className="button primary profile-save-btn"
                  onClick={onBackToShopping}
                >
                  <LeafIcon size={16} color="#fff" /> Explore Collection
                </button>
              </div>
            ) : (
              <div className="orders-cards-list">
                {orders.map((order) => (
                  <div className="order-history-card" key={order.id}>
                    <div className="order-card-header">
                      <div>
                        <span className="order-id-label">Order #{order.id}</span>
                        <p className="order-date-text">
                          {new Date(order.createdAt).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>

                      <div className="order-status-badge">
                        <CheckCircleIcon size={14} color="#27ae60" /> {order.status?.replace(/[^\w\s]/g, '') || 'Confirmed'}
                      </div>
                    </div>

                    <div className="order-items-grid">
                      {order.items?.map((item, idx) => (
                        <div className="order-mini-item" key={`${item.id}-${idx}`}>
                          <img src={item.image} alt={item.name} />
                          <div className="order-mini-item-info">
                            <strong>{item.name}</strong>
                            <span>
                              Qty: {item.quantity} • {formatPrice(item.price)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="order-card-footer">
                      <div className="order-footer-details">
                        <span>
                          <MapPinIcon size={13} color="#7b3f96" /> <strong>Delivering to:</strong> {order.customer?.address}, {order.customer?.city}
                        </span>
                        <span>
                          <CreditCardIcon size={13} color="#7b3f96" /> <strong>Payment:</strong> {order.paymentMethod?.toUpperCase()}
                        </span>
                      </div>
                      <div className="order-footer-total">
                        <span>Total Paid</span>
                        <strong>৳{(order.pricing?.grandTotal || 0).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Enrolled Workshops & Masterclasses */}
      {activeTab === 'courses' && (
        <div className="profile-tab-content">
          <div className="enrolled-courses-container">
            <div className="card-intro">
              <h2>My Enrolled Masterclasses & Workshops</h2>
              <p>
                Access your scheduled live cohort sessions, resin chemistry guides, and virtual studio access.
              </p>
            </div>

            {enrolledCourses.length === 0 ? (
              <div className="empty-courses-card">
                <div className="empty-icon-circle">
                  <AwardIcon size={36} color="#8b3ec4" />
                </div>
                <h3>No workshops enrolled yet</h3>
                <p>
                  Learn how to craft crystal-clear epoxy trays, floral coasters, and bespoke resin jewelry directly from master artisans.
                </p>
                <button
                  type="button"
                  className="button primary browse-courses-action-btn"
                  onClick={onBackToShopping}
                >
                  Explore Upcoming Classes
                </button>
              </div>
            ) : (
              <div className="enrolled-courses-grid">
                {enrolledCourses.map((course, idx) => (
                  <article className="enrolled-course-card" key={course.id || idx}>
                    <div className="enrolled-card-top-row">
                      <span className="enrolled-status-badge">
                        <CheckCircleIcon size={14} color="#27ae60" /> Confirmed Live Seat
                      </span>
                      <span className="enrolled-date-badge">
                        <ClockIcon size={13} /> {course.date ? new Date(course.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming Cohort'}
                      </span>
                    </div>

                    <h3 className="enrolled-course-title">{course.title}</h3>
                    <div className="enrolled-schedule-info">
                      <ClockIcon size={14} color="#8b3ec4" />
                      <span>{course.time || 'Live Weekend Cohort (6:00 PM GMT+6)'}</span>
                    </div>

                    {Array.isArray(course.highlights) && course.highlights.length > 0 && (
                      <div className="enrolled-highlights">
                        <strong>Included in your pass:</strong>
                        <ul>
                          {course.highlights.map((h, i) => (
                            <li key={i}>✓ {h}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="enrolled-card-footer">
                      <span className="pts-earned-tag">
                        <SparklesIcon size={13} color="#d45aa2" /> +50 VIP Points Awarded
                      </span>
                      <button
                        type="button"
                        className="studio-access-btn"
                        onClick={() => alert(`🎉 Welcome to "${course.title}" Studio!\n\n• Session Link: Zoom Live Cohort (Access emailed 24h prior)\n• Materials: Fragile resin supplies dispatched\n• Support: WhatsApp Artisan Group`)}
                      >
                        Studio Access Portal →
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Rewards & Exclusive Perks */}
      {activeTab === 'rewards' && (
        <div className="profile-tab-content">
          <div className="rewards-container">
            <div className="rewards-hero-card">
              <div className="rewards-balance">
                <span className="points-number">{customerProfile?.loyaltyPoints || 0}</span>
                <span className="points-label">Available Bloom Points</span>
                <p>Use your points to get instant discounts on upcoming resin art pieces.</p>
              </div>

              <div className="rewards-tier-info">
                <h3><AwardIcon size={20} color="#8b3ec4" /> VIP Club Perks</h3>
                <ul>
                  <li>✓ 10% cash equivalent on every purchase (10 Pts per ৳100 spent)</li>
                  <li>✓ Early access to limited edition resin coasters & floral trays</li>
                  <li>✓ Complimentary floral gift ribbons & handwritten cards</li>
                  <li>✓ Exclusive member-only discount codes</li>
                </ul>
              </div>
            </div>

            <h3 className="coupons-section-title">Available Promo Codes for You</h3>
            <div className="coupons-grid">
              <div className="coupon-card">
                <div className="coupon-code-row">
                  <div className="coupon-code-tag">BLOOM10</div>
                  <button
                    type="button"
                    className="copy-coupon-btn"
                    onClick={() => handleCopyCode('BLOOM10')}
                  >
                    {copiedCode === 'BLOOM10' ? 'Copied! ✓' : 'Copy Code'}
                  </button>
                </div>
                <h4>10% Off Sitewide</h4>
                <p>Enjoy 10% discount on all resin creations with no minimum order.</p>
                <span className="coupon-status">Active & Ready to use in Cart</span>
              </div>

              <div className="coupon-card">
                <div className="coupon-code-row">
                  <div className="coupon-code-tag">FREESHIP</div>
                  <button
                    type="button"
                    className="copy-coupon-btn"
                    onClick={() => handleCopyCode('FREESHIP')}
                  >
                    {copiedCode === 'FREESHIP' ? 'Copied! ✓' : 'Copy Code'}
                  </button>
                </div>
                <h4>Free Shipping Voucher</h4>
                <p>Get 100% free delivery anywhere in Dhaka or across Bangladesh.</p>
                <span className="coupon-status">Active & Ready to use in Cart</span>
              </div>

              <div className="coupon-card">
                <div className="coupon-code-row">
                  <div className="coupon-code-tag">GLOSS20</div>
                  <button
                    type="button"
                    className="copy-coupon-btn"
                    onClick={() => handleCopyCode('GLOSS20')}
                  >
                    {copiedCode === 'GLOSS20' ? 'Copied! ✓' : 'Copy Code'}
                  </button>
                </div>
                <h4>20% VIP Artisan Promo</h4>
                <p>Exclusive perk for {customerProfile?.memberTier || 'Members'} on orders over ৳2,000.</p>
                <span className="coupon-status"><SparklesIcon size={13} color="#27ae60" /> Unlocked</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
