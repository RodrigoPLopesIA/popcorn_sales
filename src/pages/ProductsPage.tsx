import { useEffect, useState } from "react"
import { db } from "../services/firebase"
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "firebase/firestore"

interface Product {
  id?: string
  flavor: string
  quantity: number
  price: number
  createdAt?: any
  updatedAt?: any
}

const FLAVORS = [
  "chocolate",
  "morango",
  "ovo_maltine",
  "pistache",
  "ninho"
]

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  const [form, setForm] = useState<Product>({
    flavor: "",
    quantity: 0,
    price: 0
  })

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const productsCollection = collection(db, "products")

  async function loadProducts() {
    const data = await getDocs(productsCollection)

    const list: Product[] = data.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Product, "id">)
    }))

    setProducts(list)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, startDate, endDate])

  function parseDate(timestamp: any) {
    return timestamp?.toDate ? timestamp.toDate() : new Date()
  }

  const filtered = products.filter((p) => {
    const matchesSearch = p.flavor.toLowerCase().includes(search.toLowerCase())

    const created = parseDate(p.createdAt)

    const matchesStart = startDate ? created >= new Date(startDate) : true
    const matchesEnd = endDate ? created <= new Date(endDate) : true

    return matchesSearch && matchesStart && matchesEnd
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // 📊 MÉTRICAS
  const totalProducts = products.length

  const totalToday = products.filter(p => {
    const today = new Date().toDateString()
    return parseDate(p.createdAt).toDateString() === today
  }).length

  const totalValuePeriod = filtered.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  )

  const totalQuantityPeriod = filtered.reduce(
    (sum, p) => sum + p.quantity,
    0
  )

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (!form.flavor || form.quantity <= 0 || form.price <= 0) {
      alert("Preencha corretamente os campos")
      return
    }

    if (editing) {
      await updateDoc(doc(db, "products", editing.id!), {
        ...form,
        updatedAt: serverTimestamp()
      })
      setEditing(null)
    } else {
      await addDoc(productsCollection, {
        ...form,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }

    setForm({ flavor: "", quantity: 0, price: 0 })
    setModalOpen(false)
    loadProducts()
  }

  function handleEdit(p: Product) {
    setEditing(p)
    setForm(p)
    setModalOpen(true)
  }

  async function handleDelete(id?: string) {
    if (!id) return
    await deleteDoc(doc(db, "products", id))
    loadProducts()
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">

        <h1 className="text-2xl font-bold">🍿 Produtos</h1>

        {/* 📊 CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-pink-500 text-white p-3 rounded-xl">
            <p>Total criados</p>
            <p className="text-xl font-bold">{totalProducts}</p>
          </div>

          <div className="bg-pink-400 text-white p-3 rounded-xl">
            <p>Hoje</p>
            <p className="text-xl font-bold">{totalToday}</p>
          </div>

          <div className="bg-pink-600 text-white p-3 rounded-xl">
            <p>Valor período</p>
            <p className="text-xl font-bold">
              R$ {totalValuePeriod.toFixed(2)}
            </p>
          </div>

          <div className="bg-pink-300 text-white p-3 rounded-xl">
            <p>Qtd período</p>
            <p className="text-xl font-bold">
              {totalQuantityPeriod}
            </p>
          </div>
        </div>

        {/* 🔍 FILTROS */}
        <div className="bg-white p-4 rounded-xl shadow grid md:grid-cols-4 gap-3">
          <input
            placeholder="Buscar sabor"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border p-2 rounded"
          />

          <button
            onClick={() => {
              setEditing(null)
              setForm({ flavor: "", quantity: 0, price: 0 })
              setModalOpen(true)
            }}
            className="bg-pink-500 text-white rounded"
          >
            Novo produto
          </button>
        </div>

        {/* 💻 DESKTOP */}
        <div className="hidden lg:block bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-pink-100">
              <tr>
                <th className="p-3 text-left">Sabor</th>
                <th className="p-3 text-right">Qtd</th>
                <th className="p-3 text-right">Preço</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-left">Criado</th>
                <th className="p-3 text-left">Ações</th>
              </tr>
            </thead>

            <tbody>
              {currentItems.map(p => (
                <tr key={p.id} className="border-t hover:bg-pink-50">
                  <td className="p-3 capitalize text-left">{p.flavor}</td>

                  <td className="p-3 text-right tabular-nums">
                    {p.quantity}
                  </td>

                  <td className="p-3 text-right tabular-nums">
                    R$ {p.price.toFixed(2)}
                  </td>

                  <td className="p-3 text-right font-semibold tabular-nums">
                    R$ {(p.price * p.quantity).toFixed(2)}
                  </td>

                  <td className="p-3 text-left">
                    {parseDate(p.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-3 text-left">
                    <button
                      onClick={() => handleEdit(p)}
                      className="mr-2 bg-pink-500 text-white px-2 py-1 rounded"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleDelete(p.id)}
                      className="bg-pink-200 px-2 py-1 rounded"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 📄 PAGINAÇÃO */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className="px-3 py-1 bg-pink-100 rounded"
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* 🧾 MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-xl w-full max-w-md">
              <h2 className="font-bold mb-3">
                {editing ? "Editar" : "Novo"} Produto
              </h2>

              <form onSubmit={handleSave} className="space-y-3">

                <div>
                  <label className="text-sm">Sabor</label>
                  <select
                    value={form.flavor}
                    onChange={e => setForm({ ...form, flavor: e.target.value })}
                    className="w-full border p-2 rounded"
                  >
                    <option value="">Selecione</option>
                    {FLAVORS.map(f => (
                      <option key={f} value={f}>
                        {f.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm">Quantidade</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={e =>
                      setForm({ ...form, quantity: Number(e.target.value) })
                    }
                    className="w-full border p-2 rounded"
                  />
                </div>

                <div>
                  <label className="text-sm">Preço</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e =>
                      setForm({ ...form, price: Number(e.target.value) })
                    }
                    className="w-full border p-2 rounded"
                  />
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-pink-500 text-white rounded py-2">
                    Salvar
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 bg-gray-200 rounded"
                  >
                    Cancelar
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default ProductsPage