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
import type { Sale } from "./types/Sales"

function App() {

  const [sales, setSales] = useState<Sale[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)

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

  async function createSale(sale: Sale) {

    await addDoc(salesCollection, sale)

    loadSales()
  }

  async function updateSale(sale: Sale) {

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
    <div style={{ padding: 30 }}>

      <h1>🍿 Controle de Pipoca</h1>

      <button onClick={() => setModalOpen(true)}>
        Nova venda
      </button>

      <table border={1} cellPadding={10} style={{ marginTop: 20 }}>

        <thead>
          <tr>
            <th>Sabor</th>
            <th>Quantidade</th>
            <th>Valor</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>

          {sales.map((sale) => (

            <tr key={sale.id}>

              <td>{sale.flavor}</td>
              <td>{sale.quantity}</td>
              <td>R${sale.total}</td>

              <td>

                <button
                  onClick={() => {
                    setEditingSale(sale)
                    setModalOpen(true)
                  }}
                >
                  Editar
                </button>

                <button
                  onClick={() => deleteSale(sale.id)}
                >
                  Excluir
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

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