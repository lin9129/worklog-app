'use server'

import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'

// Master Data
export async function getMasterData() {
    try {
        const [users, products, processes, parts] = await Promise.all([
            prisma.user.findMany({ orderBy: { name: 'asc' } }),
            prisma.product.findMany({
                orderBy: { name: 'asc' },
                include: { processes: true }
            }),
            prisma.process.findMany({
                orderBy: { name: 'asc' },
                include: { products: true }
            }),
            prisma.part.findMany({
                orderBy: { name: 'asc' },
                include: { product: true }
            }),
        ])
        return { users, products, processes, parts }
    } catch (error) {
        console.error('Failed to fetch master data:', error)
        throw new Error('Failed to fetch master data')
    }
}

// Master CRUD Actions
export async function createMasterItem(type: 'user' | 'product' | 'process' | 'part', data: any) {
    try {
        switch (type) {
            case 'user':
                await prisma.user.create({
                    data: {
                        name: data.name,
                        employmentType: data.employmentType || null
                    }
                })
                break
            case 'product':
                await prisma.product.create({
                    data: {
                        name: data.name,
                        processes: { connect: data.processIds?.map((id: string) => ({ id })) || [] }
                    }
                })
                break
            case 'process': {
                await prisma.process.create({
                    data: { name: data.name }
                })
                break
            }
            case 'part':
                await prisma.part.create({
                    data: {
                        name: data.name,
                        productId: data.productId,
                        modelNumber: data.modelNumber,
                        description: data.description,
                        componentCategory: data.componentCategory
                    }
                })
                break
        }
        revalidatePath('/master')
        revalidatePath('/')
    } catch (error: any) {
        console.error(`Failed to create ${type}:`, error)
        throw new Error(`Failed to create ${type}: ${error?.message || error}`)
    }
}

export async function updateMasterItem(type: 'user' | 'product' | 'process' | 'part', id: string, data: any) {
    try {
        switch (type) {
            case 'user':
                await prisma.user.update({
                    where: { id },
                    data: {
                        name: data.name,
                        employmentType: data.employmentType || null
                    }
                })
                break
            case 'product':
                await prisma.product.update({
                    where: { id },
                    data: {
                        name: data.name,
                        processes: { set: data.processIds?.map((id: string) => ({ id })) || [] }
                    }
                })
                break
            case 'process': {
                await prisma.process.update({
                    where: { id },
                    data: { name: data.name }
                })
                break
            }
            case 'part':
                await prisma.part.update({
                    where: { id },
                    data: {
                        name: data.name,
                        productId: data.productId,
                        modelNumber: data.modelNumber,
                        description: data.description,
                        componentCategory: data.componentCategory
                    }
                })
                break
        }
        revalidatePath('/master')
        revalidatePath('/')
    } catch (error: any) {
        console.error(`Failed to update ${type}:`, error)
        throw new Error(`Failed to update ${type}: ${error?.message || error}`)
    }
}

export async function deleteMasterItem(type: 'user' | 'product' | 'process' | 'part', id: string) {
    try {
        switch (type) {
            case 'user': await prisma.user.delete({ where: { id } }); break
            case 'product': await prisma.product.delete({ where: { id } }); break
            case 'process': await prisma.process.delete({ where: { id } }); break
            case 'part': await prisma.part.delete({ where: { id } }); break
        }
        revalidatePath('/master')
    } catch (error: any) {
        console.error(`Failed to delete ${type}:`, error)
        throw new Error(`削除に失敗しました: 使用中データが含まれているか、${error?.message || error}`)
    }
}

export async function deleteWorkLog(id: string) {
    try {
        await prisma.workLog.delete({ where: { id } })
        revalidatePath('/')
        revalidatePath('/lot-summary')
    } catch (error: any) {
        console.error('Failed to delete work log:', error)
        throw new Error(`作業記録の削除に失敗しました: ${error?.message || error}`)
    }
}

// Work Logs
export async function getWorkLogs(filters?: {
    userId?: string,
    productId?: string,
    lotNumber?: string,
    status?: string,
    startDate?: string,
    endDate?: string
}) {
    try {
        const where: any = {}
        if (filters?.userId) where.userId = filters.userId
        if (filters?.productId) where.productId = filters.productId
        if (filters?.lotNumber) where.lotNumber = { contains: filters.lotNumber }
        if (filters?.status) where.status = filters.status
        if (filters?.startDate || filters?.endDate) {
            where.date = {}
            if (filters.startDate) where.date.gte = new Date(filters.startDate)
            if (filters.endDate) where.date.lte = new Date(filters.endDate)
        }

        return await prisma.workLog.findMany({
            where,
            include: {
                user: true,
                product: true,
                process: true,
                part: true,
            },
            orderBy: { date: 'desc' }
        })
    } catch (error) {
        console.error('Failed to fetch work logs:', error)
        throw new Error('Failed to fetch work logs')
    }
}

