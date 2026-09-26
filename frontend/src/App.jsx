
import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import api from './api'

function Nav() {
  const token = localStorage.getItem('cc_token')
  const role = localStorage.getItem('cc_role')
  const nav = useNavigate()

  const logout = () => {
    localStorage.clear()
    nav('/')
  }

  return (
    <nav>
      <Link className="brand" to="/">ChromaCore</Link>

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
          <button className="linkbtn" onClick={logout}>
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

  const [cart, setCart] = useState([])
  const [shippingAddress, setShippingAddress] = useState('')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderMessage, setOrderMessage] = useState('')
  const [orderError, setOrderError] = useState('')

  const token = localStorage.getItem('cc_token')
  const role = localStorage.getItem('cc_role')
  const isCustomer = token && role === 'CUSTOMER'

  useEffect(() => {
    let active = true

    const fetchProducts = async () => {
      try {
        const r = await api.get('/products/public')

        if (active) {
          console.log('Products API:', r.data)
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

  function addToCart(product) {
    setOrderMessage('')
    setOrderError('')

    setCart(current => {
      const existing = current.find(
        item => item.product.id === product.id
      )

      if (existing) {
        return current.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1
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
    const q = Number(quantity)

    if (!q || q <= 0) {
      setCart(current =>
        current.filter(
          item => item.product.id !== productId
        )
      )
      return
    }

    setCart(current =>
      current.map(item =>
        item.product.id === productId
          ? {
              ...item,
              quantity: q
            }
          : item
      )
    )
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

  const cartTotal = cart.reduce(
    (sum, item) =>
      sum +
      productPrice(item.product) *
        Number(item.quantity || 0),
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
      const available = Number(
        item.product.availableQuantity ??
        item.product.stockQuantity ??
        0
      )

      if (
        available > 0 &&
        Number(item.quantity) > available
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

      console.log('Create order payload:', payload)

      const r = await api.post('/orders', payload)

      console.log('Create order response:', r.data)

      setCart([])
      setShippingAddress('')

      setOrderMessage(
        `Order ${r.data?.orderNumber || ''} placed successfully.`
      )

      // Refresh products because stock has now been reserved.
      const productsResponse =
        await api.get('/products/public')

      setProducts(productsResponse.data)
    } catch (e) {
      console.error('Create order error:', e)

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

  return (
    <main className="container">
      <h2>Products</h2>

      {loading && <p>Loading products...</p>}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p>No products available.</p>
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
                      <b>{item.product.name}</b>
                      <br />
                      {item.product.code}
                    </span>

                    <span>
                      ₹ {productPrice(item.product).toFixed(2)}
                    </span>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e =>
                        updateCartQuantity(
                          item.product.id,
                          e.target.value
                        )
                      }
                    />

                    <span>
                      ₹{' '}
                      {(
                        productPrice(item.product) *
                        Number(item.quantity || 0)
                      ).toFixed(2)}
                    </span>

                    <button
                      type="button"
                      className="linkbtn"
                      onClick={() =>
                        removeFromCart(item.product.id)
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <h3>
                Total: ₹ {cartTotal.toFixed(2)}
              </h3>

              <textarea
                placeholder="Shipping address"
                value={shippingAddress}
                onChange={e =>
                  setShippingAddress(e.target.value)
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
            Login as a customer to add products to your cart
            and place orders.
          </p>

          <Link className="button" to="/login">
            Customer Login
          </Link>
        </div>
      )}

      <div className="grid">
        {products.map(p => (
          <div className="card" key={p.id}>
            <div className="productimg">
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                />
              ) : (
                <span>
                  {p.shade || 'CHEMICAL'}
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
                ₹ {productPrice(p).toFixed(2)}
              </b>
            </p>

            <p>
              Available:{' '}
              <b>
                {p.availableQuantity ??
                  p.stockQuantity ??
                  0}
              </b>
            </p>

            <span
              className={`status ${
                p.status?.toLowerCase() || ''
              }`}
            >
              {p.status?.replace('_', ' ')}
            </span>

            {isCustomer && (
              <button
                type="button"
                className="button"
                disabled={
                  p.status !== 'AVAILABLE' ||
                  Number(
                    p.availableQuantity ??
                    p.stockQuantity ??
                    0
                  ) <= 0
                }
                onClick={() =>
                  addToCart(p)
                }
              >
                Add to Cart
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}

function Shades() {
  const [shades, setShades] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const fetchShades = async () => {
      try {
        const r = await api.get('/shades/public')

        if (active) {
          setShades(r.data)
        }
      } catch (e) {
        console.error('Shades API error:', e)

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

      {!error && shades.length === 0 && (
        <p>No shade cards available.</p>
      )}

      <div className="grid">
        {shades.map(s => (
          <div className="card" key={s.id}>
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
              Product: {s.product?.name || '-'}
            </p>

            <span
              className={`status ${
                s.product?.status?.toLowerCase() || ''
              }`}
            >
              {s.product?.status?.replace('_', ' ') || '-'}
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
              set(k, e.target.value)
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

function Customer() {
  const [me, setMe] = useState(null)
  const [orders, setOrders] = useState([])
  const [invoices, setInvoices] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const fetchCustomerData = async () => {
      try {
        const [a, b, c] = await Promise.all([
          api.get('/customer/me'),
          api.get('/customer/orders'),
          api.get('/customer/invoices')
        ])

        if (active) {
          console.log(
            'Customer profile:',
            a.data
          )

          console.log(
            'Customer orders:',
            b.data
          )

          console.log(
            'Customer invoices:',
            c.data
          )

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

      <h3>Order History</h3>

      <div className="table">
        {orders.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          orders.map(o => (
            <div
              className="tr"
              key={o.id}
            >
              <span>
                {o.orderNumber}
              </span>

              <span>
                {o.status}
              </span>

              <span>
                ₹{' '}
                {Number(
                  o.totalAmount || 0
                ).toFixed(2)}
              </span>

              <span>
                {o.trackingNumber || '-'}
              </span>
            </div>
          ))
        )}
      </div>

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

function Admin() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])

  const [loadingProducts, setLoadingProducts] =
    useState(true)

  const [loadingOrders, setLoadingOrders] =
    useState(true)

  const [loadingCustomers, setLoadingCustomers] =
    useState(true)

  const [productError, setProductError] =
    useState('')

  const [orderError, setOrderError] =
    useState('')

  const [customerError, setCustomerError] =
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
    stockQuantity: 0,
    minimumStock: 0
  })

  const [stock, setStock] = useState({})

  async function loadProducts() {
    setLoadingProducts(true)
    setProductError('')

    try {
      const r =
        await api.get('/admin/products')

      console.log(
        'Admin products API:',
        r.data
      )

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

  async function load() {
    await Promise.all([
      loadProducts(),
      loadOrders(),
      loadCustomers()
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

  async function adjust(id, delta) {
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
        `/admin/orders/${id}/status`,
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
        'Failed to update order status'
      )

      await loadOrders()
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
      </div>

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
            'imageUrl',
            'stockQuantity',
            'minimumStock'
          ].map(k => (
            <input
              key={k}
              type={
                [
                  'stockQuantity',
                  'minimumStock'
                ].includes(k)
                  ? 'number'
                  : 'text'
              }
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

          <button
            className="button"
            type="submit"
          >
            Add Product
          </button>
        </form>
      </section>

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

        {!loadingProducts &&
          !productError &&
          products.length === 0 && (
            <p>
              No products found.
            </p>
          )}

        <div className="grid">
          {products.map(p => (
            <div
              className="card"
              key={p.id}
            >
              <h3>{p.name}</h3>

              <p>
                {p.code} • {p.category}
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
                  ?.companyName || '-'}
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
