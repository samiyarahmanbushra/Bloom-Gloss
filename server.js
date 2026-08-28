import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
import dns from 'dns'

const fallbackProducts = []
const fallbackOrders = []
const fallbackCustomers = {}
const fallbackSubscribers = []

function normalizeImageSource(image) {
  if (image === null || image === undefined) {
    return ''
  }

  return String(image).trim()
}

function normalizeProductPayload(product) {
  const features = Array.isArray(product?.features)
    ? product.features
    : String(product?.features || '')
        .split(',')
        .map((feature) => feature.trim())
        .filter(Boolean)

  const timestampValue = product?.uploadedAt || product?.createdAt || product?.updatedAt
  const normalizedTimestamp = timestampValue ? new Date(timestampValue).toISOString() : new Date().toISOString()
  const image = normalizeImageSource(product?.image)

  return {
    ...product,
    id: product?.id || `product-${Date.now()}`,
    name: String(product?.name || '').trim(),
    price: String(product?.price || '').trim() || '৳0',
    category: String(product?.category || '').trim(),
    badge: String(product?.badge || '').trim() || 'New',
    image,
    description: String(product?.description || '').trim(),
    material: String(product?.material || '').trim(),
    dimensions: String(product?.dimensions || '').trim(),
    features,
    uploadedAt: normalizedTimestamp,
  }
}

dotenv.config()

function configureDnsForSrvLookup() {
  const servers = dns.getServers()
  if (servers.length === 0 || servers.every((server) => server === '127.0.0.1' || server === '::1')) {
    dns.setServers(['8.8.8.8', '1.1.1.1'])
  }
}

configureDnsForSrvLookup()

const app = express()
const port = Number(process.env.PORT || 5001)
const mongoUri = process.env.MONGODB_URI

if (!mongoUri) {
  console.warn('MONGODB_URI is not set. MongoDB client will not connect.')
}

const client = mongoUri
  ? new MongoClient(mongoUri, {
      tls: true,
      serverSelectionTimeoutMS: 10000,
    })
  : null
let isConnected = false

const dbName = 'bloom_and_gloss'
const db = client ? client.db(dbName) : null
const productsCollection = db ? db.collection('products') : null
const coursesCollection = db ? db.collection('courses') : null
const ordersCollection = db ? db.collection('orders') : null
const customersCollection = db ? db.collection('customers') : null
const subscribersCollection = db ? db.collection('subscribers') : null

export async function connectToMongoDB() {
  if (isConnected) {
    return client
  }

  if (!client) {
    console.warn('MONGODB_URI is missing!')
    isConnected = false
    return null
  }

  try {
    await client.connect()
    isConnected = true
    console.log('You successfully connected to MongoDB!')
    return client
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    isConnected = false
    return null
  }
}

export async function disconnectFromMongoDB() {
  if (!isConnected || !client) {
    return
  }

  await client.close()
  isConnected = false
}

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, database: isConnected })
})

app.get('/api/products', async (_req, res) => {
  try {
    const connectedClient = await connectToMongoDB()
    const products = !connectedClient || !productsCollection
      ? fallbackProducts
      : await productsCollection.find({}).sort({ name: 1 }).toArray()

    const sanitizedProducts = products.map((product) => normalizeProductPayload(product))
    return res.json(sanitizedProducts)
  } catch (error) {
    console.error('Error fetching products:', error)
    const sanitizedProducts = fallbackProducts.map((product) => normalizeProductPayload(product))
    return res.json(sanitizedProducts)
  }
})

app.post('/api/products', async (req, res) => {
  try {
    const connectedClient = await connectToMongoDB()
    const product = normalizeProductPayload(req.body)

    if (!connectedClient || !productsCollection) {
      fallbackProducts.push(product)
      return res.status(201).json(product)
    }

    await productsCollection.insertOne(product)
    return res.status(201).json(product)
  } catch (error) {
    console.error('Error creating product:', error)
    return res.status(500).json({ error: 'Unable to create product' })
  }
})

app.put('/api/products/:id', async (req, res) => {
  try {
    const connectedClient = await connectToMongoDB()
    const product = normalizeProductPayload({ ...req.body, id: req.params.id })

    if (!connectedClient || !productsCollection) {
      const index = fallbackProducts.findIndex((item) => item.id === req.params.id)
      if (index >= 0) {
        fallbackProducts[index] = product
      } else {
        fallbackProducts.push(product)
      }
      return res.json(product)
    }

    delete product._id

    await productsCollection.updateOne({ id: req.params.id }, { $set: product }, { upsert: true })
    return res.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return res.status(500).json({ error: 'Unable to update product' })
  }
})

