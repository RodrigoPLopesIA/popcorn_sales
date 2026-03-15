import { useEffect, useState } from "react"
import type { Sale } from "../types/Sales"

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (sale: Sale) => void
  editingSale: Sale | null
}

export default function SaleModal({ isOpen, onClose, onSave, editingSale }: Props) {

  const [flavor, setFlavor] = useState<"chocolate" | "morango" | "ninho">("morango")
  const [quantity, setQuantity] = useState<number>(0)

  useEffect(() => {
    if (editingSale) {
      setFlavor(editingSale.flavor)
      setQuantity(editingSale.quantity)
    } else {
      setFlavor("ninho")
      setQuantity(0)
    }
  }, [editingSale])

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    onSave({
      flavor,
      price: 17,
      quantity,
      total: quantity * 17
    })

    onClose()
  }

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">

      <div className="bg-white w-full max-w-sm rounded-xl shadow-lg p-6">

        <h3 className="text-xl font-bold mb-4">
          {editingSale ? "Editar venda" : "Nova venda"}
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* SABOR */}
          <div className="flex flex-col gap-1">

            <label className="text-sm font-medium">
              Sabor
            </label>

            <select
              className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={flavor}
              onChange={(e) =>
                setFlavor(e.target.value as "chocolate" | "morango" | "ninho")
              }
            >
              <option value="chocolate">🍫 Chocolate</option>
              <option value="morango">🍓 Morango</option>
              <option value="ninho">🥛 Ninho</option>
            </select>

          </div>


          {/* QUANTIDADE */}
          <div className="flex flex-col gap-1">

            <label className="text-sm font-medium">
              Quantidade
            </label>

            <input
              type="number"
              placeholder="Quantidade"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />

          </div>


          {/* BOTÕES */}
          <div className="flex gap-3 mt-2">

            <button
              type="submit"
              className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
            >
              Salvar
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 transition"
            >
              Cancelar
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}