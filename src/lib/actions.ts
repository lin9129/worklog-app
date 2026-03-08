'use server'

import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'
import { calculateDuration } from './timeUtils'

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
                include: { products: { select: { id: true, name: true } } }
            }),
            prisma.part.findMany({
                orderBy: { name: 'asc' },
                include: { product: { select: { id: true, name: true } } }
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
                        employmentType: data.employmentType || null,
                        department: data.department || null
                    }
                })
                break
            case 'product':
                await prisma.product.create({
                    data: {
                        name: data.name,
                        category: data.category || null,
                        department: data.department || null,
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
                        employmentType: data.employmentType || null,
                        department: data.department || null
                    }
                })
                break
            case 'product':
                await prisma.product.update({
                    where: { id },
                    data: {
                        name: data.name,
                        category: data.category || null,
                        department: data.department || null,
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

// Production Slip CRUD (Robust Implementation using findUnique)
export async function upsertProductionSlip(data: any): Promise<{ success: boolean; error?: string }> {
    console.log('--- Production Slip Upsert Start ---')
    try {
        const lotNumber = String(data.lotNumber || '').trim()
        if (!lotNumber) return { success: false, error: 'ロット番号が空です' }

        const productId = (data.productId as string | null) || null
        const manualName = (data.manualProductName as string | null) || null
        const customerName = (data.customerName as string | null) || null
        const productionCount = data.productionCount ? parseInt(String(data.productionCount)) : null
        const remarks = (data.remarks as string | null) || null
        const deliveryDateStr = data.deliveryDate as string | null
        const department = (data.department as string | null) || null

        let deliveryDate = null
        if (deliveryDateStr) {
            const d = new Date(deliveryDateStr)
            if (!isNaN(d.getTime())) {
                deliveryDate = d
            }
        }

        console.log('Processing for lotNumber:', lotNumber)

        // Find existing by lotNumber
        const existing = await prisma.lotSummary.findUnique({
            where: { lotNumber }
        })

        const updateData = {
            productId,
            manualProductName: manualName,
            customerName,
            productionCount,
            remarks,
            deliveryDate,
            department
        }

        if (existing) {
            console.log('Updating existing record:', existing.id)
            await prisma.lotSummary.update({
                where: { lotNumber },
                data: updateData
            })
        } else {
            console.log('Creating new record')
            await prisma.lotSummary.create({
                data: {
                    lotNumber,
                    ...updateData
                }
            })
        }

        revalidatePath('/production-slips')
        revalidatePath('/')
        console.log('--- Production Slip Upsert Success ---')
        return { success: true }
    } catch (error: any) {
        console.error('--- Production Slip Upsert Failed ---')
        console.error('Error name:', error?.name)
        console.error('Error message:', error?.message)
        if (error?.code) console.error('Prisma Error Code:', error.code)
        return { success: false, error: error?.message || '不明なエラー' }
    }
}

export async function getActiveProductionSlips(department?: string) {
    try {
        const where: any = { isCompleted: false }
        if (department) where.department = department

        return await prisma.lotSummary.findMany({
            where,
            include: { product: true },
            orderBy: { createdAt: 'desc' }
        })
    } catch (error) {
        console.error('Failed to fetch production slips:', error)
        throw new Error('Failed to fetch production slips')
    }
}

// Work Logs
export async function getWorkLogs(filters?: {
    userId?: string,
    productId?: string,
    lotNumber?: string,
    status?: string,
    startDate?: string,
    endDate?: string,
    department?: string
}) {
    try {
        const where: any = {}
        if (filters?.userId) where.userId = filters.userId
        if (filters?.productId) where.productId = filters.productId
        if (filters?.lotNumber) where.lotNumber = { contains: filters.lotNumber }
        if (filters?.status) where.status = filters.status
        if (filters?.department) where.department = filters.department
        if (filters?.startDate || filters?.endDate) {
            where.date = {}
            if (filters.startDate) {
                const d = new Date(filters.startDate)
                if (!isNaN(d.getTime())) where.date.gte = d
            }
            if (filters.endDate) {
                const d = new Date(filters.endDate)
                if (!isNaN(d.getTime())) where.date.lte = d
            }
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
    const productId = (formData.get('productId') as string | null) || null
    const manualProductName = (formData.get('manualProductName') as string | null) || null
    const customerName = formData.get('customerName') as string | null
    const partId = (formData.get('partId') as string | null) || null
    const processId = (formData.get('processId') as string | null) || null
    const lotNumber = formData.get('lotNumber') as string | null
    const dateStr = formData.get('date') as string
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string | null
    const status = (formData.get('status') as string) || '作業中'
    const remarks = formData.get('remarks') as string | null
    const department = formData.get('department') as string | null

    if (!userId || !dateStr || !startTime) {
        throw new Error('必須項目が不足しています（担当者、日付、開始時間）')
    }

    let duration = null
    let overtimeDuration = null
    if (startTime && endTime) {
        const result = calculateDuration(startTime, endTime)
        duration = result.totalMinutes
        overtimeDuration = result.overtimeMinutes
    }

    try {
        await prisma.workLog.create({
            data: {
                userId,
                productId,
                manualProductName,
                customerName,
                partId,
                processId,
                lotNumber,
                date: new Date(dateStr),
                startTime,
                endTime,
                duration,
                overtimeDuration,
                status,
                remarks,
                department
            }
        })

        // Also sync LotSummary if lotNumber is provided
        if (lotNumber) {
            const existing = await prisma.lotSummary.findUnique({
                where: { lotNumber }
            })
            if (existing) {
                await prisma.lotSummary.update({
                    where: { lotNumber },
                    data: {
                        productId: productId || existing.productId,
                        manualProductName: manualProductName || existing.manualProductName,
                        customerName: customerName || existing.customerName,
                        department: department || existing.department
                    }
                })
            } else {
                await prisma.lotSummary.create({
                    data: {
                        lotNumber,
                        productId,
                        manualProductName,
                        customerName,
                        department
                    }
                })
            }
        }

        revalidatePath('/')
        revalidatePath('/lot-summary')
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
        let overtimeDuration = original.overtimeDuration
        if (original.startTime && endTime) {
            const result = calculateDuration(original.startTime, endTime)
            duration = result.totalMinutes
            overtimeDuration = result.overtimeMinutes
        }

        await prisma.workLog.update({
            where: { id },
            data: {
                status,
                endTime: endTime || null,
                duration,
                overtimeDuration,
                remarks,
            }
        })
        revalidatePath('/')
    } catch (error) {
        console.error('Failed to update work log:', error)
        throw new Error('Failed to update work log')
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

// Dashboard Data
export async function getDashboardData() {
    try {
        const allLogs = await prisma.workLog.findMany({
            include: { product: true, user: true }
        })

        const productMap = new Map<string, number>()
        const userMap = new Map<string, number>()
        const lotMap = new Map<string, number>()

        for (const log of allLogs) {
            const duration = log.duration || 0

            const pName = log.product?.name || log.manualProductName || 'その他'
            productMap.set(pName, (productMap.get(pName) || 0) + duration)

            const uName = log.user?.name || '不明'
            userMap.set(uName, (userMap.get(uName) || 0) + duration)

            const lotKey = `${pName} (${log.lotNumber || 'No Lot'})`
            lotMap.set(lotKey, (lotMap.get(lotKey) || 0) + duration)
        }

        return {
            products: Array.from(productMap.entries()).map(([name, total]) => ({ name, total })),
            users: Array.from(userMap.entries()).map(([name, total]) => ({ name, total })),
            lots: Array.from(lotMap.entries()).map(([name, total]) => ({ name, total }))
        }
    } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        return { products: [], users: [], lots: [] }
    }
}

// Lot Summary & Analytics
export async function getLotSummaryData() {
    try {
        const logs = await prisma.workLog.findMany({
            include: { user: true, process: true, part: true, product: true },
            orderBy: { date: 'desc' }
        })

        const summaries = await prisma.lotSummary.findMany({
            include: { product: true }
        })

        const result = summaries.map((s: any) => {
            // Match logs by lotNumber only (simpler, more reliable)
            const lotLogs = logs.filter((l: any) => l.lotNumber === s.lotNumber)

            const totalDuration = lotLogs.reduce((acc: number, l: any) => acc + (l.duration || 0), 0)
            const totalOvertime = lotLogs.reduce((acc: number, l: any) => acc + (l.overtimeDuration || 0), 0)

            const userMap = new Map<string, { name: string, duration: number, overtime: number }>()
            lotLogs.forEach((l: any) => {
                if (!l.user) return
                if (!userMap.has(l.user.id)) {
                    userMap.set(l.user.id, { name: l.user.name, duration: 0, overtime: 0 })
                }
                const u = userMap.get(l.user.id)!
                u.duration += (l.duration || 0)
                u.overtime += (l.overtimeDuration || 0)
            })

            const datesMap = new Map<string, { date: string, dailyDuration: number, dailyOvertime: number, logs: any[] }>()
            lotLogs.forEach((l: any) => {
                const d = l.date.toISOString().split('T')[0]
                if (!datesMap.has(d)) {
                    datesMap.set(d, { date: d, dailyDuration: 0, dailyOvertime: 0, logs: [] })
                }
                const dg = datesMap.get(d)!
                dg.dailyDuration += (l.duration || 0)
                dg.dailyOvertime += (l.overtimeDuration || 0)
                dg.logs.push(l)
            })

            return {
                id: s.id,
                lotNumber: s.lotNumber,
                productId: s.productId,
                productName: s.product?.name || s.manualProductName || '未設定',
                customerName: s.customerName,
                productionCount: s.productionCount,
                deliveryDate: s.deliveryDate,
                remarks: s.remarks,
                isCompleted: s.isCompleted,
                completedAt: s.completedAt,
                totalDuration,
                totalOvertime,
                users: Array.from(userMap.values()),
                dates: Array.from(datesMap.values()).sort((a, b) => b.date.localeCompare(a.date))
            }
        })

        return result.sort((a: any, b: any) => {
            if (a.isCompleted && !b.isCompleted) return 1
            if (!a.isCompleted && b.isCompleted) return -1
            return (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0) || b.lotNumber.localeCompare(a.lotNumber)
        })
    } catch (error) {
        console.error('Lot summary failed:', error)
        return []
    }
}

export async function completeLot(id: string) {
    try {
        await prisma.lotSummary.update({
            where: { id },
            data: {
                isCompleted: true,
                completedAt: new Date()
            }
        })
        revalidatePath('/lot-summary')
        revalidatePath('/completed-products')
    } catch (error) {
        console.error('Complete failed:', error)
    }
}