app.delete('/api/products/:id', async (req, res) => {
  try {
    const connectedClient = await connectToMongoDB()
    if (!connectedClient || !productsCollection) {
      const nextProducts = fallbackProducts.filter((product) => product.id !== req.params.id)
      fallbackProducts.splice(0, fallbackProducts.length, ...nextProducts)
      return res.json({ ok: true })
    }

    await productsCollection.deleteOne({ id: req.params.id })
    return res.json({ ok: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return res.status(500).json({ error: 'Unable to delete product' })
  }
})

app.get('/api/courses', async (_req, res) => {
  try {
    const connectedClient = await connectToMongoDB()
    if (!connectedClient) {
       return res.status(500).json({ error: 'Database not connected' })
    }

    const courses = await coursesCollection.find({}).sort({ date: 1 }).toArray()
    return res.json(courses)
  } catch (error) {
    console.error('Error fetching courses:', error)
    return res.status(500).json({ error: 'Unable to fetch courses' })
  }
})

app.post('/api/courses', async (req, res) => {
  try {
    const connectedClient = await connectToMongoDB()
    if (!connectedClient) {
       return res.status(500).json({ error: 'Database not connected' })
    }
    
    const course = {
      ...req.body,
      id: req.body.id || `course-${Date.now()}`,
    }

    await coursesCollection.insertOne(course)
    return res.status(201).json(course)
  } catch (error) {
    console.error('Error creating course:', error)
    return res.status(500).json({ error: 'Unable to create course' })
  }
})

app.put('/api/courses/:id', async (req, res) => {
  try {
    const connectedClient = await connectToMongoDB()
    if (!connectedClient) {
       return res.status(500).json({ error: 'Database not connected' })
    }
    
    const course = {
      ...req.body,
      id: req.params.id,
    }

    delete course._id

    await coursesCollection.updateOne({ id: req.params.id }, { $set: course }, { upsert: true })
    return res.json(course)
  } catch (error) {
    console.error('Error updating course:', error)
    return res.status(500).json({ error: 'Unable to update course' })
  }
})

app.delete('/api/courses/:id', async (req, res) => {
  try {
    const connectedClient = await connectToMongoDB()
    if (!connectedClient) {
       return res.status(500).json({ error: 'Database not connected' })
    }
    
    await coursesCollection.deleteOne({ id: req.params.id })
    return res.json({ ok: true })
  } catch (error) {
    console.error('Error deleting course:', error)
    return res.status(500).json({ error: 'Unable to delete course' })
  }
})

// Orders Endpoints
app.get('/api/orders', async (req, res) => {
  try {
    const email = req.query.email ? String(req.query.email).trim().toLowerCase() : null
    const connectedClient = await connectToMongoDB()

    if (!connectedClient || !ordersCollection) {
      if (email) {
        const filtered = fallbackOrders.filter(
          (o) => o.customer?.email?.toLowerCase() === email
        )
        return res.json(filtered)
      }
      return res.json(fallbackOrders)
    }

    const query = email ? { 'customer.email': { $regex: new RegExp(`^${email}$`, 'i') } } : {}
    const orders = await ordersCollection.find(query).sort({ createdAt: -1 }).toArray()
    return res.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return res.status(500).json({ error: 'Unable to fetch orders' })
  }
})

app.post('/api/orders', async (req, res) => {
  try {
    const connectedClient = await connectToMongoDB()
    const order = {
      ...req.body,
      id: req.body.id || `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
      status: req.body.status || 'Confirmed',
    }

    if (!connectedClient || !ordersCollection) {
      fallbackOrders.unshift(order)
      return res.status(201).json(order)
    }

    await ordersCollection.insertOne(order)
    return res.status(201).json(order)
  } catch (error) {
    console.error('Error placing order:', error)
    return res.status(500).json({ error: 'Unable to place order' })
  }
})

// Customer Profiles Endpoints
app.get('/api/customers/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).trim().toLowerCase()
    const connectedClient = await connectToMongoDB()

    if (!connectedClient || !customersCollection) {
      const customer = fallbackCustomers[email] || null
      return res.json(customer)
    }

    const customer = await customersCollection.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') },
    })
    return res.json(customer || null)
  } catch (error) {
    console.error('Error fetching customer profile:', error)
    return res.status(500).json({ error: 'Unable to fetch customer' })
  }
})

app.put('/api/customers/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).trim().toLowerCase()
    const connectedClient = await connectToMongoDB()
    const customer = {
      ...req.body,
      email,
      updatedAt: new Date().toISOString(),
    }

    delete customer._id

    if (!connectedClient || !customersCollection) {
      fallbackCustomers[email] = customer
      return res.json(customer)
    }

    await customersCollection.updateOne(
      { email: { $regex: new RegExp(`^${email}$`, 'i') } },
      { $set: customer },
      { upsert: true }
    )
    return res.json(customer)
  } catch (error) {
    console.error('Error updating customer profile:', error)
    return res.status(500).json({ error: 'Unable to update customer' })
  }
})

// Newsletter Subscription Endpoint
app.post('/api/newsletter', async (req, res) => {
  try {
    const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : ''
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' })
    }

    const connectedClient = await connectToMongoDB()
    const subscriber = {
      email,
      subscribedAt: new Date().toISOString(),
      promoCodeSent: 'BLOOM10',
    }

    if (!connectedClient || !subscribersCollection) {
      if (!fallbackSubscribers.some((s) => s.email === email)) {
        fallbackSubscribers.push(subscriber)
      }
      return res.status(201).json({ ok: true, promoCode: 'BLOOM10', message: 'Subscribed successfully!' })
    }

    await subscribersCollection.updateOne(
      { email },
      { $set: subscriber },
      { upsert: true }
    )

    return res.status(201).json({ ok: true, promoCode: 'BLOOM10', message: 'Subscribed successfully!' })
  } catch (error) {
    console.error('Error subscribing to newsletter:', error)
    return res.status(500).json({ error: 'Unable to subscribe' })
  }
})


const startServer = async () => {
  await connectToMongoDB()

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
  })
}

startServer().catch((error) => {
  console.error('Server startup failed:', error)
  process.exit(1)
})

process.on('SIGINT', async () => {
  await disconnectFromMongoDB()
  process.exit(0)
})
