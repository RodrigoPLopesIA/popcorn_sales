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
      quantity,
      total: quantity * 5
    })

    onClose()
  }

  return (
    <div style={{ background: "#00000088", position: "fixed", inset: 0 }}>
      <div style={{ background: "white", padding: 20, margin: "100px auto", width: 300 }}>

        <h3>{editingSale ? "Editar venda" : "Nova venda"}</h3>

        <form onSubmit={handleSubmit}>

          <input
            placeholder="Sabor"
            value={flavor}
            onChange={(e) => setFlavor(e.target.value as "chocolate" | "morango" | "ninho")}
          />

          <input
            type="number"
            placeholder="Quantidade"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />

          <button type="submit">Salvar</button>
          <button type="button" onClick={onClose}>Cancelar</button>

        </form>
      </div>
    </div>
  )
}