export async function createWorkLog(formData: FormData) {
    const userId = formData.get('userId') as string
    const productId = formData.get('productId') as string
    const partId = formData.get('partId') as string
    const processId = formData.get('processId') as string
    const lotNumber = formData.get('lotNumber') as string
    const dateStr = formData.get('date') as string
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string
    const status = (formData.get('status') as string) || '作業中'
    const remarks = formData.get('remarks') as string

    // Pre-flight validation
    const missing: string[] = []
    if (!userId) missing.push('担当者(userId)')
    if (!productId) missing.push('商品名(productId)')
    if (!partId) missing.push('部品名(partId)')
    if (!processId) missing.push('工程(processId)')
    if (!dateStr) missing.push('日付(date)')
    if (!startTime) missing.push('開始時間(startTime)')

    if (missing.length > 0) {
        throw new Error(`必須項目が不足しています: ${missing.join(', ')}`)
    }

    // Duration calculation (in minutes)
    let duration = null
    if (startTime && endTime) {
        const [startH, startM] = startTime.split(':').map(Number)
        const [endH, endM] = endTime.split(':').map(Number)
        duration = (endH * 60 + endM) - (startH * 60 + startM)
        if (duration < 0) duration += 24 * 60 // handles overnight
    }

    try {
        // Try with lotNumber first
        let newLog
        try {
            newLog = await (prisma.workLog as any).create({
                data: {
                    userId,
                    productId,
                    partId,
                    processId,
                    lotNumber: lotNumber || null,
                    date: new Date(dateStr),
                    startTime,
                    endTime: endTime || null,
                    duration,
                    status,
                    remarks: remarks || null,
                }
            })
        } catch {
            // Fallback: create without lotNumber, then update via raw SQL
            newLog = await prisma.workLog.create({
                data: {
                    userId,
                    productId,
                    partId,
                    processId,
                    date: new Date(dateStr),
                    startTime,
                    endTime: endTime || null,
                    duration,
                    status,
                    remarks: remarks || null,
                }
            })
            if (lotNumber) {
                try {
                    await prisma.$executeRawUnsafe(
                        `UPDATE "WorkLog" SET "lotNumber" = ? WHERE "id" = ?`,
                        lotNumber,
                        newLog.id
                    )
                } catch {
                    // lotNumber update failed silently - not critical
                }
            }
        }
        revalidatePath('/')
    } catch (error: any) {
        console.error('Failed to create work log:', error)
        throw new Error(`登録エラー: ${error?.message || error}`)
    }
}

export async function updateWorkLog(id: string, formData: FormData) {
    const status = formData.get('status') as string
    const endTime = formData.get('endTime') as string
    const remarks = formData.get('remarks') as string

    try {
        const original = await prisma.workLog.findUnique({ where: { id } })
        if (!original) throw new Error('WorkLog not found')

        let duration = original.duration
        if (original.startTime && endTime) {
            const [startH, startM] = original.startTime.split(':').map(Number)
            const [endH, endM] = endTime.split(':').map(Number)
            duration = (endH * 60 + endM) - (startH * 60 + startM)
            if (duration < 0) duration += 24 * 60
        }

        await prisma.workLog.update({
            where: { id },
            data: {
                status,
                endTime: endTime || null,
                duration,
                remarks,
            }
        })
        revalidatePath('/')
    } catch (error) {
        console.error('Failed to update work log:', error)
        throw new Error('Failed to update work log')
    }
}

// Dashboard Data
export async function getDashboardData() {
    try {
        // Aggregate by Product
        const productsData = await prisma.workLog.groupBy({
            by: ['productId'],
            _sum: { duration: true },
        })
        const productsWithNames = await Promise.all(productsData.map(async (item: { productId: string; _sum: { duration: number | null } }) => {
            const product = await prisma.product.findUnique({ where: { id: item.productId } })
            return { name: product?.name || 'Unknown', total: item._sum.duration || 0 }
        }))

        // Aggregate by User
        const usersData = await prisma.workLog.groupBy({
            by: ['userId'],
            _sum: { duration: true },
        })
        const usersWithNames = await Promise.all(usersData.map(async (item: { userId: string; _sum: { duration: number | null } }) => {
            const user = await prisma.user.findUnique({ where: { id: item.userId } })
            return { name: user?.name || 'Unknown', total: item._sum.duration || 0 }
        }))

        // Aggregate by Lot Number (Product + Lot) - Manual aggregation to bypass Prisma field validation issues
        const allLogs = await prisma.workLog.findMany()

        const lotMap = new Map<string, number>()
        for (const log of allLogs) {
            const key = `${log.productId}|${log.lotNumber || ''}`
            lotMap.set(key, (lotMap.get(key) || 0) + (log.duration || 0))
        }

        const lotsWithNames = await Promise.all(
            Array.from(lotMap.entries()).map(async ([key, total]) => {
                const [pid, lot] = key.split('|')
                const product = await prisma.product.findUnique({ where: { id: pid } })
                const label = `${product?.name || 'Unknown'} (${lot || 'No Lot'})`
                return { name: label, total }
            })
        )

        return { products: productsWithNames, users: usersWithNames, lots: lotsWithNames }
    } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        throw new Error('Failed to fetch dashboard data')
    }
}

