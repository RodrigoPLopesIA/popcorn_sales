import { useEffect, useState } from "react"
import { db } from "./services/firebase"
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc
} from "firebase/firestore"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "./services/firebase"
import Login from "./pages/Login"
import SaleModal from "./components/SaleModal"
import type { Sale, SaleInput } from "./types/Sales"
import { signOut } from "firebase/auth"

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [sales, setSales] = useState<Sale[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0)
  const salesCollection = collection(db, "sales")

  async function loadSales() {
    const data = await getDocs(salesCollection)

    const list: Sale[] = data.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Sale, "id">)
    }))

    setSales(list)
  }
  async function handleLogout() {
    await signOut(auth)
  }
  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoadingAuth(false)
    })

    return () => unsubscribe()

  }, [])
  useEffect(() => {
    if (user) {
      loadSales()
    }
  }, [user])

  async function createSale(sale: SaleInput) {

    if (!user?.email) return

    const now = new Date()

    const date = now.toLocaleDateString("pt-BR")
    const time = now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    })

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

    if (!editingSale?.id) return

    const saleDoc = doc(db, "sales", editingSale.id)

    await updateDoc(saleDoc, {
      ...sale,
      user: editingSale.user,
      date: editingSale.date,
      time: editingSale.time
    })

    setEditingSale(null)

    loadSales()
  }

  async function deleteSale(id?: string) {

    if (!id) return

    const saleDoc = doc(db, "sales", id)

    await deleteDoc(saleDoc)

    loadSales()
  }

  function handleSave(sale: Sale) {

    if (editingSale) {
      updateSale(sale)
    } else {
      createSale(sale)
    }
  }
  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }
  return (

    <div className="min-h-screen bg-gray-100 p-4">

      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">

          <h1 className="text-2xl font-bold">
            🍿 Controle de Pipoca
          </h1>

          {/* TOTAL DE VENDAS */}
          <div className="bg-green-500 text-white p-4 rounded-xl shadow">

            <p className="text-sm">
              Total vendido
            </p>

            <p className="text-2xl font-bold">
              R$ {totalSales.toFixed(2)}
            </p>

          </div>

          <div className="flex gap-2">

            <button
              onClick={() => setModalOpen(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
            >
              Nova venda
            </button>

            <button
              onClick={handleLogout}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              Sair
            </button>

          </div>

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

              {sales.map((sale) => (

                <tr
                  key={sale.id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-3">
                    {sale.user}
                  </td>

                  <td className="p-3">
                    {sale.date}
                  </td>

                  <td className="p-3">
                    {sale.time}
                  </td>
                  <td className="p-3 capitalize">
                    {sale.flavor}
                  </td>

                  <td className="p-3">
                    R$ {sale.price}
                  </td>

                  <td className="p-3">
                    {sale.quantity}
                  </td>

                  <td className="p-3 font-semibold">
                    R$ {sale.total}
                  </td>

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

      </div>


      <SaleModal
        user={user}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingSale(null)
        }}
        onSave={handleSave}
        editingSale={editingSale}
      />

    </div>
  )
}

export default App