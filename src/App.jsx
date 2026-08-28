import { useEffect, useState, useRef } from 'react'
import './App.css'
import { clearAdminSession, createAdminSession, persistAdminSession, readAdminSession } from './adminSession'
import { DEFAULT_PRODUCT_IMAGE, formatPrice, normalizeProductForDisplay, normalizeProductInput } from './productUtils'
import { CartPage } from './CartPage'
import { CustomerProfilePage } from './CustomerProfilePage'
import { LeafIcon, CartIcon, UserIcon, LockIcon, SparklesIcon, TruckIcon, PackageIcon, GiftIcon, CheckCircleIcon, CloseIcon, AwardIcon } from './Icons'
import hero from './assets/hero.png'

const DEFAULT_CUSTOMER_PROFILE = {
  name: 'Samiya Rahman',
  email: 'samiya@bloomandgloss.com',
  phone: '+880 1712-345679',
  address: 'House 24, Road 7, Banani',
  city: 'Dhaka North',
  notes: 'Handle fragile resin pieces with extra care',
  memberTier: 'Rose Gold VIP Member',
  loyaltyPoints: 658,
  totalOrders: 3,
  totalSpent: 6040,
  enrolledCourses: [],
}

const initialProducts = [
  {
    id: 'resin-tray-aurora',
    name: 'Aurora Resin Tray',
    price: '৳118',
    category: 'Decor',
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
    description: 'A luminous tray with layered coral and gold veining.',
    material: 'Resin + metallic pigment',
    dimensions: '14 x 8 x 2 in',
    features: ['Hand-poured layers', 'Luxury finish', 'Gift-ready packaging'],
    uploadedAt: new Date().toISOString(),
  },
  {
    id: 'resin-vase-moon',
    name: 'Moonlight Vase',
    price: '৳96',
    category: 'Vases',
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
    description: 'A sculptural vase with dreamy blue and pearl highlights.',
    material: 'Resin + glass powder',
    dimensions: '10 x 10 x 16 in',
    features: ['Sculpted silhouette', 'Light-catching finish', 'Perfect for florals'],
    uploadedAt: new Date().toISOString(),
  },
].map((product) => normalizeProductForDisplay(product))

const initialCourses = [
  {
    id: 'course-resin-jewelry',
    title: 'Resin Art & Jewelry Making - Basic to Advanced Course',
    date: '2026-07-21T15:00:00',
    seats: 10,
    description:
      'A complete resin art course designed to take learners from beginner level to advanced techniques. Learn professional methods to create premium resin jewelry and artistic products.',
    highlights: [
      'Basic to Advanced Resin Techniques',
      'Advanced Coloring',
      'Professional Finishing',
      'Premium Jewelry Design',
      'Flower Preservation',
      'Product Making',
      'Creative Business Ideas',
    ],
  },
  {
    id: 'course-resin-tray',
    title: 'Resin Coaster & Tray Masterclass',
    date: '2026-08-15T16:00:00',
    seats: 14,
    description:
      'Create elegant resin coasters and serving trays using beautiful colors, glitters, gold foil accents, and creative design techniques.',
    highlights: [
      'Coaster making',
      'Dry flowers',
      'Mold techniques',
      'Bubble-free finish',
    ],
  },
  {
    id: 'course-resin-floral',
    title: 'Floral Preservation & Keepsakes',
    date: '2026-09-01T11:00:00',
    seats: 8,
    description:
      'Learn how to dry fresh flowers, preserve memories, and embed them into crystal-clear resin blocks and domes.',
    highlights: [
      'Silica 3D drying',
      'Color preservation',
      'Deep casting layers',
      'Polishing edges',
    ],
  },
]

const createEmptyProductForm = () => ({
  id: '',
  name: '',
  price: '',
  category: '',
  badge: '',
  image: '',
  description: '',
  material: '',
  dimensions: '',
  features: '',
})

const createEmptyCourseForm = () => ({
  id: '',
  title: '',
  date: '',
  time: '',
  seats: '',
  description: '',
  highlights: '',
})

function parseCourseDateTime(value) {
  if (!value) {
    return { date: '', time: '' }
  }

  const normalizedValue = String(value).trim()
  if (!normalizedValue) {
    return { date: '', time: '' }
  }

  const [datePart, timePart] = normalizedValue.split('T')

  return {
    date: datePart || '',
    time: timePart ? timePart.slice(0, 5) : '',
  }
}

function buildCourseDateTime(date, time) {
  if (!date) {
    return ''
  }

  return time ? `${date}T${time}` : `${date}T00:00`
}

const ADMIN_SESSION_DURATION_MS = 1000 * 60 * 60

const testimonials = [
  {
    quote:
      'Every piece feels like a tiny gallery display at home. The finish is mesmerizing.',
    author: 'Nadia Rahman',
  },
  {
    quote:
      'The online class made it easy to create professional-looking pieces from day one.',
    author: 'Sajid Alam',
  },
  {
    quote:
      'The colors and shine are so luxurious. My guests always ask where I got them.',
    author: 'Mina Chowdhury',
  },
  {
    quote:
      'I ordered a custom tray and it arrived faster than expected with beautiful packaging.',
    author: 'Rafiq Hassan',
  },
  {
    quote:
      'The course gave me confidence to start my own resin business from home.',
    author: 'Sabrina Noor',
  },
  {
    quote:
      'The detail and finish are absolutely premium. It feels like art, not decor.',
    author: 'Arif Bin Karim',
  },
]

function getTimeLeft(targetDate) {
  if (!(targetDate instanceof Date) || Number.isNaN(targetDate.getTime())) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true }
  }

  const diff = targetDate - new Date()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true }
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isLive: false,
  }
}

