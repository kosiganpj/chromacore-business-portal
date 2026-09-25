import React, {useEffect, useState} from 'react'
import {Routes, Route, Link, useNavigate} from 'react-router-dom'
import api from './api'

function Nav(){
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
        {!token && <Link className="button" to="/register">Register</Link>}

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

function Home(){
  return (
    <main className="hero">
      <div>
        <span className="eyebrow">DYES • CHEMICALS • B2B SUPPLY</span>

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

function Products(){
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/products/public')
      .then(r => {
        console.log('Products API:', r.data)
        setProducts(r.data)
      })
      .catch(e => {
        console.error('Products API error:', e)
        setError(
          e.response?.data?.message ||
          e.message ||
          'Failed to load products'
        )
      })
      .finally(() => setLoading(false))
  }, [])

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

      <div className="grid">
        {products.map(p => (
          <div className="card" key={p.id}>

            <div className="productimg">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} />
              ) : (
                <span>{p.shade || 'CHEMICAL'}</span>
              )}
            </div>

            <h3>{p.name}</h3>

            <p>
              {p.code} • {p.category}
            </p>

            <p>
              {p.description || 'B2B dye/chemical product.'}
            </p>

            <span className={`status ${p.status.toLowerCase()}`}>
              {p.status.replace('_', ' ')}
            </span>

          </div>
        ))}
      </div>
    </main>
  )
}

function Shades(){
  const [shades, setShades] = useState([])

  useEffect(() => {
    api.get('/shades/public')
      .then(r => setShades(r.data))
  }, [])

  return (
    <main className="container">
      <h2>Digital Shade Cards</h2>

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
              Product: {s.product?.name}
            </p>

            <span
              className={`status ${s.product?.status?.toLowerCase()}`}
            >
              {s.product?.status?.replace('_', ' ')}
            </span>

          </div>
        ))}
      </div>
    </main>
  )
}

