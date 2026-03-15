export interface Sale {
  id?: string
  flavor: "chocolate" | "morango" | "ninho"
  price: number
  quantity: number
  total: number
  user: string
  date: string
  time: string
}

export type SaleInput = Omit<Sale, "id" | "user" | "date" | "time">