function App() {
  const [productList, setProductList] = useState(initialProducts)
  const [courses, setCourses] = useState(initialCourses)
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('bloom_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === 'undefined') {
      return 'public'
    }

    return readAdminSession(window.localStorage, Date.now()) ? 'admin' : 'public'
  })
  const [customerProfile, setCustomerProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('bloom_customer_profile')
      return saved ? JSON.parse(saved) : DEFAULT_CUSTOMER_PROFILE
    } catch {
      return DEFAULT_CUSTOMER_PROFILE
    }
  })
  const [orders, setOrders] = useState([])
  const [adminPassword, setAdminPassword] = useState('')
  const [adminError, setAdminError] = useState('')
  const [activeAdminSection, setActiveAdminSection] = useState('overview')
  const [productForm, setProductForm] = useState(createEmptyProductForm())
  const [editingProductId, setEditingProductId] = useState(null)
  const [courseForm, setCourseForm] = useState(createEmptyCourseForm())
  const [editingCourseId, setEditingCourseId] = useState(null)
  const [showProductForm, setShowProductForm] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [snackbar, setSnackbar] = useState({
    show: false,
    type: 'cart',
    title: '',
    message: '',
    image: '',
    actionText: '',
    onAction: null,
  })
  const snackbarTimerRef = useRef(null)

  const showSnackbar = ({ type = 'cart', title, message, image = '', actionText = '', onAction = null }) => {
    if (snackbarTimerRef.current) {
      clearTimeout(snackbarTimerRef.current)
    }
    setSnackbar({ show: true, type, title, message, image, actionText, onAction })
    snackbarTimerRef.current = setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, show: false }))
    }, 4000)
  }

  const closeSnackbar = () => {
    if (snackbarTimerRef.current) {
      clearTimeout(snackbarTimerRef.current)
    }
    setSnackbar((prev) => ({ ...prev, show: false }))
  }

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bloom_cart', JSON.stringify(cartItems))
    } catch (e) {
      console.error('Failed to save cart to localStorage', e)
    }
  }, [cartItems])

  // Sync customer profile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bloom_customer_profile', JSON.stringify(customerProfile))
    } catch (e) {
      console.error('Failed to save profile to localStorage', e)
    }
  }, [customerProfile])

  // Fetch initial data (products, courses, customer profile, orders)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, coursesResponse] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/courses'),
        ])
        if (productsResponse.ok) {
          const products = await productsResponse.json()
          setProductList(products.map((product) => normalizeProductForDisplay(product)))
        }

        if (coursesResponse.ok) {
          const remoteCourses = await coursesResponse.json()
          if (remoteCourses?.length) {
            setCourses(remoteCourses)
          }
        }
      } catch (error) {
        console.error('Failed to load initial data:', error)
      }
    }

    fetchData()
  }, [])

  // Fetch customer orders from backend
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!customerProfile?.email) return
      try {
        const [custRes, ordRes] = await Promise.all([
          fetch(`/api/customers/${encodeURIComponent(customerProfile.email.toLowerCase())}`),
          fetch(`/api/orders?email=${encodeURIComponent(customerProfile.email.toLowerCase())}`),
        ])

        if (custRes.ok) {
          const serverCust = await custRes.json()
          if (serverCust) {
            setCustomerProfile((prev) => ({ ...prev, ...serverCust }))
          }
        }

        if (ordRes.ok) {
          const serverOrders = await ordRes.json()
          if (Array.isArray(serverOrders)) {
            setOrders(serverOrders)
          }
        }
      } catch (err) {
        console.error('Failed to sync customer profile/orders from server:', err)
      }
    }

    fetchCustomerData()
  }, [customerProfile?.email])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (viewMode !== 'admin') {
      return
    }

    const session = readAdminSession(window.localStorage, Date.now())
    if (!session) {
      const timeout = window.setTimeout(() => {
        setAdminPassword('')
        setAdminError('')
        setViewMode('admin-login')
      }, 0)
      return () => window.clearTimeout(timeout)
    }
  }, [viewMode])

  const selectedProduct = productList.find((product) => product.id === selectedProductId) || null
  const categoryCount = new Set(productList.map((product) => product.category)).size
  const featuredCourse = courses[0] || initialCourses[0]
  const featuredCourseSeats = Number(featuredCourse?.seats || 0)
  const courseCarouselItems = courses.length
    ? [...courses, ...courses, ...courses, ...courses]
    : []

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)

  const handleAddToCart = (product) => {
    if (!product) return

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === product.id)
      if (existingIndex > -1) {
        const updated = [...prevItems]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: (updated[existingIndex].quantity || 1) + 1,
        }
        return updated
      }
      return [...prevItems, { ...product, quantity: 1 }]
    })

    showSnackbar({
      type: 'cart',
      title: 'Added to Bag! ✨',
      message: `${product.name} (${formatPrice(product.price)})`,
      image: product.image || DEFAULT_PRODUCT_IMAGE,
      actionText: 'View Cart',
      onAction: handleNavigateToCart,
    })
  }

  const handleSubscribeNewsletter = async (e) => {
    e.preventDefault()
    const cleanEmail = newsletterEmail.trim()
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      showSnackbar({
        type: 'error',
        title: 'Invalid Email Address',
        message: 'Please enter a valid email address to subscribe.',
      })
      return
    }

    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      })
    } catch (err) {
      console.error('Failed to subscribe:', err)
    }

    setNewsletterEmail('')
    showSnackbar({
      type: 'newsletter',
      title: 'Welcome to VIP Circle! 🌸',
      message: 'You are subscribed! Use promo code BLOOM10 for 10% off your next piece.',
      actionText: 'Shop Collection',
      onAction: () => {
        handleNavigateToStore()
        setTimeout(() => {
          document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      },
    })
  }

  const handleEnrollCourse = async (course) => {
    if (!course) return

    const currentEnrolled = Array.isArray(customerProfile?.enrolledCourses)
      ? customerProfile.enrolledCourses
      : []

    const alreadyEnrolled = currentEnrolled.some(
      (c) => c.id === course.id || c.title === course.title
    )

    const courseSlug = (course.title || 'course').toLowerCase().replace(/[^\w-]/g, '-')
    const enrollmentRecord = {
      id: course.id || `enrollment-${courseSlug}`,
      title: course.title,
      date: course.date || 'TBD',
      time: course.time || 'Live Weekend Session (6:00 PM GMT+6)',
      highlights: course.highlights || ['Live Resin Mixing', 'Color Chemistry', 'Certificate Included'],
      seats: course.seats,
      status: 'Confirmed',
    }

    const updatedCourses = alreadyEnrolled
      ? currentEnrolled
      : [enrollmentRecord, ...currentEnrolled]

    const updatedProfile = {
      ...customerProfile,
      enrolledCourses: updatedCourses,
      loyaltyPoints: (customerProfile?.loyaltyPoints || 0) + (alreadyEnrolled ? 0 : 50),
    }

    handleUpdateCustomerProfile(updatedProfile)

    // Sync to backend if email exists
    if (updatedProfile.email) {
      try {
        await fetch(`/api/customers/${encodeURIComponent(updatedProfile.email.toLowerCase())}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProfile),
        })
      } catch (err) {
        console.error('Failed to sync course enrollment to backend:', err)
      }
    }

    showSnackbar({
      type: 'course',
      title: alreadyEnrolled ? 'Already Enrolled! 🎓' : 'Seat Reserved! 🎓 (+50 VIP pts)',
      message: `"${course.title}" is saved to your profile workshops schedule.`,
      actionText: 'View in Profile',
      onAction: () => {
        handleNavigateToProfile()
      },
    })
  }

  const handleUpdateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId)
      return
    }

    setCartItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: newQuantity } : item))
    )
  }

  const handleRemoveFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId))
  }

  const handleClearCart = () => {
    setCartItems([])
  }

  const handleUpdateCustomerProfile = (updatedProfile) => {
    setCustomerProfile(updatedProfile)
  }

  const handleOrderPlaced = (newOrder) => {
    setOrders((prev) => [newOrder, ...prev])
  }

  const handleOpenAdmin = () => {
    const session = readAdminSession(window.localStorage, Date.now())

    if (session) {
      setAdminError('')
      setViewMode('admin')
      return
    }

    setAdminPassword('')
    setAdminError('')
    setViewMode('admin-login')
  }

  const handleAdminSubmit = (event) => {
    event.preventDefault()

    if (adminPassword.trim() === '1716630307') {
      persistAdminSession(createAdminSession(ADMIN_SESSION_DURATION_MS), window.localStorage)
      setAdminError('')
      setViewMode('admin')
    } else {
      setAdminError('Incorrect password. Please try again.')
    }
  }

  const handleAdminLogout = () => {
    clearAdminSession(window.localStorage)
    setAdminPassword('')
    setAdminError('')
    setViewMode('public')
  }

  const resetProductForm = () => {
    setProductForm(createEmptyProductForm())
    setEditingProductId(null)
    setShowProductForm(false)
  }

  const resetCourseForm = () => {
    setCourseForm(createEmptyCourseForm())
    setEditingCourseId(null)
  }

  const handleProductInputChange = (event) => {
    const { name, value } = event.target
    setProductForm((current) => ({ ...current, [name]: value }))
  }

  const handleCourseInputChange = (event) => {
    const { name, value } = event.target
    setCourseForm((current) => ({ ...current, [name]: value }))
  }

  const handleProductSubmit = async (event) => {
    event.preventDefault()

    const existingProduct = editingProductId
      ? productList.find((product) => product.id === editingProductId) || null
      : null

    const normalizedProduct = normalizeProductInput(
      {
        ...productForm,
        id: editingProductId || productForm.id || '',
      },
      existingProduct,
    )

    if (!normalizedProduct.name || !normalizedProduct.price || !normalizedProduct.category) {
      return
    }

    try {
      const response = editingProductId
        ? await fetch(`/api/products/${editingProductId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(normalizedProduct),
          })
        : await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(normalizedProduct),
          })

      if (response.ok) {
        const savedProduct = await response.json()
        const normalizedSavedProduct = normalizeProductForDisplay(savedProduct)
        setProductList((current) => {
          if (editingProductId) {
            return current.map((item) => (item.id === editingProductId ? normalizedSavedProduct : item))
          }

          return [normalizedSavedProduct, ...current]
        })
      } else {
        const errData = await response.json()
        console.error('Server error saving product:', errData)
        alert('Error saving product: ' + (errData.error || response.statusText))
      }
    } catch (error) {
      console.error('Failed to save product:', error)
      alert('Network error while saving product.')
    }

    resetProductForm()
  }

  const handleEditProduct = (product) => {
    setEditingProductId(product.id)
    setProductForm({
      id: product.id,
      name: product.name,
      price: String(product.price ?? '')
        .replace(/^(USD|BDT|US\$|\$|৳)\s*/i, '')
        .trim(),
      category: product.category,
      badge: product.badge,
      image: product.image || DEFAULT_PRODUCT_IMAGE,
      description: product.description,
      material: product.material,
      dimensions: product.dimensions,
      features: Array.isArray(product.features) ? product.features.join(', ') : '',
    })
    setActiveAdminSection('products')
    setShowProductForm(true)
  }

  const handleDeleteProduct = async (productId) => {
    try {
      const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      if (response.ok) {
        setProductList((current) => current.filter((product) => product.id !== productId))
        if (selectedProductId === productId) {
          setSelectedProductId(null)
        }
      } else {
        const errData = await response.json()
        console.error('Server error deleting product:', errData)
        alert('Error deleting product: ' + (errData.error || response.statusText))
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Network error while deleting product.')
    }
  }

  const handleCourseSubmit = async (event) => {
    event.preventDefault()

    const selectedDate = courseForm.date.trim()
    const selectedTime = courseForm.time.trim()

    const normalizedCourse = {
      ...courseForm,
      id: editingCourseId || `course-${Date.now()}`,
      title: courseForm.title.trim(),
      date: buildCourseDateTime(selectedDate, selectedTime),
      time: selectedTime,
      seats: Number(courseForm.seats) || 0,
      description: courseForm.description.trim(),
      highlights: courseForm.highlights
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    }

    if (!normalizedCourse.title || !selectedDate) {
      return
    }

    try {
      const response = editingCourseId
        ? await fetch(`/api/courses/${editingCourseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(normalizedCourse),
          })
        : await fetch('/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(normalizedCourse),
          })

      if (response.ok) {
        const savedCourse = await response.json()
        setCourses((current) => {
          if (editingCourseId) {
            return current.map((item) => (item.id === editingCourseId ? savedCourse : item))
          }

          return [savedCourse, ...current]
        })
      } else {
        const errData = await response.json()
        console.error('Server error saving course:', errData)
        alert('Error saving course: ' + (errData.error || response.statusText))
      }
    } catch (error) {
      console.error('Failed to save course:', error)
      alert('Network error while saving course.')
    }

    resetCourseForm()
  }

  const handleEditCourse = (course) => {
    const parsedSchedule = parseCourseDateTime(course.date)

    setEditingCourseId(course.id)
    setCourseForm({
      id: course.id,
      title: course.title,
      date: parsedSchedule.date,
      time: course.time || parsedSchedule.time,
      seats: course.seats,
      description: course.description,
      highlights: Array.isArray(course.highlights) ? course.highlights.join(', ') : '',
    })
    setActiveAdminSection('courses')
  }

  const handleDeleteCourse = async (courseId) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' })
      if (response.ok) {
        setCourses((current) => current.filter((course) => course.id !== courseId))
      } else {
        const errData = await response.json()
        console.error('Server error deleting course:', errData)
        alert('Error deleting course: ' + (errData.error || response.statusText))
      }
    } catch (error) {
      console.error('Failed to delete course:', error)
      alert('Network error while deleting course.')
    }
  }

  const handleNavigateToCart = () => {
    setSelectedProductId(null)
    setViewMode('cart')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNavigateToProfile = () => {
    setSelectedProductId(null)
    setViewMode('profile')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNavigateToStore = () => {
    setSelectedProductId(null)
    setViewMode('public')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Render Global Floating Snackbar Toast
  const renderSnackbar = () => {
    if (!snackbar.show) return null

    return (
      <div className={`snackbar-toast snackbar-${snackbar.type}`} role="alert">
        <div className="snackbar-content">
          {snackbar.image ? (
            <img src={snackbar.image} alt="" className="snackbar-thumb" />
          ) : (
            <div className="snackbar-icon-badge">
              {snackbar.type === 'newsletter' ? (
                <SparklesIcon size={18} color="#d45aa2" />
              ) : snackbar.type === 'course' ? (
                <AwardIcon size={18} color="#8b3ec4" />
              ) : snackbar.type === 'error' ? (
                <CloseIcon size={16} color="#e74c3c" />
              ) : (
                <CheckCircleIcon size={18} color="#27ae60" />
              )}
            </div>
          )}
          <div className="snackbar-text">
            <strong>{snackbar.title}</strong>
            <span>{snackbar.message}</span>
          </div>
        </div>

        <div className="snackbar-actions">
          {snackbar.actionText && (
            <button
              type="button"
              className="snackbar-action-btn"
              onClick={() => {
                if (snackbar.onAction) snackbar.onAction()
                closeSnackbar()
              }}
            >
              {snackbar.actionText}
            </button>
          )}
          <button
            type="button"
            className="snackbar-close-btn"
            onClick={closeSnackbar}
            aria-label="Dismiss notification"
          >
            <CloseIcon size={14} />
          </button>
        </div>
      </div>
    )
  }

  // Render Global Navbar
  const renderNavbar = (currentView) => (
    <header className="navbar">
      <a
        className="brand"
        href="#home"
        onClick={(e) => {
          e.preventDefault()
          handleNavigateToStore()
        }}
      >
        <LeafIcon size={22} color="#8b3ec4" />
        <span>Bloom & Gloss</span>
      </a>

      <div className="nav-right-group">
        <button
          className={`cart-pill ${currentView === 'cart' ? 'active' : ''}`}
          type="button"
          onClick={handleNavigateToCart}
          title="View Bag"
        >
          <CartIcon size={17} />
          <span>Cart</span>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>

        <button
          className={`profile-pill ${currentView === 'profile' ? 'active' : ''}`}
          type="button"
          onClick={handleNavigateToProfile}
          title="Customer Profile & Rewards"
        >
          <UserIcon size={17} />
          <span>{customerProfile?.name ? customerProfile.name.split(' ')[0] : 'Profile'}</span>
        </button>

        <nav className="nav-links">
          <a
            href="#products"
            onClick={(e) => {
              if (currentView !== 'public') {
                e.preventDefault()
                handleNavigateToStore()
                setTimeout(() => {
                  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
                }, 100)
              }
            }}
          >
            Products
          </a>
          <a
            href="#course"
            onClick={(e) => {
              if (currentView !== 'public') {
                e.preventDefault()
                handleNavigateToStore()
                setTimeout(() => {
                  document.getElementById('course')?.scrollIntoView({ behavior: 'smooth' })
                }, 100)
              }
            }}
          >
            Course
          </a>
          <a
            href="#reviews"
            onClick={(e) => {
              if (currentView !== 'public') {
                e.preventDefault()
                handleNavigateToStore()
                setTimeout(() => {
                  document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })
                }, 100)
              }
            }}
          >
            Reviews
          </a>

          <button
            className="nav-link-button admin-btn"
            type="button"
            onClick={handleOpenAdmin}
            title="Admin Login"
          >
            <LockIcon size={14} /> Admin
          </button>
        </nav>
      </div>
    </header>
  )

  if (viewMode === 'admin-login') {
    return (
      <div className="page-shell auth-shell">
        <header className="navbar">
          <a className="brand" href="#home" onClick={() => setViewMode('public')}>
            <LeafIcon size={22} color="#8b3ec4" /> Bloom & Gloss
          </a>
          <button className="nav-link-button" type="button" onClick={() => setViewMode('public')}>
            Back to store
          </button>
        </header>

        <main className="auth-card-wrap">
          <section className="auth-card">
            <p className="eyebrow">Restricted access</p>
            <h1>Admin dashboard</h1>
            <p className="auth-description">
              Verify your password to access your management workspace and start a protected admin session.
            </p>
            <p className="auth-helper">
              Your session stays active while it remains valid, so you can return without re-entering the password.
            </p>
            <form className="auth-form" onSubmit={handleAdminSubmit}>
              <input
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
              />
              <button className="button primary" type="submit">
                Unlock dashboard
              </button>
            </form>
            {adminError ? <p className="auth-error">{adminError}</p> : null}
          </section>
        </main>
      </div>
    )
  }

  if (viewMode === 'admin') {
    return (
      <div className="page-shell admin-shell">
        <header className="navbar admin-navbar">
          <a className="brand" href="#home" onClick={handleAdminLogout}>
            <LeafIcon size={22} color="#8b3ec4" /> Bloom & Gloss Admin
          </a>

          <div className="nav-actions">
            <span className="admin-pill">Protected workspace</span>

            <button
              className="nav-link-button"
              type="button"
              onClick={() => setViewMode('public')}
            >
              Back to store
            </button>

            <button
              className="nav-link-button"
              type="button"
              onClick={handleAdminLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="admin-dashboard">
          <div className="admin-layout">
            <aside className="admin-sidebar">
              <button
                className={`admin-tab ${activeAdminSection === 'overview' ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveAdminSection('overview')}
              >
                Overview
              </button>

              <button
                className={`admin-tab ${activeAdminSection === 'products' ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveAdminSection('products')}
              >
                Products
              </button>

              <button
                className={`admin-tab ${activeAdminSection === 'courses' ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveAdminSection('courses')}
              >
                Courses
              </button>
            </aside>

            <section className="admin-content">
              {activeAdminSection === 'overview' && (
                <div className="admin-panel">
                  <div className="admin-hero">
                    <div>
                      <p className="eyebrow">Studio controls</p>
                      <h1>Manage inventory and workshops</h1>
                      <p>
                        Keep your store fresh with new items, track enrolled students, and update course dates with ease.
                      </p>
                    </div>

                    <div className="admin-actions">
                      <button
                        className="button primary"
                        type="button"
                        onClick={() => {
                          resetProductForm()
                          setActiveAdminSection('products')
                          setShowProductForm(true)
                        }}
                      >
                        + Add product
                      </button>

                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => {
                          resetCourseForm()
                          setActiveAdminSection('courses')
                        }}
                      >
                        + Add course
                      </button>
                    </div>
                  </div>

                  <div className="stats-grid">
                    <div className="stat-card">
                      <p className="eyebrow">Catalog size</p>
                      <h3>{productList.length}</h3>
                      <p>Published pieces</p>
                    </div>

                    <div className="stat-card">
                      <p className="eyebrow">Categories</p>
                      <h3>{categoryCount}</h3>
                      <p>Unique collections</p>
                    </div>

                    <div className="stat-card">
                      <p className="eyebrow">Workshops</p>
                      <h3>{courses.length}</h3>
                      <p>Active course schedules</p>
                    </div>

                    <div className="stat-card">
                      <p className="eyebrow">Seat availability</p>
                      <h3>{featuredCourseSeats}</h3>
                      <p>Seats in next class</p>
                    </div>
                  </div>
                </div>
              )}

              {activeAdminSection === 'products' && (
                <div className="admin-panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">Products</p>
                      <h2>Manage resin pieces</h2>
                    </div>

                    <button
                      className="button primary"
                      type="button"
                      onClick={() => {
                        if (showProductForm && !editingProductId) {
                          setShowProductForm(false)
                        } else {
                          resetProductForm()
                          setShowProductForm(true)
                        }
                      }}
                    >
                      {showProductForm && !editingProductId ? 'Hide form' : '+ Add product'}
                    </button>
                  </div>

                  {showProductForm && (
                    <form className="admin-form" onSubmit={handleProductSubmit}>
                      <h3>{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>

                      <div className="form-grid">
                        <div>
                          <label htmlFor="name">Product Name *</label>
                          <input
                            id="name"
                            name="name"
                            required
                            value={productForm.name}
                            onChange={handleProductInputChange}
                            placeholder="e.g. Ocean Waves Cheese Board"
                          />
                        </div>

                        <div>
                          <label htmlFor="price">Price (BDT) *</label>
                          <input
                            id="price"
                            name="price"
                            required
                            value={productForm.price}
                            onChange={handleProductInputChange}
                            placeholder="e.g. 2500"
                          />
                        </div>

                        <div>
                          <label htmlFor="category">Category *</label>
                          <input
                            id="category"
                            name="category"
                            required
                            value={productForm.category}
                            onChange={handleProductInputChange}
                            placeholder="e.g. Trays, Clocks, Decor"
                          />
                        </div>

                        <div>
                          <label htmlFor="badge">Badge</label>
                          <input
                            id="badge"
                            name="badge"
                            value={productForm.badge}
                            onChange={handleProductInputChange}
                            placeholder="e.g. Best Seller, New Arrival"
                          />
                        </div>

                        <div className="full-width">
                          <label htmlFor="image">Image URL</label>
                          <input
                            id="image"
                            name="image"
                            value={productForm.image}
                            onChange={handleProductInputChange}
                            placeholder="https://..."
                          />
                        </div>

                        <div className="full-width">
                          <label htmlFor="description">Description</label>
                          <textarea
                            id="description"
                            name="description"
                            rows="3"
                            value={productForm.description}
                            onChange={handleProductInputChange}
                            placeholder="Describe the resin piece..."
                          />
                        </div>

                        <div>
                          <label htmlFor="material">Material</label>
                          <input
                            id="material"
                            name="material"
                            value={productForm.material}
                            onChange={handleProductInputChange}
                            placeholder="e.g. Epoxy resin, dried flowers"
                          />
                        </div>

                        <div>
                          <label htmlFor="dimensions">Dimensions</label>
                          <input
                            id="dimensions"
                            name="dimensions"
                            value={productForm.dimensions}
                            onChange={handleProductInputChange}
                            placeholder="e.g. 12 x 12 in"
                          />
                        </div>

                        <div className="full-width">
                          <label htmlFor="features">Features (comma separated)</label>
                          <input
                            id="features"
                            name="features"
                            value={productForm.features}
                            onChange={handleProductInputChange}
                            placeholder="Heat resistant, UV protected, Hand-poured"
                          />
                        </div>
                      </div>

                      <div className="form-actions">
                        <button className="button primary" type="submit">
                          {editingProductId ? 'Update Product' : 'Create Product'}
                        </button>
                        <button className="button secondary" type="button" onClick={resetProductForm}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Badge</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productList.map((product) => (
                          <tr key={product.id}>
                            <td>
                              <img
                                src={product.image || DEFAULT_PRODUCT_IMAGE}
                                alt={product.name}
                                className="table-thumb"
                              />
                            </td>
                            <td>
                              <strong>{product.name}</strong>
                            </td>
                            <td>{product.category}</td>
                            <td>{formatPrice(product.price)}</td>
                            <td>
                              <span className="badge-pill">{product.badge}</span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="action-btn edit"
                                  type="button"
                                  onClick={() => handleEditProduct(product)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="action-btn delete"
                                  type="button"
                                  onClick={() => handleDeleteProduct(product.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeAdminSection === 'courses' && (
                <div className="admin-panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">Workshops</p>
                      <h2>Manage course schedules</h2>
                    </div>
                  </div>

                  <form className="admin-form" onSubmit={handleCourseSubmit}>
                    <h3>{editingCourseId ? 'Edit Course' : 'Add New Course'}</h3>

                    <div className="form-grid">
                      <div className="full-width">
                        <label htmlFor="course-title">Course Title *</label>
                        <input
                          id="course-title"
                          name="title"
                          required
                          value={courseForm.title}
                          onChange={handleCourseInputChange}
                          placeholder="e.g. Master Resin Clock Making"
                        />
                      </div>

                      <div>
                        <label htmlFor="course-date">Date *</label>
                        <input
                          id="course-date"
                          name="date"
                          type="date"
                          required
                          value={courseForm.date}
                          onChange={handleCourseInputChange}
                        />
                      </div>

                      <div>
                        <label htmlFor="course-time">Time</label>
                        <input
                          id="course-time"
                          name="time"
                          type="time"
                          value={courseForm.time}
                          onChange={handleCourseInputChange}
                        />
                      </div>

                      <div>
                        <label htmlFor="course-seats">Available Seats</label>
                        <input
                          id="course-seats"
                          name="seats"
                          type="number"
                          value={courseForm.seats}
                          onChange={handleCourseInputChange}
                          placeholder="e.g. 15"
                        />
                      </div>

                      <div className="full-width">
                        <label htmlFor="course-desc">Description</label>
                        <textarea
                          id="course-desc"
                          name="description"
                          rows="3"
                          value={courseForm.description}
                          onChange={handleCourseInputChange}
                          placeholder="Workshop curriculum and summary..."
                        />
                      </div>

                      <div className="full-width">
                        <label htmlFor="course-highlights">Highlights (comma separated)</label>
                        <input
                          id="course-highlights"
                          name="highlights"
                          value={courseForm.highlights}
                          onChange={handleCourseInputChange}
                          placeholder="Live demonstrations, All materials provided, Certificate"
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button className="button primary" type="submit">
                        {editingCourseId ? 'Update Course' : 'Create Course'}
                      </button>
                      {editingCourseId && (
                        <button className="button secondary" type="button" onClick={resetCourseForm}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Schedule</th>
                          <th>Seats</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((course) => (
                          <tr key={course.id}>
                            <td>
                              <strong>{course.title}</strong>
                            </td>
                            <td>
                              {course.date
                                ? new Date(course.date).toLocaleString('en-US', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })
                                : 'TBD'}
                            </td>
                            <td>{course.seats} seats</td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="action-btn edit"
                                  type="button"
                                  onClick={() => handleEditCourse(course)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="action-btn delete"
                                  type="button"
                                  onClick={() => handleDeleteCourse(course.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    )
  }

  if (viewMode === 'cart') {
    return (
      <div className="page-shell">
        {renderNavbar('cart')}
        <CartPage
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onContinueShopping={handleNavigateToStore}
          onAddToCart={handleAddToCart}
          productList={productList}
          customerProfile={customerProfile}
          onUpdateCustomerProfile={handleUpdateCustomerProfile}
          onNavigateToProfile={handleNavigateToProfile}
          onOrderPlaced={handleOrderPlaced}
        />
        {renderSnackbar()}
      </div>
    )
  }

  if (viewMode === 'profile') {
    return (
      <div className="page-shell">
        {renderNavbar('profile')}
        <CustomerProfilePage
          customerProfile={customerProfile}
          onUpdateCustomerProfile={handleUpdateCustomerProfile}
          orders={orders}
          onBackToShopping={handleNavigateToStore}
          onNavigateToCart={handleNavigateToCart}
          cartCount={cartCount}
        />
        {renderSnackbar()}
      </div>
    )
  }

  if (selectedProduct) {
    return (
      <div className="page-shell detail-page-shell">
        {renderNavbar('detail')}

        <main className="detail-page-container">
          <div className="detail-breadcrumbs">
            <button
              className="back-button"
              type="button"
              onClick={() => setSelectedProductId(null)}
            >
              ← Back to Gallery
            </button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-category">{selectedProduct.category || 'Resin Art'}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{selectedProduct.name}</span>
          </div>

          <section className="detail-card">
            <div className="detail-gallery-column">
              <div className="detail-image-wrap">
                <img
                  className="detail-image"
                  src={selectedProduct.image || DEFAULT_PRODUCT_IMAGE}
                  alt={selectedProduct.name}
                />
                {selectedProduct.badge && (
                  <span className="detail-badge">{selectedProduct.badge}</span>
                )}
              </div>

              <div className="detail-trust-pills">
                <div className="trust-pill">
                  <SparklesIcon size={15} color="#8b3ec4" />
                  <span>100% Hand-poured Resin</span>
                </div>
                <div className="trust-pill">
                  <TruckIcon size={15} color="#8b3ec4" />
                  <span>Fast Delivery in Bangladesh</span>
                </div>
                <div className="trust-pill">
                  <GiftIcon size={15} color="#8b3ec4" />
                  <span>Gift Wrapping Available</span>
                </div>
              </div>
            </div>

            <div className="detail-content">
              <div className="detail-header-row">
                <span className="detail-category-tag">
                  {selectedProduct.category || 'Signature Resin'}
                </span>
                <span className="detail-stock-badge">
                  <CheckCircleIcon size={13} color="#27ae60" /> In Stock & Ready to Ship
                </span>
              </div>

              <h1 className="detail-title">{selectedProduct.name}</h1>

              <div className="detail-price-banner">
                <span className="detail-price">{formatPrice(selectedProduct.price)}</span>
                <span className="detail-price-note">All taxes included • Express dispatch</span>
              </div>

              <p className="detail-description">
                {selectedProduct.description}
              </p>

              {Array.isArray(selectedProduct.features) && selectedProduct.features.length > 0 && (
                <div className="detail-features-wrap">
                  <h4 className="detail-features-heading">Key Highlights & Artistry:</h4>
                  <ul className="detail-features-grid">
                    {selectedProduct.features.map((feature, index) => (
                      <li key={`${feature}-${index}`} className="detail-feature-item">
                        <span className="feature-check-icon">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="detail-meta-cards">
                <div className="meta-card">
                  <div className="meta-card-header">
                    <SparklesIcon size={16} color="#8b3ec4" />
                    <strong>Material & Finish</strong>
                  </div>
                  <span>{selectedProduct.material || 'Epoxy Resin & Pressed Florals'}</span>
                </div>

                <div className="meta-card">
                  <div className="meta-card-header">
                    <PackageIcon size={16} color="#8b3ec4" />
                    <strong>Dimensions & Specs</strong>
                  </div>
                  <span>{selectedProduct.dimensions || 'Handcrafted Custom Size'}</span>
                </div>
              </div>

              <div className="detail-actions">
                <button
                  className="button primary detail-add-cart-btn"
                  type="button"
                  onClick={() => handleAddToCart(selectedProduct)}
                >
                  <CartIcon size={18} /> Add to Cart
                </button>

                <button
                  className="button secondary detail-go-cart-btn"
                  type="button"
                  onClick={handleNavigateToCart}
                >
                  <CartIcon size={16} /> Go to Cart {cartCount > 0 ? `(${cartCount})` : ''}
                </button>

                <button
                  className="button secondary detail-browse-btn"
                  type="button"
                  onClick={() => setSelectedProductId(null)}
                >
                  Browse More Pieces
                </button>
              </div>
            </div>
          </section>
        </main>
        {renderSnackbar()}
      </div>
    )
  }

  return (
    <div className="page-shell">
      {renderNavbar('public')}

      <main id="home">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">
              Handcrafted resin art • Made with love
            </p>

            <h1>Where Resin Becomes Timeless Art.</h1>

            <p className="hero-text">
              Discover dreamy resin trays, vases, and decor pieces designed to glow with personality.
            </p>

            <div className="hero-actions">
              <a className="button primary" href="#products">
                Shop collection
              </a>

              <a className="button secondary" href="#course">
                Join the course
              </a>
            </div>

            <div className="hero-badges">
              <span><SparklesIcon size={14} color="#8b3ec4" /> Premium finish</span>
              <span><TruckIcon size={14} color="#8b3ec4" /> Fast delivery</span>
              <span><PackageIcon size={14} color="#8b3ec4" /> Custom orders</span>
            </div>
          </div>

          <div className="hero-card">
            <img
              src={hero}
              alt="Bloom & Gloss Resin Collection"
            />
          </div>
        </section>

        <section className="products-section" id="products">
          <div className="section-heading">
            <p className="eyebrow">Featured pieces</p>
            <h2>Signature resin art for your home and gifting.</h2>
          </div>

          <div className="product-grid">
            {productList.map((product) => (
              <article className="product-card" key={product.id}>
                <div
                  className="image-wrap"
                  onClick={() => setSelectedProductId(product.id)}
                  title={`View ${product.name}`}
                >
                  <img
                    src={product.image || DEFAULT_PRODUCT_IMAGE}
                    alt={product.name}
                    loading="lazy"
                  />
                  {product.badge && <span className="badge">{product.badge}</span>}
                </div>

                <div className="product-info">
                  <div className="product-category-row">
                    <span className="product-category-pill">{product.category || 'Resin Decor'}</span>
                  </div>

                  <h3
                    className="product-title"
                    onClick={() => setSelectedProductId(product.id)}
                  >
                    {product.name}
                  </h3>

                  <div className="product-price-row">
                    <span className="product-price">{formatPrice(product.price)}</span>
                    <span className="product-artisan-tag">
                      <SparklesIcon size={12} color="#8b3ec4" /> Handcrafted
                    </span>
                  </div>

                  <div className="product-actions">
                    <button
                      className="button product-button primary add-cart-btn"
                      type="button"
                      onClick={() => handleAddToCart(product)}
                    >
                      <CartIcon size={15} /> Add to Cart
                    </button>

                    <button
                      className="button product-button secondary details-btn"
                      type="button"
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      Details
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="course-section" id="course">
          <div className="section-heading">
            <p className="eyebrow">Online courses</p>
            <h2>Upcoming classes</h2>
          </div>

          <div className="course-carousel">
            <div className="course-track">
              {courseCarouselItems.map((course, index) => {
                const courseTimeLeft = getTimeLeft(
                  new Date(course.date || currentTime)
                )

                const seatsAvailable = Number(course.seats || 0)

                const seatProgress = Math.min(
                  100,
                  Math.max(0, (seatsAvailable / 24) * 100)
                )

                return (
                  <article
                    className="course-card-wrapper"
                    key={`${course.id || course.title}-${index}`}
                  >
                    <div className="course-card">
                      <p className="eyebrow">Online course</p>

                      <h2>{course.title}</h2>

                      <p>{course.description}</p>

                      <ul className="course-highlights-grid">
                        {(Array.isArray(course.highlights)
                          ? course.highlights
                          : []
                        ).map((item, i) => (
                          <li key={`${item}-${i}`}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="course-stats">
                      <div className="countdown-card">
                        <p className="eyebrow">Next class</p>

                        <h3>
                          {course.date
                            ? new Date(course.date).toLocaleString(
                                'en-US',
                                {
                                  dateStyle: 'long',
                                  timeStyle: 'short',
                                }
                              )
                            : 'Date to be decided'}
                        </h3>

                        <div className="countdown-grid">
                          <div>
                            <strong>{courseTimeLeft.days}</strong>
                            <span>Days</span>
                          </div>

                          <div>
                            <strong>{courseTimeLeft.hours}</strong>
                            <span>Hours</span>
                          </div>

                          <div>
                            <strong>{courseTimeLeft.minutes}</strong>
                            <span>Mins</span>
                          </div>

                          <div>
                            <strong>{courseTimeLeft.seconds}</strong>
                            <span>Secs</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="button primary grab-seat-btn"
                          onClick={() => handleEnrollCourse(course)}
                        >
                          Grab your seat
                        </button>
                      </div>

                      <div className="seat-card">
                        <div className="seat-labels">
                          <strong>Seats available</strong>
                          <span>{seatsAvailable} left</span>
                        </div>

                        <div
                          className="seat-progress"
                          aria-label="Seats available"
                        >
                          <span
                            style={{
                              width: `${seatProgress}%`,
                            }}
                          />
                        </div>

                        <p>
                          Only a few places left for the next live cohort.
                        </p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="reviews-section" id="reviews">
          <div className="section-heading">
            <p className="eyebrow">Loved by customers</p>
            <h2>What creative souls are saying.</h2>
          </div>

          <div className="testimonial-marquee">
            <div className="testimonial-track">
              {[...testimonials, ...testimonials].map(
                (item, index) => (
                  <article
                    className="testimonial-card"
                    key={`${item.author}-${index}`}
                  >
                    <p>“{item.quote}”</p>
                    <strong>{item.author}</strong>
                  </article>
                )
              )}
            </div>
          </div>
        </section>

        <section className="newsletter-section" id="newsletter">
          <div>
            <p className="eyebrow">Stay inspired</p>
            <h2>
              Get first access to new art drops and course openings.
            </h2>
          </div>

          <form className="newsletter-form" onSubmit={handleSubscribeNewsletter}>
            <input
              type="email"
              placeholder="Enter your email address..."
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
            />

            <button type="submit">
              Subscribe
            </button>
          </form>
        </section>
      </main>

      <footer className="footer">
        <p>
          © 2026 Bloom & Gloss. Resin art for modern homes.
        </p>

        <div>
          <a href="#home">Home</a>
          <a href="#products">Shop</a>
          <a href="#course">Course</a>
        </div>
      </footer>
      {renderSnackbar()}
    </div>
  )
}

export default App