// Lot Summary
export async function getLotSummaryData() {
    try {
        const logs = await prisma.workLog.findMany({
            include: { user: true, process: true, part: true, product: true },
            orderBy: { date: 'desc' }
        })

        const lotSummaries = await prisma.lotSummary.findMany()

        const grouped = new Map<string, any>()

        for (const log of logs) {
            const lot = log.lotNumber || ''
            const pid = log.productId

            // Skip logs without a product
            if (!pid || !log.product) continue

            const key = `${lot}|${pid}`
            if (!grouped.has(key)) {
                // Find matching manual summary (ignoring date)
                const summary = lotSummaries.find(
                    (s: any) => s.lotNumber === lot && s.productId === pid
                )

                grouped.set(key, {
                    lotNumber: lot,
                    productId: pid,
                    productName: log.product.name,
                    totalDuration: 0,
                    fullTimeDuration: 0,
                    partTimeDuration: 0,
                    userDurations: new Map<string, { name: string, duration: number }>(),
                    productionCount: summary?.productionCount ?? null,
                    productionTime: summary?.productionTime ?? null,
                    datesMap: new Map<string, any>()
                })
            }

            const group = grouped.get(key)
            const duration = log.duration || 0
            group.totalDuration += duration

            // Summarize by employment type
            if (log.user?.employmentType === '正社員') {
                group.fullTimeDuration += duration
            } else if (log.user?.employmentType === 'パート') {
                group.partTimeDuration += duration
            }

            // Summarize by user
            if (log.user) {
                if (!group.userDurations.has(log.user.id)) {
                    group.userDurations.set(log.user.id, { name: log.user.name, duration: 0 })
                }
                const userSum = group.userDurations.get(log.user.id)
                userSum.duration += duration
            }

            const dateStr = log.date.toISOString().split('T')[0]
            if (!group.datesMap.has(dateStr)) {
                group.datesMap.set(dateStr, {
                    date: dateStr,
                    dailyDuration: 0,
                    logs: []
                })
            }

            const dateGroup = group.datesMap.get(dateStr)
            dateGroup.dailyDuration += duration
            dateGroup.logs.push(log)
        }

        // Convert nested maps to arrays and sort by recent active date
        const result = Array.from(grouped.values()).map(g => {
            const datesArr = Array.from(g.datesMap.values()).sort((a: any, b: any) => b.date.localeCompare(a.date))
            const usersArr = Array.from(g.userDurations.values()).sort((a: any, b: any) => b.duration - a.duration)

            return {
                lotNumber: g.lotNumber,
                productId: g.productId,
                productName: g.productName,
                totalDuration: g.totalDuration,
                fullTimeDuration: g.fullTimeDuration,
                partTimeDuration: g.partTimeDuration,
                users: usersArr,
                productionCount: g.productionCount,
                productionTime: g.productionTime,
                dates: datesArr
            }
        })

        // Sort outer array by the most recent date found in `dates`
        return result.sort((a, b) => {
            const dateA = a.dates[0]?.date || ''
            const dateB = b.dates[0]?.date || ''
            return dateB.localeCompare(dateA)
        })

    } catch (error) {
        console.error('Failed to fetch lot summary data:', error)
        throw new Error('集計データの取得に失敗しました')
    }
}

export async function saveLotSummary(lotNumber: string, productId: string, productionCount: number | null, productionTime: number | null) {
    try {
        const safeLotNumber = lotNumber || '' // Ensure lotNumber is not null for indexing

        await prisma.lotSummary.upsert({
            where: {
                lotNumber_productId: {
                    lotNumber: safeLotNumber,
                    productId
                }
            },
            update: {
                productionCount,
                productionTime
            },
            create: {
                lotNumber: safeLotNumber,
                productId,
                productionCount,
                productionTime
            }
        })
        revalidatePath('/lot-summary')
    } catch (error: any) {
        console.error('Failed to save lot summary:', error)
        throw new Error(`保存エラー: ${error?.message || error}`)
    }
}
