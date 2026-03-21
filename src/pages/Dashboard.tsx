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
    ResponsiveContainer,
    BarChart,
    Bar
} from "recharts"

function Dashboard() {
    const [sales, setSales] = useState<Sale[]>([])
    const START_DATE = new Date("2026-03-14")
    const salesCollection = collection(db, "sales")

    useEffect(() => {
        loadSales()
    }, [])

    async function loadSales() {
        const data = await getDocs(salesCollection)

        const list: Sale[] = data.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<Sale, "id">)
        }))

        setSales(list)
    }
    // 📊 lista única de sabores (colunas)
    const allFlavors = Array.from(
        new Set(sales.map(s => s.flavor))
    )

    // 📊 agrupar por data com sabores em colunas
    const salesTable = Object.values(
        sales.reduce((acc: any, sale) => {
            if (!acc[sale.date]) {
                acc[sale.date] = {
                    date: sale.date,
                    total: 0
                }

                // inicializa todos sabores com 0
                allFlavors.forEach(flavor => {
                    acc[sale.date][flavor] = 0
                })
            }

            acc[sale.date][sale.flavor] += sale.quantity
            acc[sale.date].total += sale.total

            return acc
        }, {})
    ).sort((a: any, b: any) => {
        const parse = (d: string) => {
            const [day, month, year] = d.split("/")
            return new Date(`${year}-${month}-${day}`).getTime()
        }
        return parse(b.date) - parse(a.date)
    })
    function formatWithDay(dateStr: string) {
        const [day, month, year] = dateStr.split("/")
        const date = new Date(`${year}-${month}-${day}`)

        const weekDay = date.getDay()

        return `${weekDay === 6 ? "Sáb" : "Dom"} ${dateStr}`
    }

    function getWeekendSalesRange() {
        const result: { date: string; total: number }[] = []

        const today = new Date()
        const endDate = new Date()
        endDate.setDate(today.getDate() + 14)

        let current = new Date(START_DATE)

        while (current <= endDate) {
            const day = current.getDay()

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

    // 📊 dados gráfico vendedores
    const rankingChartData = ranking.map((item: any) => ({
        user: item.user,
        total: item.total
    }))

    // 🍿 Sabores
    const flavors = Object.values(
        sales.reduce((acc: any, sale) => {
            if (!acc[sale.flavor]) {
                acc[sale.flavor] = { flavor: sale.flavor, quantity: 0 }
            }
            acc[sale.flavor].quantity += sale.quantity
            return acc
        }, {})
    ).sort((a: any, b: any) => b.quantity - a.quantity)

    // 📊 dados gráfico sabores
    const flavorChartData = flavors.map((item: any) => ({
        flavor: item.flavor,
        quantity: item.quantity
    }))

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-6xl mx-auto space-y-6">

                <h1 className="text-2xl font-bold">📊 Dashboard</h1>
                {/* 📋 TABELA DINÂMICA */}
                <div className="bg-white p-4 rounded-xl shadow">
                    <h2 className="font-semibold mb-4">
                        📅 Vendas por sabor (por dia)
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">

                            {/* HEADER */}
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 text-left">Data</th>

                                    {allFlavors.map((flavor) => (
                                        <th key={flavor} className="p-2 text-left capitalize">
                                            {flavor}
                                        </th>
                                    ))}

                                    <th className="p-2 text-left">Total</th>
                                </tr>
                            </thead>

                            {/* BODY */}
                            <tbody>
                                {salesTable.map((day: any) => (
                                    <tr key={day.date} className="border-b">

                                        {/* Data */}
                                        <td className="p-2 whitespace-nowrap">
                                            {day.date}
                                        </td>

                                        {/* Sabores */}
                                        {allFlavors.map((flavor) => (
                                            <td key={flavor} className="p-2">
                                                {day[flavor] || 0}
                                            </td>
                                        ))}

                                        {/* Total */}
                                        <td className="p-2 font-semibold whitespace-nowrap">
                                            R$ {day.total.toFixed(2)}
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* 📈 GRÁFICO LINHA */}
                <div className="bg-white p-4 rounded-xl shadow">
                    <h2 className="font-semibold mb-4">
                        Vendas últimos finais de semana
                    </h2>

                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={weekendSales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="total"
                                stroke="#ec4899"
                                strokeWidth={3}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* 🏆 + 🍿 */}
                <div className="grid md:grid-cols-2 gap-4">

                    {/* 🏆 Ranking com gráfico */}
                    <div className="bg-white p-4 rounded-xl shadow">
                        <h2 className="font-semibold mb-4">
                            🏆 Ranking vendedores
                        </h2>

                        {/* 📊 GRÁFICO */}
                        <div className="w-full h-56 mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={rankingChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="user" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar
                                        dataKey="total"
                                        fill="#ec4899"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* 📋 LISTA */}
                        {ranking.map((item: any, index) => (
                            <div key={item.user} className="flex justify-between border-b py-1">
                                <span>{index + 1}. {item.user}</span>
                                <span>R$ {item.total.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    {/* 🍿 Sabores */}
                    <div className="bg-white p-4 rounded-xl shadow">
                        <h2 className="font-semibold mb-4">
                            🍿 Sabores mais vendidos
                        </h2>

                        {/* 📊 GRÁFICO */}
                        <div className="w-full h-56 mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={flavorChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="flavor" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar
                                        dataKey="quantity"
                                        fill="#ec4899"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* 📋 LISTA */}
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