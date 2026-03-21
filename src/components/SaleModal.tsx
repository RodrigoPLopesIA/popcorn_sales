import { useEffect, useState } from "react"
import type { Sale } from "../types/Sales"
import type { User } from "firebase/auth"

interface Props {
  user: User
  isOpen: boolean
  onClose: () => void
  onSave: (sale: Sale) => void
  editingSale: Sale | null
}

export default function SaleModal({ user, isOpen, onClose, onSave, editingSale }: Props) {

  const [flavor, setFlavor] = useState<"chocolate" | "morango" | "ninho" | "pistache" | "ovo_maltine">("morango")
  const [quantity, setQuantity] = useState<number>(1)
  const [price, setPrice] = useState(editingSale?.price || 17)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")

  function formatDateForInput(dateStr: string) {
    const [day, month, year] = dateStr.split("/")
    return `${year}-${month}-${day}`  // YYYY-MM-DD
  }

  function formatDateForSave(dateStr: string) {
    const [year, month, day] = dateStr.split("-")
    return `${day}/${month}/${year}`  // DD/MM/YYYY
  }
  useEffect(() => {
    if (isOpen) {
      if (editingSale) {
        setFlavor(editingSale.flavor)
        setQuantity(editingSale.quantity)
        setPrice(editingSale.price)
        setDate(formatDateForInput(editingSale.date))
        setTime(editingSale.time.slice(0, 5))

      } else {
        const now = new Date()
        setDate(now.toISOString().split("T")[0])
        setTime(now.toTimeString().slice(0, 5))
        setPrice(17)
        setFlavor("ninho")
        setQuantity(1)
      }
    }
  }, [isOpen, editingSale])

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    onSave({
      flavor,
      quantity,
      price,
      total: quantity * price,
      user: user?.email?.split("@")[0] as string,
      date: formatDateForSave(date),
      time
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
                setFlavor(e.target.value as "chocolate" | "morango" | "ninho" | "pistache" | "ovo_maltine")
              }
            >
              <option value="chocolate">🍫 Chocolate</option>
              <option value="morango">🍓 Morango</option>
              <option value="ninho">🥛 Ninho</option>
              <option value="pistache">🌰 Pistache</option>
              <option value="ovo_maltine">🍫 Ovo Maltine</option>
            </select>

          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">
              Preço (R$)
            </label>

            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
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
              min={1}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />

          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />

          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />

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