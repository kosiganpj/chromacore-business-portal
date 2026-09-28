import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import api from './api'

function Nav() {
  const token = localStorage.getItem('cc_token')
  const role = localStorage.getItem('cc_role')
  const nav = useNavigate()

  const logout = () => {
    localStorage.removeItem('cc_token')
    localStorage.removeItem('cc_role')
    localStorage.removeItem('cc_cart')
    nav('/')
  }

  return (
    <nav>
      <Link className="brand" to="/">
        ChromaCore
      </Link>

      <div className="navlinks">
        <Link to="/products">Products</Link>
        <Link to="/shades">Shade Cards</Link>

        {!token && <Link to="/login">Login</Link>}

        {!token && (
          <Link className="button" to="/register">
            Register
          </Link>
        )}

        {token && role === 'CUSTOMER' && (
          <Link to="/customer">Dashboard</Link>
        )}

        {token && role === 'ADMIN' && (
          <Link to="/admin">Admin</Link>
        )}

        {token && (
          <button
            className="linkbtn"
            onClick={logout}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  )
}

function Home() {
  return (
    <main className="hero">
      <div>
        <span className="eyebrow">
          DYES • CHEMICALS • B2B SUPPLY
        </span>

        <h1>ChromaCore Dyes & Chemicals</h1>

        <p>
          Digital product catalogue, shade cards, customer orders,
          invoices and order tracking in one place.
        </p>

        <div className="actions">
          <Link className="button" to="/products">
            Explore Products
          </Link>

          <Link className="button secondary" to="/register">
            Create Customer Account
          </Link>
        </div>
      </div>
    </main>
  )
}

/* ============================================================
   PRODUCTS + CUSTOMER CART
   ============================================================ */

function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cc_cart')
      return savedCart ? JSON.parse(savedCart) : []
    } catch {
      return []
    }
  })

  const [shippingAddress, setShippingAddress] = useState('')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderMessage, setOrderMessage] = useState('')
  const [orderError, setOrderError] = useState('')

  const token = localStorage.getItem('cc_token')
  const role = localStorage.getItem('cc_role')
  const isCustomer = token && role === 'CUSTOMER'

  useEffect(() => {
    localStorage.setItem(
      'cc_cart',
      JSON.stringify(cart)
    )
  }, [cart])

  useEffect(() => {
    let active = true

    const fetchProducts = async () => {
      try {
        const r = await api.get('/products/public')

        if (active) {
          setProducts(r.data)
        }
      } catch (e) {
        console.error('Products API error:', e)

        if (active) {
          setError(
            e.response?.data?.message ||
            e.message ||
            'Failed to load products'
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchProducts()

    return () => {
      active = false
    }
  }, [])

  function getAvailableQuantity(product) {
    return Number(
      product.availableQuantity ??
      product.stockQuantity ??
      0
    )
  }

  function addToCart(product) {
    setOrderMessage('')
    setOrderError('')

    const available = getAvailableQuantity(product)

    if (available <= 0) {
      setOrderError(
        `${product.name} is currently out of stock.`
      )
      return
    }

    setCart(current => {
      const existing = current.find(
        item => item.product.id === product.id
      )

      if (existing) {
        const currentQuantity =
          Number(existing.quantity) || 0

        if (currentQuantity >= available) {
          setOrderError(
            `Maximum available quantity for ${product.name} is ${available}.`
          )

          return current
        }

        return current.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: currentQuantity + 1
              }
            : item
        )
      }

      return [
        ...current,
        {
          product,
          quantity: 1
        }
      ]
    })
  }

  function updateCartQuantity(productId, quantity) {
    if (quantity === '') {
      setCart(current =>
        current.map(item =>
          item.product.id === productId
            ? {
                ...item,
                quantity: ''
              }
            : item
        )
      )

      return
    }

    const q = Number(quantity)

    if (!Number.isFinite(q)) {
      return
    }

    if (q <= 0) {
      setCart(current =>
        current.map(item =>
          item.product.id === productId
            ? {
                ...item,
                quantity: 1
              }
            : item
        )
      )

      return
    }

    setCart(current =>
      current.map(item => {
        if (item.product.id !== productId) {
          return item
        }

        const available = getAvailableQuantity(
          item.product
        )

        if (available <= 0) {
          return {
            ...item,
            quantity: 1
          }
        }

        if (q > available) {
          return {
            ...item,
            quantity: available
          }
        }

        return {
          ...item,
          quantity: q
        }
      })
    )
  }

  function finishCartQuantityEdit(productId) {
    setCart(current => {
      const item = current.find(
        item => item.product.id === productId
      )

      if (!item) {
        return current
      }

      const available = getAvailableQuantity(
        item.product
      )

      if (available <= 0) {
        return current
      }

      let q = Number(item.quantity)

      if (!Number.isFinite(q) || q <= 0) {
        q = 1
      }

      if (q > available) {
        q = available
      }

      return current.map(cartItem =>
        cartItem.product.id === productId
          ? {
              ...cartItem,
              quantity: q
            }
          : cartItem
      )
    })
  }

  function removeFromCart(productId) {
    setCart(current =>
      current.filter(
        item => item.product.id !== productId
      )
    )
  }

  function productPrice(product) {
    return Number(product.price || 0)
  }

  const categories = [
    'ALL',
    ...new Set(
      products
        .map(p => p.category)
        .filter(Boolean)
    )
  ]

  const filteredProducts = products.filter(p => {
    const searchText = search
      .trim()
      .toLowerCase()

    const matchesSearch =
      !searchText ||
      p.name?.toLowerCase().includes(searchText) ||
      p.code?.toLowerCase().includes(searchText) ||
      p.category?.toLowerCase().includes(searchText) ||
      p.shade?.toLowerCase().includes(searchText) ||
      p.application?.toLowerCase().includes(searchText)

    const matchesCategory =
      category === 'ALL' ||
      p.category === category

    return (
      matchesSearch &&
      matchesCategory
    )
  })

  const cartTotal = cart.reduce(
    (sum, item) => {
      const quantity = Number(item.quantity)

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        return sum
      }

      return (
        sum +
        productPrice(item.product) *
          quantity
      )
    },
    0
  )

  async function placeOrder() {
    setOrderMessage('')
    setOrderError('')

    if (!isCustomer) {
      setOrderError(
        'Please login with a customer account before placing an order.'
      )
      return
    }

    if (cart.length === 0) {
      setOrderError(
        'Please add at least one product to your cart.'
      )
      return
    }

    if (!shippingAddress.trim()) {
      setOrderError(
        'Please enter the shipping address.'
      )
      return
    }

    for (const item of cart) {
      const quantity = Number(item.quantity)

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        setOrderError(
          `Please enter a valid quantity for ${item.product.name}.`
        )
        return
      }

      const available = getAvailableQuantity(
        item.product
      )

      if (
        available <= 0 ||
        quantity > available
      ) {
        setOrderError(
          `Insufficient stock for ${item.product.name}. Available: ${available}`
        )
        return
      }
    }

    setPlacingOrder(true)

    try {
      const payload = {
        shippingAddress: shippingAddress.trim(),
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: Number(item.quantity)
        }))
      }

      const r = await api.post(
        '/orders',
        payload
      )

      setCart([])
      localStorage.removeItem('cc_cart')
      setShippingAddress('')

      setOrderMessage(
        `Order ${r.data?.orderNumber || ''} placed successfully.`
      )

      const productsResponse =
        await api.get('/products/public')

      setProducts(
        productsResponse.data
      )
    } catch (e) {
      console.error(
        'Create order error:',
        e
      )

      setOrderError(
        e.response?.data?.message ||
        e.response?.data ||
        e.message ||
        'Failed to place order'
      )
    } finally {
      setPlacingOrder(false)
    }
  }

  function clearFilters() {
    setSearch('')
    setCategory('ALL')
  }

  return (
    <main className="container">
      <h2>Products</h2>

      {loading && (
        <p>Loading products...</p>
      )}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        products.length === 0 && (
          <p>No products available.</p>
        )}

      {!loading &&
        !error &&
        products.length > 0 && (
          <section className="card">
            <h3>Find Products</h3>

            <div className="formgrid">
              <input
                type="text"
                placeholder="Search by product, code, category, shade or application..."
                value={search}
                onChange={e =>
                  setSearch(e.target.value)
                }
              />

              <select
                value={category}
                onChange={e =>
                  setCategory(e.target.value)
                }
              >
                {categories.map(c => (
                  <option
                    key={c}
                    value={c}
                  >
                    {c === 'ALL'
                      ? 'All Categories'
                      : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="actions">
              <p>
                Showing{' '}
                <b>
                  {filteredProducts.length}
                </b>{' '}
                of{' '}
                <b>{products.length}</b>{' '}
                products
              </p>

              {(search ||
                category !== 'ALL') && (
                <button
                  type="button"
                  className="linkbtn"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </section>
        )}

      {isCustomer && (
        <section className="card">
          <h3>Shopping Cart</h3>

          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              <div className="table">
                {cart.map(item => (
                  <div
                    className="tr"
                    key={item.product.id}
                  >
                    <span>
                      <b>
                        {item.product.name}
                      </b>
                      <br />
                      {item.product.code}
                    </span>

                    <span>
                      ₹{' '}
                      {productPrice(
                        item.product
                      ).toFixed(2)}
                    </span>

                    <input
                      type="number"
                      min="1"
                      max={getAvailableQuantity(
                        item.product
                      )}
                      value={item.quantity}
                      onChange={e =>
                        updateCartQuantity(
                          item.product.id,
                          e.target.value
                        )
                      }
                      onBlur={() =>
                        finishCartQuantityEdit(
                          item.product.id
                        )
                      }
                    />

                    <span>
                      ₹{' '}
                      {(
                        productPrice(
                          item.product
                        ) *
                        Number(
                          item.quantity || 0
                        )
                      ).toFixed(2)}
                    </span>

                    <button
                      type="button"
                      className="linkbtn"
                      onClick={() =>
                        removeFromCart(
                          item.product.id
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <h3>
                Total: ₹{' '}
                {cartTotal.toFixed(2)}
              </h3>

              <textarea
                placeholder="Shipping address"
                value={shippingAddress}
                onChange={e =>
                  setShippingAddress(
                    e.target.value
                  )
                }
                rows="4"
              />

              {orderError && (
                <div className="error">
                  {orderError}
                </div>
              )}

              {orderMessage && (
                <div className="success">
                  {orderMessage}
                </div>
              )}

              <button
                type="button"
                className="button"
                onClick={placeOrder}
                disabled={placingOrder}
              >
                {placingOrder
                  ? 'Placing Order...'
                  : 'Place Order'}
              </button>
            </>
          )}

          {cart.length === 0 && (
            <>
              {orderError && (
                <div className="error">
                  {orderError}
                </div>
              )}

              {orderMessage && (
                <div className="success">
                  {orderMessage}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {!isCustomer && (
        <div className="card">
          <p>
            Login as a customer to add products to
            your cart and place orders.
          </p>

          <Link
            className="button"
            to="/login"
          >
            Customer Login
          </Link>
        </div>
      )}

      {!loading &&
        !error &&
        products.length > 0 &&
        filteredProducts.length === 0 && (
          <div className="card">
            <p>
              No products match your search.
            </p>

            <button
              type="button"
              className="button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        )}

      <div className="grid">
        {filteredProducts.map(p => {
          const available =
            getAvailableQuantity(p)

          const cartItem = cart.find(
            item =>
              item.product.id === p.id
          )

          const cartQuantity =
            cartItem
              ? Number(
                  cartItem.quantity || 0
                )
              : 0

          const maxReached =
            cartQuantity >= available

          return (
            <div
              className="card"
              key={p.id}
            >
              <div className="productimg">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                  />
                ) : (
                  <span>
                    {p.shade ||
                      'CHEMICAL'}
                  </span>
                )}
              </div>

              <h3>{p.name}</h3>

              <p>
                {p.code} • {p.category}
              </p>

              <p>
                {p.description ||
                  'B2B dye/chemical product.'}
              </p>

              <p>
                Price:{' '}
                <b>
                  ₹{' '}
                  {productPrice(
                    p
                  ).toFixed(2)}
                </b>
              </p>

              <p>
                Available:{' '}
                <b>
                  {available}
                </b>
              </p>

              <span
                className={`status ${
                  p.status?.toLowerCase() ||
                  ''
                }`}
              >
                {p.status?.replace(
                  '_',
                  ' '
                )}
              </span>

              {isCustomer && (
                <button
                  type="button"
                  className="button"
                  disabled={
                    p.status !==
                      'AVAILABLE' ||
                    available <= 0 ||
                    maxReached
                  }
                  onClick={() =>
                    addToCart(p)
                  }
                >
                  {maxReached
                    ? 'Max Quantity Added'
                    : 'Add to Cart'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}

/* ============================================================
   PUBLIC SHADE CARDS
   ============================================================ */

function Shades() {
  const [shades, setShades] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const fetchShades = async () => {
      try {
        const r = await api.get(
          '/shades/public'
        )

        if (active) {
          setShades(r.data)
        }
      } catch (e) {
        console.error(
          'Shades API error:',
          e
        )

        if (active) {
          setError(
            e.response?.data?.message ||
            e.message ||
            'Failed to load shade cards'
          )
        }
      }
    }

    fetchShades()

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="container">
      <h2>Digital Shade Cards</h2>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {!error &&
        shades.length === 0 && (
          <p>
            No shade cards available.
          </p>
        )}

      <div className="grid">
        {shades.map(s => (
          <div
            className="card"
            key={s.id}
          >
            {s.imageUrl ? (
              <img
                className="shadeimg"
                src={s.imageUrl}
                alt={s.shadeName}
              />
            ) : (
              <div className="shadeplaceholder">
                {s.shadeName}
              </div>
            )}

            <h3>{s.shadeName}</h3>

            <p>
              {s.shadeCode} • {s.category}
            </p>

            <p>
              Product:{' '}
              {s.product?.name || '-'}
            </p>

            <span
              className={`status ${
                s.product?.status?.toLowerCase() ||
                ''
              }`}
            >
              {s.product?.status?.replace(
                '_',
                ' '
              ) || '-'}
            </span>
          </div>
        ))}
      </div>
    </main>
  )
}

function Login() {
  const [form, setForm] = useState({
    email: '',
    password: ''
  })

  const [err, setErr] = useState('')
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setErr('')

    try {
      const r = await api.post(
        '/auth/login',
        form
      )

      localStorage.setItem(
        'cc_token',
        r.data.token
      )

      localStorage.setItem(
        'cc_role',
        r.data.role
      )

      nav(
        r.data.role === 'ADMIN'
          ? '/admin'
          : '/customer'
      )
    } catch (e) {
      setErr(
        e.response?.data?.message ||
        'Login failed'
      )
    }
  }

  return (
    <main className="auth">
      <form
        className="card"
        onSubmit={submit}
      >
        <h2>Login</h2>

        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={e =>
            setForm({
              ...form,
              email: e.target.value
            })
          }
          required
        />

        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={e =>
            setForm({
              ...form,
              password: e.target.value
            })
          }
          required
        />

        {err && (
          <div className="error">
            {err}
          </div>
        )}

        <button className="button">
          Login
        </button>
      </form>
    </main>
  )
}

function Register() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    companyName: '',
    contactName: '',
    phone: '',
    gstNumber: '',
    address: '',
    city: '',
    state: ''
  })

  const nav = useNavigate()
  const [err, setErr] = useState('')

  const set = (k, v) =>
    setForm({
      ...form,
      [k]: v
    })

  async function submit(e) {
    e.preventDefault()
    setErr('')

    try {
      const r = await api.post(
        '/auth/register',
        form
      )

      localStorage.setItem(
        'cc_token',
        r.data.token
      )

      localStorage.setItem(
        'cc_role',
        r.data.role
      )

      nav('/customer')
    } catch (e) {
      setErr(
        e.response?.data?.message ||
        'Registration failed'
      )
    }
  }

  return (
    <main className="auth">
      <form
        className="card wide"
        onSubmit={submit}
      >
        <h2>Create Customer Account</h2>

        {Object.keys(form).map(k => (
          <input
            key={k}
            type={
              k === 'password'
                ? 'password'
                : k === 'email'
                  ? 'email'
                  : 'text'
            }
            placeholder={k}
            value={form[k]}
            onChange={e =>
              set(
                k,
                e.target.value
              )
            }
            required={[
              'email',
              'password',
              'companyName'
            ].includes(k)}
          />
        ))}

        {err && (
          <div className="error">
            {err}
          </div>
        )}

        <button className="button">
          Register
        </button>
      </form>
    </main>
  )
}

/* ============================================================
   CUSTOMER DASHBOARD + ORDER TRACKING
   ============================================================ */

function Customer() {
  const [me, setMe] = useState(null)
  const [orders, setOrders] = useState([])
  const [invoices, setInvoices] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const fetchCustomerData = async () => {
      try {
        const [
          a,
          b,
          c
        ] = await Promise.all([
          api.get('/customer/me'),
          api.get('/customer/orders'),
          api.get('/customer/invoices')
        ])

        if (active) {
          setMe(a.data)
          setOrders(b.data)
          setInvoices(c.data)
        }
      } catch (e) {
        console.error(
          'Customer API error:',
          e
        )

        if (active) {
          setError(
            e.response?.data?.message ||
            e.message ||
            'Failed to load customer dashboard'
          )
        }
      }
    }

    fetchCustomerData()

    return () => {
      active = false
    }
  }, [])

  const welcomeName =
    me?.companyName ||
    me?.email ||
    'Customer'

  const statusSteps = [
    'PLACED',
    'CONFIRMED',
    'PROCESSING',
    'PACKED',
    'DISPATCHED',
    'IN_TRANSIT',
    'DELIVERED'
  ]

  function getStatusIndex(status) {
    return statusSteps.indexOf(status)
  }

  function formatStatus(status) {
    return (
      status
        ?.replaceAll('_', ' ')
        ?.toLowerCase()
        ?.replace(/\b\w/g, c =>
          c.toUpperCase()
        ) || '-'
    )
  }

  return (
    <main className="container">
      <h2>Customer Dashboard</h2>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {me && (
        <p>
          Welcome, <b>{welcomeName}</b>
        </p>
      )}

      <div className="stats">
        <div className="stat">
          <b>{orders.length}</b>
          <span>Orders</span>
        </div>

        <div className="stat">
          <b>{invoices.length}</b>
          <span>Invoices</span>
        </div>
      </div>

      <h3>Order Tracking</h3>

      {orders.length === 0 ? (
        <div className="card">
          <p>No orders yet.</p>

          <Link
            className="button"
            to="/products"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid">
          {orders.map(o => {
            const currentIndex =
              getStatusIndex(o.status)

            const cancelled =
              o.status === 'CANCELLED'

            return (
              <div
                className="card"
                key={o.id}
              >
                <h3>
                  {o.orderNumber}
                </h3>

                <p>
                  <b>Order Total:</b> ₹{' '}
                  {Number(
                    o.totalAmount || 0
                  ).toFixed(2)}
                </p>

                <p>
                  <b>Current Status:</b>{' '}
                  <span
                    className={`status ${
                      o.status?.toLowerCase() ||
                      ''
                    }`}
                  >
                    {formatStatus(
                      o.status
                    )}
                  </span>
                </p>

                {o.trackingNumber && (
                  <p>
                    <b>Tracking Number:</b>{' '}
                    {o.trackingNumber}
                  </p>
                )}

                {cancelled ? (
                  <div className="error">
                    This order has been
                    cancelled.
                  </div>
                ) : (
                  <>
                    <p>
                      <b>Order Progress</b>
                    </p>

                    <div className="table">
                      {statusSteps.map(
                        (
                          step,
                          index
                        ) => (
                          <div
                            className="tr"
                            key={step}
                          >
                            <span>
                              {index <=
                              currentIndex
                                ? '✓'
                                : '○'}
                            </span>

                            <span>
                              {formatStatus(
                                step
                              )}
                            </span>

                            <span>
                              {index <=
                              currentIndex
                                ? 'Completed'
                                : index ===
                                    currentIndex +
                                      1
                                  ? 'Next'
                                  : 'Pending'}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      <h3>Invoices</h3>

      <div className="table">
        {invoices.length === 0 ? (
          <p>No invoices yet.</p>
        ) : (
          invoices.map(i => (
            <div
              className="tr"
              key={i.id}
            >
              <span>
                {i.invoiceNumber}
              </span>

              <span>
                ₹{' '}
                {Number(
                  i.amount || 0
                ).toFixed(2)}
              </span>

              <span>
                Outstanding ₹{' '}
                {Number(
                  i.outstanding || 0
                ).toFixed(2)}
              </span>

              <a
                href={`https://chromacore-business-portal-1.onrender.com/api/customer/invoices/${i.id}/pdf`}
                target="_blank"
                rel="noreferrer"
              >
                PDF
              </a>
            </div>
          ))
        )}
      </div>
    </main>
  )
}

/* ============================================================
   ADMIN DASHBOARD
   ============================================================ */

function Admin() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [shades, setShades] = useState([])

  const [loadingProducts, setLoadingProducts] =
    useState(true)

  const [loadingOrders, setLoadingOrders] =
    useState(true)

  const [loadingCustomers, setLoadingCustomers] =
    useState(true)

  const [loadingShades, setLoadingShades] =
    useState(true)

  const [productError, setProductError] =
    useState('')

  const [orderError, setOrderError] =
    useState('')

  const [customerError, setCustomerError] =
    useState('')

  const [shadeError, setShadeError] =
    useState('')

  const [newP, setNewP] = useState({
    code: '',
    name: '',
    category: 'Reactive Dyes',
    description: '',
    shade: '',
    application: '',
    packing: '25 KG / 50 KG',
    imageUrl: '',
    price: 0,
    stockQuantity: 0,
    minimumStock: 0
  })

  const [stock, setStock] = useState({})

  const [editingProduct, setEditingProduct] =
    useState(null)

  const [savingProduct, setSavingProduct] =
    useState(false)

  /* ==========================================================
     SHADE CARD STATE
     ========================================================== */

  const [newShade, setNewShade] = useState({
    shadeCode: '',
    shadeName: '',
    imageUrl: '',
    category: '',
    productId: '',
    active: true
  })

  const [editingShade, setEditingShade] =
    useState(null)

  const [savingShade, setSavingShade] =
    useState(false)

  async function loadProducts() {
    setLoadingProducts(true)
    setProductError('')

    try {
      const r =
        await api.get('/admin/products')

      setProducts(r.data)
    } catch (e) {
      console.error(
        'Admin products API error:',
        e
      )

      setProductError(
        e.response?.data?.message ||
        e.message ||
        'Failed to load products'
      )
    } finally {
      setLoadingProducts(false)
    }
  }

  async function loadOrders() {
    setLoadingOrders(true)
    setOrderError('')

    try {
      const r =
        await api.get('/admin/orders')

      setOrders(r.data)
    } catch (e) {
      console.error(
        'Admin orders API error:',
        e
      )

      setOrderError(
        e.response?.data?.message ||
        e.message ||
        'Failed to load orders'
      )
    } finally {
      setLoadingOrders(false)
    }
  }

  async function loadCustomers() {
    setLoadingCustomers(true)
    setCustomerError('')

    try {
      const r =
        await api.get('/admin/customers')

      setCustomers(r.data)
    } catch (e) {
      console.error(
        'Admin customers API error:',
        e
      )

      setCustomerError(
        e.response?.data?.message ||
        e.message ||
        'Failed to load customers'
      )
    } finally {
      setLoadingCustomers(false)
    }
  }

  async function loadShades() {
    setLoadingShades(true)
    setShadeError('')

    try {
      const r =
        await api.get('/shades')

      setShades(r.data)
    } catch (e) {
      console.error(
        'Admin shades API error:',
        e
      )

      setShadeError(
        e.response?.data?.message ||
        e.message ||
        'Failed to load shade cards'
      )
    } finally {
      setLoadingShades(false)
    }
  }

  async function load() {
    await Promise.all([
      loadProducts(),
      loadOrders(),
      loadCustomers(),
      loadShades()
    ])
  }

  useEffect(() => {
    load()
  }, [])

  const setP = (k, v) => {
    setNewP({
      ...newP,
      [k]: v
    })
  }

  async function addProduct(e) {
    e.preventDefault()

    try {
      await api.post(
        '/admin/products',
        {
          ...newP,
          price: Number(newP.price),
          stockQuantity:
            Number(
              newP.stockQuantity
            ),
          minimumStock:
            Number(
              newP.minimumStock
            )
        }
      )

      alert(
        'Product added successfully'
      )

      setNewP({
        code: '',
        name: '',
        category: 'Reactive Dyes',
        description: '',
        shade: '',
        application: '',
        packing: '25 KG / 50 KG',
        imageUrl: '',
        price: 0,
        stockQuantity: 0,
        minimumStock: 0
      })

      await loadProducts()
    } catch (e) {
      console.error(
        'Add product error:',
        e
      )

      alert(
        e.response?.data?.message ||
        'Failed to add product'
      )
    }
  }

  function startEditProduct(product) {
    setEditingProduct({
      id: product.id,
      code: product.code || '',
      name: product.name || '',
      category:
        product.category || '',
      description:
        product.description || '',
      shade: product.shade || '',
      application:
        product.application || '',
      packing:
        product.packing || '',
      imageUrl:
        product.imageUrl || '',
      price: Number(
        product.price || 0
      ),
      stockQuantity: Number(
        product.stockQuantity || 0
      ),
      minimumStock: Number(
        product.minimumStock || 0
      )
    })
  }

  function cancelEditProduct() {
    setEditingProduct(null)
  }

  function setEditProductField(
    key,
    value
  ) {
    setEditingProduct(
      current => ({
        ...current,
        [key]: value
      })
    )
  }

  async function saveProduct(e) {
    e.preventDefault()

    if (!editingProduct) {
      return
    }

    const price = Number(
      editingProduct.price
    )

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      alert(
        'Enter a valid product price.'
      )
      return
    }

    setSavingProduct(true)

    try {
      const payload = {
        code: editingProduct.code,
        name: editingProduct.name,
        category:
          editingProduct.category,
        description:
          editingProduct.description,
        shade:
          editingProduct.shade,
        application:
          editingProduct.application,
        packing:
          editingProduct.packing,
        imageUrl:
          editingProduct.imageUrl,
        price,
        stockQuantity:
          Number(
            editingProduct.stockQuantity
          ),
        minimumStock:
          Number(
            editingProduct.minimumStock
          )
      }

      await api.put(
        `/admin/products/${editingProduct.id}`,
        payload
      )

      alert(
        'Product updated successfully'
      )

      setEditingProduct(null)

      await loadProducts()
    } catch (e) {
      console.error(
        'Update product error:',
        e
      )

      alert(
        e.response?.data?.message ||
        e.response?.data ||
        'Failed to update product'
      )
    } finally {
      setSavingProduct(false)
    }
  }

  async function adjust(
    id,
    delta
  ) {
    const q = Number(
      stock[id]?.quantity || 0
    )

    if (!q || q <= 0) {
      alert(
        'Enter a valid quantity'
      )
      return
    }

    const reason =
      stock[id]?.reason ||
      'Manual stock adjustment'

    try {
      await api.post(
        `/admin/products/${id}/stock/${
          delta > 0
            ? 'add'
            : 'remove'
        }`,
        {
          quantity: q,
          reason
        }
      )

      alert(
        delta > 0
          ? 'Stock added successfully'
          : 'Stock removed successfully'
      )

      setStock({
        ...stock,
        [id]: {}
      })

      await loadProducts()
    } catch (e) {
      console.error(
        'Stock adjustment error:',
        e
      )

      alert(
        e.response?.data?.message ||
        'Failed to adjust stock'
      )
    }
  }

  async function deactivate(id) {
    if (
      !confirm(
        'Deactivate this product?'
      )
    ) {
      return
    }

    try {
      await api.delete(
        `/admin/products/${id}`
      )

      alert(
        'Product deactivated successfully'
      )

      await loadProducts()
    } catch (e) {
      console.error(
        'Deactivate product error:',
        e
      )

      alert(
        e.response?.data?.message ||
        'Failed to deactivate product'
      )
    }
  }

  async function updateStatus(
    id,
    status
  ) {
    try {
      await api.put(
        `/orders/${id}/status`,
        { status }
      )

      await loadOrders()
    } catch (e) {
      console.error(
        'Order status update error:',
        e
      )

      alert(
        e.response?.data?.message ||
        e.response?.data ||
        'Failed to update order status'
      )

      await loadOrders()
    }
  }

  /* ==========================================================
     SHADE CARD FUNCTIONS
     ========================================================== */

  function setShadeField(
    key,
    value
  ) {
    setNewShade(
      current => ({
        ...current,
        [key]: value
      })
    )
  }

  function resetShadeForm() {
    setNewShade({
      shadeCode: '',
      shadeName: '',
      imageUrl: '',
      category: '',
      productId: '',
      active: true
    })

    setEditingShade(null)
  }

  async function addShade(e) {
    e.preventDefault()

    if (!newShade.productId) {
      alert(
        'Please select a product.'
      )
      return
    }

    if (
      !newShade.shadeCode.trim() ||
      !newShade.shadeName.trim()
    ) {
      alert(
        'Shade code and shade name are required.'
      )
      return
    }

    setSavingShade(true)

    try {
      const payload = {
        shadeCode:
          newShade.shadeCode.trim(),
        shadeName:
          newShade.shadeName.trim(),
        imageUrl:
          newShade.imageUrl.trim() || null,
        category:
          newShade.category.trim() || null,
        active:
          newShade.active,
        product: {
          id: Number(
            newShade.productId
          )
        }
      }

      await api.post(
        '/shades',
        payload
      )

      alert(
        'Shade card added successfully.'
      )

      resetShadeForm()
      await loadShades()
    } catch (e) {
      console.error(
        'Add shade error:',
        e
      )

      alert(
        e.response?.data?.message ||
        e.response?.data ||
        'Failed to add shade card'
      )
    } finally {
      setSavingShade(false)
    }
  }

  function startEditShade(shade) {
    setEditingShade({
      id: shade.id,
      shadeCode:
        shade.shadeCode || '',
      shadeName:
        shade.shadeName || '',
      imageUrl:
        shade.imageUrl || '',
      category:
        shade.category || '',
      productId:
        shade.product?.id
          ? String(
              shade.product.id
            )
          : '',
      active:
        shade.active !== false
    })
  }

  function setEditingShadeField(
    key,
    value
  ) {
    setEditingShade(
      current => ({
        ...current,
        [key]: value
      })
    )
  }

  async function saveShade(e) {
    e.preventDefault()

    if (!editingShade) {
      return
    }

    if (!editingShade.productId) {
      alert(
        'Please select a product.'
      )
      return
    }

    setSavingShade(true)

    try {
      const payload = {
        shadeCode:
          editingShade.shadeCode.trim(),
        shadeName:
          editingShade.shadeName.trim(),
        imageUrl:
          editingShade.imageUrl.trim() || null,
        category:
          editingShade.category.trim() || null,
        active:
          editingShade.active,
        product: {
          id: Number(
            editingShade.productId
          )
        }
      }

      await api.put(
        `/shades/${editingShade.id}`,
        payload
      )

      alert(
        'Shade card updated successfully.'
      )

      setEditingShade(null)

      await loadShades()
    } catch (e) {
      console.error(
        'Update shade error:',
        e
      )

      alert(
        e.response?.data?.message ||
        e.response?.data ||
        'Failed to update shade card'
      )
    } finally {
      setSavingShade(false)
    }
  }

  async function deleteShade(id) {
    if (
      !confirm(
        'Delete this shade card?'
      )
    ) {
      return
    }

    try {
      await api.delete(
        `/shades/${id}`
      )

      alert(
        'Shade card deleted successfully.'
      )

      await loadShades()
    } catch (e) {
      console.error(
        'Delete shade error:',
        e
      )

      alert(
        e.response?.data?.message ||
        'Failed to delete shade card'
      )
    }
  }

  return (
    <main className="container">
      <h2>Admin Dashboard</h2>

      <div className="stats">
        <div className="stat">
          <b>{products.length}</b>
          <span>Products</span>
        </div>

        <div className="stat">
          <b>{orders.length}</b>
          <span>Orders</span>
        </div>

        <div className="stat">
          <b>{customers.length}</b>
          <span>Customers</span>
        </div>

        <div className="stat">
          <b>{shades.length}</b>
          <span>Shade Cards</span>
        </div>
      </div>

      {/* ======================================================
          ADD PRODUCT
          ====================================================== */}

      <section>
        <h3>Add Product</h3>

        <form
          className="card formgrid"
          onSubmit={addProduct}
        >
          {[
            'code',
            'name',
            'category',
            'description',
            'shade',
            'application',
            'packing',
            'imageUrl'
          ].map(k => (
            <input
              key={k}
              type="text"
              placeholder={k}
              value={newP[k]}
              onChange={e =>
                setP(
                  k,
                  e.target.value
                )
              }
              required={[
                'code',
                'name'
              ].includes(k)}
            />
          ))}

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="price"
            value={newP.price}
            onChange={e =>
              setP(
                'price',
                e.target.value
              )
            }
          />

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="stockQuantity"
            value={
              newP.stockQuantity
            }
            onChange={e =>
              setP(
                'stockQuantity',
                e.target.value
              )
            }
          />

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="minimumStock"
            value={
              newP.minimumStock
            }
            onChange={e =>
              setP(
                'minimumStock',
                e.target.value
              )
            }
          />

          <button
            className="button"
            type="submit"
          >
            Add Product
          </button>
        </form>
      </section>

      {/* ======================================================
          PRODUCT & STOCK MANAGEMENT
          ====================================================== */}

      <section>
        <h3>
          Product & Stock Management
        </h3>

        {loadingProducts && (
          <p>
            Loading products...
          </p>
        )}

        {productError && (
          <div className="error">
            {productError}
          </div>
        )}

        <div className="grid">
          {products.map(p => (
            <div
              className="card"
              key={p.id}
            >
              <h3>{p.name}</h3>

              <p>
                {p.code} •{' '}
                {p.category}
              </p>

              <p>
                Price:{' '}
                <b>
                  ₹{' '}
                  {Number(
                    p.price || 0
                  ).toFixed(2)}
                </b>
              </p>

              <p>
                Stock:{' '}
                <b>
                  {p.stockQuantity}
                </b>
                {' | '}
                Reserved:{' '}
                <b>
                  {p.reservedQuantity}
                </b>
                {' | '}
                Available:{' '}
                <b>
                  {p.availableQuantity}
                </b>
              </p>

              <span
                className={`status ${
                  p.status?.toLowerCase() ||
                  ''
                }`}
              >
                {p.status?.replace(
                  '_',
                  ' '
                )}
              </span>

              <div className="actions">
                <button
                  type="button"
                  className="button"
                  onClick={() =>
                    startEditProduct(p)
                  }
                >
                  Edit Product
                </button>
              </div>

              {editingProduct?.id ===
                p.id && (
                <form
                  className="card"
                  onSubmit={
                    saveProduct
                  }
                >
                  <h3>
                    Edit Product
                  </h3>

                  <input
                    placeholder="Product Code"
                    value={
                      editingProduct.code
                    }
                    onChange={e =>
                      setEditProductField(
                        'code',
                        e.target.value
                      )
                    }
                    required
                  />

                  <input
                    placeholder="Product Name"
                    value={
                      editingProduct.name
                    }
                    onChange={e =>
                      setEditProductField(
                        'name',
                        e.target.value
                      )
                    }
                    required
                  />

                  <input
                    placeholder="Category"
                    value={
                      editingProduct.category
                    }
                    onChange={e =>
                      setEditProductField(
                        'category',
                        e.target.value
                      )
                    }
                  />

                  <input
                    placeholder="Description"
                    value={
                      editingProduct.description
                    }
                    onChange={e =>
                      setEditProductField(
                        'description',
                        e.target.value
                      )
                    }
                  />

                  <input
                    placeholder="Shade"
                    value={
                      editingProduct.shade
                    }
                    onChange={e =>
                      setEditProductField(
                        'shade',
                        e.target.value
                      )
                    }
                  />

                  <input
                    placeholder="Application"
                    value={
                      editingProduct.application
                    }
                    onChange={e =>
                      setEditProductField(
                        'application',
                        e.target.value
                      )
                    }
                  />

                  <input
                    placeholder="Packing"
                    value={
                      editingProduct.packing
                    }
                    onChange={e =>
                      setEditProductField(
                        'packing',
                        e.target.value
                      )
                    }
                  />

                  <input
                    placeholder="Image URL"
                    value={
                      editingProduct.imageUrl
                    }
                    onChange={e =>
                      setEditProductField(
                        'imageUrl',
                        e.target.value
                      )
                    }
                  />

                  <label>
                    Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    value={
                      editingProduct.price
                    }
                    onChange={e =>
                      setEditProductField(
                        'price',
                        e.target.value
                      )
                    }
                    required
                  />

                  <label>
                    Stock Quantity
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Stock Quantity"
                    value={
                      editingProduct.stockQuantity
                    }
                    onChange={e =>
                      setEditProductField(
                        'stockQuantity',
                        e.target.value
                      )
                    }
                    required
                  />

                  <label>
                    Minimum Stock
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Minimum Stock"
                    value={
                      editingProduct.minimumStock
                    }
                    onChange={e =>
                      setEditProductField(
                        'minimumStock',
                        e.target.value
                      )
                    }
                    required
                  />

                  <div className="actions">
                    <button
                      type="submit"
                      className="button"
                      disabled={
                        savingProduct
                      }
                    >
                      {savingProduct
                        ? 'Saving...'
                        : 'Save Product'}
                    </button>

                    <button
                      type="button"
                      className="linkbtn"
                      onClick={
                        cancelEditProduct
                      }
                      disabled={
                        savingProduct
                      }
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <input
                type="number"
                min="1"
                placeholder="Quantity"
                value={
                  stock[p.id]
                    ?.quantity || ''
                }
                onChange={e =>
                  setStock({
                    ...stock,
                    [p.id]: {
                      ...stock[p.id],
                      quantity:
                        e.target.value
                    }
                  })
                }
              />

              <input
                placeholder="Reason"
                value={
                  stock[p.id]
                    ?.reason || ''
                }
                onChange={e =>
                  setStock({
                    ...stock,
                    [p.id]: {
                      ...stock[p.id],
                      reason:
                        e.target.value
                    }
                  })
                }
              />

              <div className="actions">
                <button
                  type="button"
                  className="button"
                  onClick={() =>
                    adjust(
                      p.id,
                      1
                    )
                  }
                >
                  + Add Stock
                </button>

                <button
                  type="button"
                  className="button danger"
                  onClick={() =>
                    adjust(
                      p.id,
                      -1
                    )
                  }
                >
                  − Remove Stock
                </button>

                <button
                  type="button"
                  className="linkbtn"
                  onClick={() =>
                    deactivate(
                      p.id
                    )
                  }
                >
                  Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================
          SHADE CARD MANAGEMENT
          ====================================================== */}

      <section>
        <h3>Shade Card Management</h3>

        <form
          className="card formgrid"
          onSubmit={
            editingShade
              ? saveShade
              : addShade
          }
        >
          <h3>
            {editingShade
              ? 'Edit Shade Card'
              : 'Add Shade Card'}
          </h3>

          <input
            type="text"
            placeholder="Shade Code"
            value={
              editingShade
                ? editingShade.shadeCode
                : newShade.shadeCode
            }
            onChange={e =>
              editingShade
                ? setEditingShadeField(
                    'shadeCode',
                    e.target.value
                  )
                : setShadeField(
                    'shadeCode',
                    e.target.value
                  )
            }
            required
          />

          <input
            type="text"
            placeholder="Shade Name"
            value={
              editingShade
                ? editingShade.shadeName
                : newShade.shadeName
            }
            onChange={e =>
              editingShade
                ? setEditingShadeField(
                    'shadeName',
                    e.target.value
                  )
                : setShadeField(
                    'shadeName',
                    e.target.value
                  )
            }
            required
          />

          <input
            type="text"
            placeholder="Category"
            value={
              editingShade
                ? editingShade.category
                : newShade.category
            }
            onChange={e =>
              editingShade
                ? setEditingShadeField(
                    'category',
                    e.target.value
                  )
                : setShadeField(
                    'category',
                    e.target.value
                  )
            }
          />

          <input
            type="text"
            placeholder="Image URL"
            value={
              editingShade
                ? editingShade.imageUrl
                : newShade.imageUrl
            }
            onChange={e =>
              editingShade
                ? setEditingShadeField(
                    'imageUrl',
                    e.target.value
                  )
                : setShadeField(
                    'imageUrl',
                    e.target.value
                  )
            }
          />

          <select
            value={
              editingShade
                ? editingShade.productId
                : newShade.productId
            }
            onChange={e =>
              editingShade
                ? setEditingShadeField(
                    'productId',
                    e.target.value
                  )
                : setShadeField(
                    'productId',
                    e.target.value
                  )
            }
            required
          >
            <option value="">
              Select Product
            </option>

            {products.map(p => (
              <option
                key={p.id}
                value={p.id}
              >
                {p.name} ({p.code})
              </option>
            ))}
          </select>

          <label>
            <input
              type="checkbox"
              checked={
                editingShade
                  ? editingShade.active
                  : newShade.active
              }
              onChange={e =>
                editingShade
                  ? setEditingShadeField(
                      'active',
                      e.target.checked
                    )
                  : setShadeField(
                      'active',
                      e.target.checked
                    )
              }
            />
            {' '}
            Active
          </label>

          <div className="actions">
            <button
              className="button"
              type="submit"
              disabled={savingShade}
            >
              {savingShade
                ? 'Saving...'
                : editingShade
                  ? 'Save Shade Card'
                  : 'Add Shade Card'}
            </button>

            {editingShade && (
              <button
                type="button"
                className="linkbtn"
                onClick={
                  resetShadeForm
                }
                disabled={
                  savingShade
                }
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {loadingShades && (
          <p>
            Loading shade cards...
          </p>
        )}

        {shadeError && (
          <div className="error">
            {shadeError}
          </div>
        )}

        {!loadingShades &&
          !shadeError &&
          shades.length === 0 && (
            <div className="card">
              <p>
                No shade cards have been
                created yet.
              </p>
            </div>
          )}

        <div className="grid">
          {shades.map(shade => (
            <div
              className="card"
              key={shade.id}
            >
              {shade.imageUrl ? (
                <img
                  className="shadeimg"
                  src={shade.imageUrl}
                  alt={shade.shadeName}
                />
              ) : (
                <div className="shadeplaceholder">
                  {shade.shadeName}
                </div>
              )}

              <h3>
                {shade.shadeName}
              </h3>

              <p>
                <b>Code:</b>{' '}
                {shade.shadeCode}
              </p>

              <p>
                <b>Category:</b>{' '}
                {shade.category ||
                  '-'}
              </p>

              <p>
                <b>Product:</b>{' '}
                {shade.product?.name ||
                  '-'}
              </p>

              <p>
                <b>Status:</b>{' '}
                {shade.active
                  ? 'Active'
                  : 'Inactive'}
              </p>

              <div className="actions">
                <button
                  type="button"
                  className="button"
                  onClick={() =>
                    startEditShade(
                      shade
                    )
                  }
                >
                  Edit Shade
                </button>

                <button
                  type="button"
                  className="button danger"
                  onClick={() =>
                    deleteShade(
                      shade.id
                    )
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================
          ORDERS
          ====================================================== */}

      <section>
        <h3>Orders</h3>

        {loadingOrders && (
          <p>
            Loading orders...
          </p>
        )}

        {orderError && (
          <div className="error">
            {orderError}
          </div>
        )}

        {!loadingOrders &&
          !orderError &&
          orders.length === 0 && (
            <p>
              No orders yet.
            </p>
          )}

        <div className="table">
          {orders.map(o => (
            <div
              className="tr"
              key={o.id}
            >
              <span>
                {o.orderNumber}
              </span>

              <span>
                {o.customer
                  ?.companyName ||
                  '-'}
              </span>

              <span>
                ₹{' '}
                {Number(
                  o.totalAmount || 0
                ).toFixed(2)}
              </span>

              <select
                value={o.status}
                onChange={e =>
                  updateStatus(
                    o.id,
                    e.target.value
                  )
                }
              >
                {[
                  'PLACED',
                  'CONFIRMED',
                  'PROCESSING',
                  'PACKED',
                  'DISPATCHED',
                  'IN_TRANSIT',
                  'DELIVERED',
                  'CANCELLED'
                ].map(s => (
                  <option
                    key={s}
                    value={s}
                  >
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================
          CUSTOMERS
          ====================================================== */}

      <section>
        <h3>Customers</h3>

        {loadingCustomers && (
          <p>
            Loading customers...
          </p>
        )}

        {customerError && (
          <div className="error">
            {customerError}
          </div>
        )}

        {!loadingCustomers &&
          !customerError &&
          customers.length === 0 && (
            <p>
              No customers yet.
            </p>
          )}

        {!loadingCustomers &&
          !customerError &&
          customers.length > 0 && (
            <div className="table">
              {customers.map(c => (
                <div
                  className="tr"
                  key={c.id}
                >
                  <span>
                    {c.companyName ||
                      '-'}
                  </span>

                  <span>
                    {c.email || '-'}
                  </span>

                  <span>
                    {c.phone || '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
      </section>
    </main>
  )
}

export default function App() {
  return (
    <>
      <Nav />

      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/shades"
          element={<Shades />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/customer"
          element={<Customer />}
        />

        <Route
          path="/admin"
          element={<Admin />}
        />
      </Routes>
    </>
  )
}