function Login(){
  const [form, setForm] = useState({
    email: '',
    password: ''
  })

  const [err, setErr] = useState('')
  const nav = useNavigate()

  async function submit(e){
    e.preventDefault()

    try {
      const r = await api.post('/auth/login', form)

      localStorage.setItem('cc_token', r.data.token)
      localStorage.setItem('cc_role', r.data.role)

      nav(
        r.data.role === 'ADMIN'
          ? '/admin'
          : '/customer'
      )

    } catch(e) {
      setErr(
        e.response?.data?.message ||
        'Login failed'
      )
    }
  }

  return (
    <main className="auth">
      <form className="card" onSubmit={submit}>

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

function Register(){
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

  async function submit(e){
    e.preventDefault()

    try {
      const r = await api.post('/auth/register', form)

      localStorage.setItem('cc_token', r.data.token)
      localStorage.setItem('cc_role', r.data.role)

      nav('/customer')

    } catch(e) {
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
            required={
              ['email', 'password', 'companyName']
                .includes(k)
            }
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

function Customer(){
  const [me, setMe] = useState(null)
  const [orders, setOrders] = useState([])
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/customer/me'),
      api.get('/customer/orders'),
      api.get('/customer/invoices')
    ])
    .then(([a, b, c]) => {
      setMe(a.data)
      setOrders(b.data)
      setInvoices(c.data)
    })
  }, [])

  return (
    <main className="container">

      <h2>Customer Dashboard</h2>

      {me && (
        <p>
          Welcome, <b>{me.companyName}</b>
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

        {orders.map(o => (
          <div className="tr" key={o.id}>

            <span>{o.orderNumber}</span>
            <span>{o.status}</span>
            <span>
              ₹ {o.totalAmount.toFixed(2)}
            </span>
            <span>
              {o.trackingNumber || '-'}
            </span>

          </div>
        ))}

      </div>

      <h3>Invoices</h3>

      <div className="table">

        {invoices.map(i => (
          <div className="tr" key={i.id}>

            <span>{i.invoiceNumber}</span>

            <span>
              ₹ {i.amount.toFixed(2)}
            </span>

            <span>
              Outstanding ₹ {i.outstanding.toFixed(2)}
            </span>

            <a
              href={`https://chromacore-business-portal-1.onrender.com/api/customer/invoices/${i.id}/pdf`}
              target="_blank"
              rel="noreferrer"
            >
              PDF
            </a>

          </div>
        ))}

      </div>

    </main>
  )
}

function Admin(){
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])

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

  const load = () =>
    Promise.all([
      api.get('/admin/products'),
      api.get('/admin/orders'),
      api.get('/admin/customers')
    ])
    .then(([p, o, c]) => {
      setProducts(p.data)
      setOrders(o.data)
      setCustomers(c.data)
    })

  useEffect(load, [])

  const setP = (k, v) =>
    setNewP({
      ...newP,
      [k]: v
    })

  async function addProduct(e){
    e.preventDefault()

    await api.post('/admin/products', {
      ...newP,
      stockQuantity: Number(newP.stockQuantity),
      minimumStock: Number(newP.minimumStock)
    })

    setNewP({
      ...newP,
      code: '',
      name: '',
      stockQuantity: 0
    })

    load()
  }

  async function adjust(id, delta){
    const q = Number(
      stock[id]?.quantity || 0
    )

    if(!q) return

    const reason =
      stock[id]?.reason ||
      'Manual stock adjustment'

    await api.post(
      `/admin/products/${id}/stock/${delta > 0 ? 'add' : 'remove'}`,
      {
        quantity: q,
        reason
      }
    )

    setStock({
      ...stock,
      [id]: {}
    })

    load()
  }

  async function deactivate(id){
    if(confirm('Deactivate this product?')){
      await api.delete(
        `/admin/products/${id}`
      )

      load()
    }
  }

  async function updateStatus(id, status){
    await api.put(
      `/admin/orders/${id}/status`,
      {status}
    )

    load()
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
                ['stockQuantity', 'minimumStock']
                  .includes(k)
                  ? 'number'
                  : 'text'
              }
              placeholder={k}
              value={newP[k]}
              onChange={e =>
                setP(k, e.target.value)
              }
              required={
                ['code', 'name'].includes(k)
              }
            />
          ))}

          <button className="button">
            Add Product
          </button>

        </form>

      </section>

      <section>

        <h3>Product & Stock Management</h3>

        <div className="grid">

          {products.map(p => (
            <div className="card" key={p.id}>

              <h3>{p.name}</h3>

              <p>
                {p.code} • {p.category}
              </p>

              <p>
                Stock: <b>{p.stockQuantity}</b> |
                Reserved: <b>{p.reservedQuantity}</b> |
                Available: <b>{p.availableQuantity}</b>
              </p>

              <span
                className={`status ${p.status.toLowerCase()}`}
              >
                {p.status.replace('_', ' ')}
              </span>

              <input
                type="number"
                placeholder="Quantity"
                value={
                  stock[p.id]?.quantity || ''
                }
                onChange={e =>
                  setStock({
                    ...stock,
                    [p.id]: {
                      ...stock[p.id],
                      quantity: e.target.value
                    }
                  })
                }
              />

              <input
                placeholder="Reason"
                value={
                  stock[p.id]?.reason || ''
                }
                onChange={e =>
                  setStock({
                    ...stock,
                    [p.id]: {
                      ...stock[p.id],
                      reason: e.target.value
                    }
                  })
                }
              />

              <div className="actions">

                <button
                  className="button"
                  onClick={() =>
                    adjust(p.id, 1)
                  }
                >
                  + Add Stock
                </button>

                <button
                  className="button danger"
                  onClick={() =>
                    adjust(p.id, -1)
                  }
                >
                  − Remove Stock
                </button>

                <button
                  className="linkbtn"
                  onClick={() =>
                    deactivate(p.id)
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

        <div className="table">

          {orders.map(o => (
            <div className="tr" key={o.id}>

              <span>{o.orderNumber}</span>

              <span>
                {o.customer?.companyName}
              </span>

              <span>
                ₹ {o.totalAmount.toFixed(2)}
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
                  <option key={s}>
                    {s}
                  </option>
                ))}

              </select>

            </div>
          ))}

        </div>

      </section>

    </main>
  )
}

export default function App(){
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

