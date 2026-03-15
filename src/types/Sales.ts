export interface Sale {
  id?: string
  flavor: "chocolate" | "morango" | "ninho"
  price: number
  quantity: number
  total: number
}

export type SaleInput = Omit<Sale, "id">