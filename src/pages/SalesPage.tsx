import { useEffect, useState } from "react"
import { db } from "../services/firebase"
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc
} from "firebase/firestore"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "../services/firebase"
import Login from "./Login"
import SaleModal from "../components/SaleModal"
import type { Sale, SaleInput } from "../types/Sales"

async function updateStock(flavor: string, quantityChange: number) {
  const productsRef = collection(db, "products")
  const data = await getDocs(productsRef)

  const product = data.docs.find(doc => doc.data().flavor === flavor)

  if (!product) return



  const productRef = doc(db, "products", product.id)

  const currentQty = product.data().quantity || 0
  const newQty = currentQty + quantityChange
  
  if (newQty < 0) {
    alert("Estoque insuficiente")
    return
  }
  await updateDoc(productRef, {
    quantity: newQty
  })
}

function SalesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [sales, setSales] = useState<Sale[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [search, setSearch] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const totalSalesValue = sales.reduce((sum, sale) => sum + sale.total, 0)
  const totalPipocas = sales.reduce((sum, sale) => sum + sale.quantity, 0)

  const salesCollection = collection(db, "sales")

  async function loadSales() {
    const data = await getDocs(salesCollection)

    const list: Sale[] = data.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Sale, "id">)
    }))

    setSales(list)
  }

  function parseDate(dateStr: string) {
    const [day, month, year] = dateStr.split("/")
    return new Date(`${year}-${month}-${day}`)
  }

  const totalByPeriod = sales
    .filter((sale) => {
      if (!startDate && !endDate) return false

      const saleDate = parseDate(sale.date)
      const matchesStart = startDate ? saleDate >= new Date(startDate) : true
      const matchesEnd = endDate ? saleDate <= new Date(endDate) : true

      return matchesStart && matchesEnd
    })
    .reduce((sum, sale) => sum + sale.total, 0)

  const totalPipocasByPeriod = sales
    .filter((sale) => {
      if (!startDate && !endDate) return false

      const saleDate = parseDate(sale.date)
      const matchesStart = startDate ? saleDate >= new Date(startDate) : true
      const matchesEnd = endDate ? saleDate <= new Date(endDate) : true

      return matchesStart && matchesEnd
    })
    .reduce((sum, sale) => sum + sale.quantity, 0)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoadingAuth(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (user) loadSales()
  }, [user])

  async function createSale(sale: SaleInput) {
    if (!user?.email) return

    const now = new Date()
    const date = now.toLocaleDateString("pt-BR")
    const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    const username = user.email.split("@")[0].split(".")[0]

    const price = sale.price ?? 17
    const total = price * sale.quantity

    await addDoc(salesCollection, {
      ...sale,
      price,
      total,
      user: username,
      date,
      time
    })

    // 🔥 NOVO: baixa estoque
    await updateStock(sale.flavor, -sale.quantity)

    loadSales()
  }

  async function updateSale(sale: SaleInput) {
    if (!user?.email || !editingSale?.id) return

    const username = user.email.split("@")[0].split(".")[0]
    const saleDoc = doc(db, "sales", editingSale.id)

    const price = sale.price ?? 17
    const total = price * sale.quantity

    await updateDoc(saleDoc, {
      ...sale,
      price,
      total,
      user: username,
    })

    // 🔥 NOVO: controle de estoque
    if (sale.flavor !== editingSale.flavor) {
      // devolve antigo
      await updateStock(editingSale.flavor, editingSale.quantity)

      // remove do novo
      await updateStock(sale.flavor, -sale.quantity)
    } else {
      const diff = sale.quantity - editingSale.quantity
      await updateStock(sale.flavor, -diff)
    }

    setEditingSale(null)
    loadSales()
  }

  async function deleteSale(id?: string) {
    if (!id) return

    const sale = sales.find(s => s.id === id)
    if (!sale) return

    const saleDoc = doc(db, "sales", id)
    await deleteDoc(saleDoc)

    // 🔥 NOVO: devolve estoque
    await updateStock(sale.flavor, sale.quantity)

    loadSales()
  }

  function clearFilters() {
    setSearch("")
    setStartDate("")
    setEndDate("")
  }

  function handleSave(sale: Sale) {
    if (editingSale) updateSale(sale)
    else createSale(sale)
  }

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage

  const filteredSales = sales
    .filter((sale) => {
      const searchLower = search.toLowerCase()

      const matchesSearch =
        sale.user.toLowerCase().includes(searchLower) ||
        sale.flavor.toLowerCase().includes(searchLower) ||
        sale.date.includes(searchLower) ||
        sale.time.includes(searchLower)

      const saleDate = parseDate(sale.date)

      const matchesStart = startDate ? saleDate >= new Date(startDate) : true
      const matchesEnd = endDate ? saleDate <= new Date(endDate) : true

      return matchesSearch && matchesStart && matchesEnd
    })
    .sort((a, b) => {
      const dateA = new Date(`${parseDate(a.date)} ${a.time}`)
      const dateB = new Date(`${parseDate(b.date)} ${b.time}`)
      return dateB.getTime() - dateA.getTime()
    })


  const today = new Date().toLocaleDateString("pt-BR")
  const totalPipocasToday = sales
    .filter(sale => sale.date === today)
    .reduce((sum, sale) => sum + sale.quantity, 0)
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage)
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem)

  const totalToday = sales
    .filter(sale => sale.date === today)
    .reduce((sum, sale) => sum + sale.total, 0)

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col gap-4 mb-6">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-pink-500 text-white p-3 rounded-xl">
              <p className="text-sm">Período</p>

              {startDate || endDate ? (
                <div className="flex justify-between items-center">
                  <p className="text-xl font-bold">
                    R$ {totalByPeriod.toFixed(2)}
                  </p>
                  <p className="text-sm">
                    🍿 {totalPipocasByPeriod}
                  </p>
                </div>
              ) : (
                <p className="text-xl font-bold">—</p>
              )}
            </div>


            <div className="bg-pink-400 text-white p-3 rounded-xl">
              <p className="text-sm">Hoje</p>
              <div className="flex justify-between items-center">
                <p className="text-xl font-bold">
                  R$ {totalToday.toFixed(2)}
                </p>
                <p className="text-sm">
                  🍿 {totalPipocasToday}
                </p>
              </div>
            </div>

            <div className="bg-pink-600 text-white p-3 rounded-xl">
              <p className="text-sm">Total</p>
              <p className="text-xl font-bold">R$ {totalSalesValue.toFixed(2)}</p>
            </div>

            <div className="bg-pink-300 text-white p-3 rounded-xl">
              <p className="text-sm">Pipocas</p>
              <p className="text-xl font-bold">{totalPipocas}</p>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto bg-pink-500 hover:bg-pink-600 text-white py-2 rounded-lg transition"
          >
            Nova venda
          </button>
        </div>

        {/* FILTROS */}
        <div className="bg-white p-4 rounded-xl shadow mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="border p-2 rounded" />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2 rounded" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-2 rounded" />

          <button onClick={clearFilters} className="bg-pink-200 hover:bg-pink-300 text-pink-800 rounded">
            Limpar
          </button>
        </div>

        {/* LISTA MOBILE (cards) */}
        <div className="bg-white rounded-xl shadow p-3 lg:hidden">
          {currentSales.map((sale) => (
            <div key={sale.id} className="border-b py-3 flex flex-col gap-2">

              <div className="flex justify-between">
                <span className="font-semibold capitalize">{sale.flavor}</span>
                <span className="font-bold">R$ {sale.total}</span>
              </div>

              <div className="text-sm text-gray-600 flex justify-between">
                <span>{sale.date} {sale.time}</span>
                <span>{sale.user}</span>
              </div>

              <div className="text-sm flex justify-between">
                <span>Qtd: {sale.quantity}</span>
                <span>R$ {sale.price}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingSale(sale)
                    setModalOpen(true)
                  }}
                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white py-1 rounded"
                >
                  Editar
                </button>

                <button
                  onClick={() => deleteSale(sale.id)}
                  className="flex-1 bg-pink-200 hover:bg-pink-300 text-pink-700 py-1 rounded"
                >
                  Excluir
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* LISTA DESKTOP (tabela) */}
        <div className="hidden lg:block bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-pink-100 text-left">
              <tr>
                <th className="p-3">Usuário</th>
                <th className="p-3">Data</th>
                <th className="p-3">Hora</th>
                <th className="p-3">Sabor</th>
                <th className="p-3">Preço</th>
                <th className="p-3">Quantidade</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentSales.map((sale) => (
                <tr key={sale.id} className="border-t hover:bg-pink-50">
                  <td className="p-3">{sale.user}</td>
                  <td className="p-3">{sale.date}</td>
                  <td className="p-3">{sale.time}</td>
                  <td className="p-3 capitalize">{sale.flavor}</td>
                  <td className="p-3">R$ {sale.price}</td>
                  <td className="p-3">{sale.quantity}</td>
                  <td className="p-3 font-semibold">R$ {sale.total}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingSale(sale)
                          setModalOpen(true)
                        }}
                        className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => deleteSale(sale.id)}
                        className="bg-pink-200 hover:bg-pink-300 text-pink-700 px-3 py-1 rounded"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO */}
        <div className="flex flex-wrap justify-center mt-4 gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${currentPage === i + 1
                ? 'bg-pink-500 text-white'
                : 'bg-pink-100 text-pink-700'
                }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

      </div>

      <SaleModal
        user={user}
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingSale(null) }}
        onSave={handleSave}
        editingSale={editingSale}
      />
    </div>
  )
}

export default SalesPage