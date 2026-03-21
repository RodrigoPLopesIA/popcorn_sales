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


function SalesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [sales, setSales] = useState<Sale[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [search, setSearch] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Cálculos
  const totalSalesValue = sales.reduce((sum, sale) => sum + sale.total, 0)
  const totalPipocas = sales.reduce((sum, sale) => sum + sale.quantity, 0)

  const salesCollection = collection(db, "sales")

  async function loadSales() {
    const data = await getDocs(salesCollection)

    let list: Sale[] = data.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Sale, "id">)
    }))

    setSales(list)
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

    await addDoc(salesCollection, {
      ...sale,
      user: username,
      date,
      time
    })
    loadSales()
  }

  async function updateSale(sale: SaleInput) {
    console.log(`-------- Sale: ${JSON.stringify(sale)}`)
    try {
      if (!user?.email) return
      const username = user.email.split("@")[0].split(".")[0]
      if (!editingSale?.id) return
      const saleDoc = doc(db, "sales", editingSale.id)
      console.log(`-------- Sale id: ${editingSale.id}`)
      await updateDoc(saleDoc, {
        ...sale,
        user: username,
      })
      setEditingSale(null)
      loadSales()
    } catch (error) {
      console.log(error)
    }
  }

  async function deleteSale(id?: string) {
    if (!id) return
    const saleDoc = doc(db, "sales", id)
    await deleteDoc(saleDoc)
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

  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  function parseDate(dateStr: string) {
    const [day, month, year] = dateStr.split("/")
    return new Date(`${year}-${month}-${day}`)
  }

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
      return dateB.getTime() - dateA.getTime() // mais recente primeiro
    })
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage)

  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem)
  const today = new Date().toLocaleDateString("pt-BR")

  const totalToday = sales
    .filter(sale => sale.date === today)
    .reduce((sum, sale) => sum + sale.total, 0)

  if (loadingAuth) return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Carregando...</p>
    </div>
  )

  if (!user) return <Login />

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex gap-4">
            <div className="bg-purple-500 text-white p-4 rounded-xl shadow">
              <p className="text-sm">Vendido no período</p>
              <p className="text-2xl font-bold">
                {startDate || endDate ? `R$ ${totalByPeriod.toFixed(2)}` : "—"}
              </p>
            </div>
            <div className="bg-blue-500 text-white p-4 rounded-xl shadow">
              <p className="text-sm">Vendido hoje</p>
              <p className="text-2xl font-bold">R$ {totalToday.toFixed(2)}</p>
            </div>
            <div className="bg-green-500 text-white p-4 rounded-xl shadow">
              <p className="text-sm">Total vendido</p>
              <p className="text-2xl font-bold">R$ {totalSalesValue.toFixed(2)}</p>
            </div>
            <div className="bg-yellow-400 text-white p-4 rounded-xl shadow">
              <p className="text-sm">Total de pipocas</p>
              <p className="text-2xl font-bold">{totalPipocas}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
            >
              Nova venda
            </button>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow mb-4 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded w-full"
          />

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border p-2 rounded"
          />
          <button
            onClick={clearFilters}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Limpar
          </button>
        </div>
        {/* TABELA */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-200 text-left">
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
                <tr key={sale.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{sale.user}</td>
                  <td className="p-3">{sale.date}</td>
                  <td className="p-3">{sale.time}</td>
                  <td className="p-3 capitalize">{sale.flavor}</td>
                  <td className="p-3">R$ {sale.price}</td>
                  <td className="p-3">{sale.quantity}</td>
                  <td className="p-3 font-semibold">R$ {sale.total}</td>
                  <td className="p-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setEditingSale(sale)
                          setModalOpen(true)
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteSale(sale.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
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
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
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