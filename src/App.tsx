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

import SaleModal from "./components/SaleModal"
import type { Sale, SaleInput } from "./types/Sales"

function App() {

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

  useEffect(() => {
    loadSales()
  }, [])

  async function createSale(sale: SaleInput) {
    await addDoc(salesCollection, sale)
    loadSales()
  }

  async function updateSale(sale: SaleInput) {

    if (!editingSale?.id) return

    const saleDoc = doc(db, "sales", editingSale.id)

    await updateDoc(saleDoc, sale)

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

  return (

    <div className="min-h-screen bg-gray-100 p-4">

      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">

          <h1 className="text-2xl font-bold">
            🍿 Controle de Pipoca
          </h1>
          {/* TOTAL DE VENDAS */}

          <div className="bg-green-500 text-white p-4 rounded-xl mb-4 shadow">

            <p className="text-sm">
              Total vendido
            </p>

            <p className="text-2xl font-bold">
              R$ {totalSales.toFixed(2)}
            </p>

          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
          >
            Nova venda
          </button>

        </div>


        {/* TABELA */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-200 text-left">

              <tr>
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