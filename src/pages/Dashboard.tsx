import { useEffect, useState } from "react"
import { db } from "../services/firebase"
import { collection, getDocs } from "firebase/firestore"
import type { Sale } from "../types/Sales"

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer
} from "recharts"

function Dashboard() {
    const [sales, setSales] = useState<Sale[]>([])
    const START_DATE = new Date("2026-03-14")
    const salesCollection = collection(db, "sales")

    useEffect(() => {
        loadSales()
    }, [])
    function formatWithDay(dateStr: string) {
        const [day, month, year] = dateStr.split("/")
        const date = new Date(`${year}-${month}-${day}`)

        const weekDay = date.getDay()

        return `${weekDay === 6 ? "Sáb" : "Dom"} ${dateStr}`
    }

    function getWeekendSalesRange() {
        const result: { date: string; total: number }[] = []

        const today = new Date()

        // 👉 calcula até 2 finais de semana à frente (~14 dias)
        const endDate = new Date()
        endDate.setDate(today.getDate() + 14)

        let current = new Date(START_DATE)

        while (current <= endDate) {
            const day = current.getDay() // 0 domingo | 6 sábado

            if (day === 0 || day === 6) {
                const formatted = current.toLocaleDateString("pt-BR")

                const total = sales
                    .filter(sale => sale.date === formatted)
                    .reduce((sum, sale) => sum + sale.total, 0)

                result.push({
                    date: formatWithDay(formatted),
                    total
                })
            }

            current.setDate(current.getDate() + 1)
        }

        return result
    }
    const weekendSales = getWeekendSalesRange()

    async function loadSales() {
        const data = await getDocs(salesCollection)

        const list: Sale[] = data.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<Sale, "id">)
        }))

        setSales(list)
    }

    // 📊 Últimos 7 dias
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)

        const formatted = d.toLocaleDateString("pt-BR")

        const total = sales
            .filter(sale => sale.date === formatted)
            .reduce((sum, sale) => sum + sale.total, 0)

        return {
            date: formatted,
            total
        }
    }).reverse()

    // 🏆 Ranking vendedores
    const ranking = Object.values(
        sales.reduce((acc: any, sale) => {
            if (!acc[sale.user]) {
                acc[sale.user] = { user: sale.user, total: 0 }
            }
            acc[sale.user].total += sale.total
            return acc
        }, {})
    ).sort((a: any, b: any) => b.total - a.total)

    // 🍿 Sabor mais vendido
    const flavors = Object.values(
        sales.reduce((acc: any, sale) => {
            if (!acc[sale.flavor]) {
                acc[sale.flavor] = { flavor: sale.flavor, quantity: 0 }
            }
            acc[sale.flavor].quantity += sale.quantity
            return acc
        }, {})
    ).sort((a: any, b: any) => b.quantity - a.quantity)

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-6xl mx-auto space-y-6">

                <h1 className="text-2xl font-bold">📊 Dashboard</h1>

                {/* 📊 GRÁFICO */}
                <div className="bg-white p-4 rounded-xl shadow">
                    <h2 className="font-semibold mb-2">Vendas últimos finais de semana</h2>

                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={weekendSales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="total" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* 🏆 + 🍿 */}
                <div className="grid md:grid-cols-2 gap-4">

                    {/* Ranking */}
                    <div className="bg-white p-4 rounded-xl shadow">
                        <h2 className="font-semibold mb-2">🏆 Ranking vendedores</h2>

                        {ranking.map((item: any, index) => (
                            <div key={item.user} className="flex justify-between border-b py-1">
                                <span>{index + 1}. {item.user}</span>
                                <span>R$ {item.total.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Sabores */}
                    <div className="bg-white p-4 rounded-xl shadow">
                        <h2 className="font-semibold mb-2">🍿 Sabores mais vendidos</h2>

                        {flavors.map((item: any) => (
                            <div key={item.flavor} className="flex justify-between border-b py-1">
                                <span className="capitalize">{item.flavor}</span>
                                <span>{item.quantity}</span>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Dashboard