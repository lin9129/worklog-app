'use server'

import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'
import { calculateDuration } from './timeUtils'

// Master Data
export async function getMasterData() {
    try {
        const [usersRaw, products, processes, parts] = await Promise.all([
            prisma.user.findMany({ orderBy: { name: 'asc' } }),
            prisma.product.findMany({
                orderBy: { name: 'asc' },
                include: { processes: true }
            }),
            prisma.process.findMany({
                orderBy: { name: 'asc' },
                include: { 
                    products: { select: { id: true, name: true } },
                    parts: { select: { id: true, name: true } }
                }
            }),
            prisma.part.findMany({
                orderBy: { name: 'asc' },
                include: { 
                    product: { select: { id: true, name: true } },
                    processes: { select: { id: true, name: true } }
                }
            }),
        ])

        const DEPT_ORDER: Record<string, number> = { '第一': 1, '第二': 2, '第三': 3, '第四': 4 };
        const users = usersRaw.sort((a: any, b: any) => {
            const orderA = DEPT_ORDER[a.department || ''] || 99;
            const orderB = DEPT_ORDER[b.department || ''] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return a.name.localeCompare(b.name, 'ja');
        });

        return { users, products, processes, parts }
    } catch (error) {
        console.error('Failed to fetch master data:', error)
        throw new Error('Failed to fetch master data')
    }
}

// Master CRUD Actions
export async function createMasterItem(type: 'user' | 'product' | 'process' | 'part', data: any) {
    try {
        if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
            throw new Error('名前は必須です')
        }
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
                        // department: data.department || null, // 削除
                        processes: { connect: data.processIds?.map((id: string) => ({ id })) || [] }
                    }
                })
                break
            case 'process': {
                await prisma.process.create({
                    data: {
                        name: data.name,
                        products: { connect: data.productIds?.map((id: string) => ({ id })) || [] },
                        parts: { connect: data.partIds?.map((id: string) => ({ id })) || [] }
                    }
                })
                break
            }
            case 'part':
                await prisma.part.create({
                    data: {
                        name: data.name,
                        productId: data.productId,
                        department: data.department || '',
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

export async function updateMasterItem(type: 'user' | 'product' | 'process' | 'part', id: string | null | undefined, data: any) {
    if (!id || typeof id !== 'string' || id.trim() === '') {
        console.error(`Update failed: Invalid ID for ${type}`, id)
        throw new Error('IDが指定されていないか、無効です')
    }
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
                        // department: data.department || null, // 削除
                        processes: { set: data.processIds?.map((id: string) => ({ id })) || [] }
                    }
                })
                break
            case 'process': {
                await prisma.process.update({
                    where: { id },
                    data: {
                        name: data.name,
                        products: { set: data.productIds?.map((id: string) => ({ id })) || [] },
                        parts: { set: data.partIds?.map((id: string) => ({ id })) || [] }
                    }
                })
                break
            }
            case 'part':
                await prisma.part.update({
                    where: { id },
                    data: {
                        name: data.name,
                        productId: data.productId,
                        department: data.department || '',
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

export async function deleteMasterItem(type: 'user' | 'product' | 'process' | 'part', id: string | null | undefined) {
    try {
        if (!id || typeof id !== 'string' || id.trim() === '') {
            console.error(`Delete failed: Invalid ID for ${type}`, id)
            throw new Error('IDが指定されていないか、無効です')
        }
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

        const id = data.id as string | null
        const productId = (data.productId as string | null) || null
        const manualName = (data.manualProductName as string | null) || null
        const customerName = (data.customerName as string | null) || null
        const productionCount = data.productionCount ? parseInt(String(data.productionCount)) : null
        const productionTime = data.productionTime ? parseInt(String(data.productionTime)) : null
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

        const updateData = {
            lotNumber,
            productId,
            manualProductName: manualName,
            customerName,
            productionCount,
            productionTime,
            remarks,
            deliveryDate,
            department,
            isCompleted: false,
            completedAt: null,
            status: "未着手" // 伝票登録時は未着手
        }

        if (id && typeof id === 'string' && id.trim() !== '') {
            // Edit mode: Update by ID
            console.log('Updating existing record by ID:', id)
            await prisma.lotSummary.update({
                where: { id: id.trim() },
                data: updateData
            })
        } else {
            if (!lotNumber) return { success: false, error: 'ロット番号が指定されていません' }
            // Create mode: Check for duplicate (lotNumber + product)
            const existing = await prisma.lotSummary.findFirst({
                where: { 
                    lotNumber: lotNumber.trim(),
                    productId,
                    manualProductName: manualName || null
                }
            })
            if (existing) {
                return { success: false, error: `ロット番号「${lotNumber}」と商品名の組み合わせは、既に登録されています。既存の伝票を修正するか、別の番号・名称を入力してください。` }
            }

            console.log('Creating new record')
            await prisma.lotSummary.create({
                data: {
                    ...updateData,
                    lotNumber: lotNumber.trim(),
                    manualProductName: manualName || null
                }
            })
        }

        revalidatePath('/production-slips')
        revalidatePath('/')
        console.log('--- Production Slip Upsert Success ---')
        return { success: true }
    } catch (error: any) {
        console.error('--- Production Slip Upsert Failed ---')
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
    const processName = (formData.get('processName') as string | null) || null
    const lotNumber = formData.get('lotNumber') as string | null
    const dateStr = formData.get('date') as string
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string | null
    const status = (formData.get('status') as string) || '作業中'
    const remarks = formData.get('remarks') as string | null
    const department = formData.get('department') as string | null
    const interruptionTime = parseInt(formData.get('interruptionTime') as string || '0')

    if (!userId || !dateStr || !startTime) {
        throw new Error('必須項目が不足しています（担当者、日付、開始時間）')
    }

    let duration = null
    let overtimeDuration = null
    if (startTime && endTime) {
        const result = calculateDuration(startTime, endTime, interruptionTime)
        duration = result.totalMinutes
        overtimeDuration = result.overtimeMinutes
    }

    let processId = (formData.get('processId') as string | null) || null
    if (processName) {
        const proc = await prisma.process.upsert({
            where: { name: processName },
            update: {},
            create: { name: processName }
        })
        processId = proc.id
    }

    try {
        const trimmedLot = lotNumber ? lotNumber.trim() : null

        await prisma.workLog.create({
            data: {
                userId,
                productId,
                manualProductName,
                customerName,
                partId,
                processId,
                lotNumber: trimmedLot,
                date: new Date(dateStr),
                startTime,
                endTime,
                duration,
                overtimeDuration,
                interruptionTime,
                status,
                remarks,
                department
            }
        })

        // Also sync LotSummary if lotNumber is provided
        if (trimmedLot) {
            const existing = await prisma.lotSummary.findFirst({
                where: { 
                    lotNumber: trimmedLot,
                    productId,
                    manualProductName: manualProductName || null
                }
            })
            if (existing) {
                await prisma.lotSummary.update({
                    where: { id: existing.id },
                    data: {
                        customerName: customerName || existing.customerName,
                        department: department || existing.department
                    }
                })
            } else {
                await prisma.lotSummary.create({
                    data: {
                        lotNumber: trimmedLot,
                        productId,
                        manualProductName: manualProductName || null,
                        customerName,
                        department,
                        status: "製作中" // 作業記録から作成された場合は製作中
                    }
                })
            }

            // Always ensure status is "製作中" when a work log is added
            const summary = await prisma.lotSummary.findFirst({
                where: { 
                    lotNumber: trimmedLot,
                    productId,
                    manualProductName: manualProductName || null
                }
            })
            if (summary && summary.status !== "製作中") {
                await prisma.lotSummary.update({
                    where: { id: summary.id },
                    data: { status: "製作中" }
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
    const interruptionTime = parseInt(formData.get('interruptionTime') as string || '0')
    const remarks = formData.get('remarks') as string

    try {
        if (!id || typeof id !== 'string' || id.trim() === '') throw new Error('IDが指定されていません')
        const original = await prisma.workLog.findUnique({ where: { id } })
        if (!original) throw new Error('WorkLog not found')

        let duration = original.duration
        let overtimeDuration = original.overtimeDuration
        if (original.startTime && endTime) {
            const result = calculateDuration(original.startTime, endTime, interruptionTime)
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
                interruptionTime,
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
    if (!id || typeof id !== 'string' || id.trim() === '') throw new Error('IDが指定されていません')
    try {
        const log = await prisma.workLog.findUnique({ where: { id } })
        
        await prisma.workLog.delete({ where: { id } })

        if (log && log.lotNumber) {
            // Check if any other logs exist for this lot (matching lotNumber + product)
            const remainingCount = await prisma.workLog.count({
                where: {
                    lotNumber: log.lotNumber,
                    productId: log.productId,
                    manualProductName: log.manualProductName || null
                }
            })

            if (remainingCount === 0) {
                // Find corresponding LotSummary
                const summary = await prisma.lotSummary.findFirst({
                    where: {
                        lotNumber: log.lotNumber,
                        productId: log.productId,
                        manualProductName: log.manualProductName || null
                    }
                })

                // Update the LotSummary to "未着手" instead of deleting
                if (summary) {
                    await prisma.lotSummary.update({
                        where: { id: summary.id },
                        data: { status: "未着手" }
                    })
                }
            }
        }

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
        // includeを使わず、個別にWorkLogを取得してnullのIDに安全に対応する
        const allLogs = await prisma.workLog.findMany({
            select: {
                id: true,
                productId: true,
                userId: true,
                lotNumber: true,
                duration: true,
                manualProductName: true,
            }
        })

        // 有効なIDのみでproductとuserを一括取得
        const validProductIds = [...new Set(allLogs.map((l: any) => l.productId).filter((id: any): id is string => typeof id === 'string' && id.trim().length > 0))]
        const validUserIds = [...new Set(allLogs.map((l: any) => l.userId).filter((id: any): id is string => typeof id === 'string' && id.trim().length > 0))]

        const products = validProductIds.length > 0
            ? await prisma.product.findMany({ where: { id: { in: validProductIds } }, select: { id: true, name: true } })
            : ([] as { id: string, name: string }[])
        const users = validUserIds.length > 0
            ? await prisma.user.findMany({ where: { id: { in: validUserIds } }, select: { id: true, name: true } })
            : ([] as { id: string, name: string }[])

        const productNamesById = new Map<string, string>(products.map((p: any) => [p.id, p.name]))
        const userNamesById = new Map<string, string>(users.map((u: any) => [u.id, u.name]))

        const productMap = new Map<string, number>()
        const userMap = new Map<string, number>()
        const lotMap = new Map<string, number>()

        for (const log of allLogs) {
            const duration = log.duration || 0

            const pName: string = (log.productId ? productNamesById.get(log.productId) : undefined) || log.manualProductName || 'その他'
            productMap.set(pName, (productMap.get(pName) || 0) + duration)

            const uName: string = (log.userId ? userNamesById.get(log.userId) : undefined) || '不明'
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
            select: {
                id: true, userId: true, productId: true, lotNumber: true,
                date: true, startTime: true, endTime: true,
                duration: true, overtimeDuration: true, remarks: true,
                manualProductName: true, customerName: true, department: true
            },
            orderBy: { date: 'desc' }
        })

        const validUserIds = [...new Set(logs.map((l: any) => l.userId).filter((id: any): id is string => typeof id === 'string' && id.trim().length > 0))]
        const users = validUserIds.length > 0
            ? await prisma.user.findMany({ where: { id: { in: validUserIds } } })
            : []
        const userMap = new Map(users.map((u: any) => [u.id, u]))

        // Build log user object mapping
        const logsWithUser = logs.map((l: any) => ({
            ...l,
            user: l.userId ? userMap.get(l.userId) : null
        }))

        // Fetch Holidays
        const holidays = await prisma.holiday.findMany();
        const holidaySet = new Set(holidays.map((h: any) => {
            const dateStr = new Intl.DateTimeFormat('sv-SE', {
                timeZone: 'Asia/Tokyo',
                year: 'numeric', month: '2-digit', day: '2-digit'
            }).format(h.date);
            return dateStr;
        }));

        const summaries = await prisma.lotSummary.findMany({
            select: {
                id: true, lotNumber: true, productId: true,
                manualProductName: true, customerName: true,
                productionCount: true, productionTime: true,
                deliveryDate: true, remarks: true, department: true,
                status: true, isCompleted: true, completedAt: true, createdAt: true,
                product: { select: { name: true } }
            }
        })

        const validProductIds = [...new Set(summaries.map((s: any) => s.productId).filter((id: any): id is string => typeof id === 'string' && id.trim().length > 0))]
        const products = validProductIds.length > 0
            ? await prisma.product.findMany({ where: { id: { in: validProductIds } }, select: { id: true, name: true } })
            : []
        const productMap = new Map(products.map((p: any) => [p.id, p]))

        const result = summaries.map((s: any) => {
            // Match logs by lotNumber AND product identity (robust comparison)
            const lotLogs = logsWithUser.filter((l: any) => {
                const lLot = (l.lotNumber || '').trim()
                const sLot = (s.lotNumber || '').trim()
                const lPid = l.productId || null
                const sPid = s.productId || null
                const lManual = l.manualProductName || null
                const sManual = s.manualProductName || null
                
                return lLot === sLot && lPid === sPid && lManual === sManual
            })

            const totalRegular = lotLogs.reduce((acc: number, l: any) => acc + (l.duration || 0), 0)
            const totalOvertime = lotLogs.reduce((acc: number, l: any) => acc + (l.overtimeDuration || 0), 0)
            const totalSum = totalRegular + totalOvertime

            // derive startedAt from logs
            let startedAt = null
            if (lotLogs.length > 0) {
                const dates = lotLogs.map((l: any) => new Date(l.date).getTime())
                startedAt = new Date(Math.min(...dates))
            }

            // Format Dates safely to JST string to avoid Hydration issues
            const getJSTDateString = (d: Date | string | number | null): string | null => {
                if (!d) return null;
                const srcDate = new Date(d);
                if (isNaN(srcDate.getTime())) return null;
                const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'Asia/Tokyo',
                    year: 'numeric', month: '2-digit', day: '2-digit'
                });
                const parts = formatter.formatToParts(srcDate);
                const yr = parts.find(p => p.type === 'year')?.value;
                const mo = parts.find(p => p.type === 'month')?.value;
                const da = parts.find(p => p.type === 'day')?.value;
                return `${yr}-${mo}-${da}`;
            };

            const startedAtStr = startedAt ? getJSTDateString(startedAt) : null;
            const dueDateStr = s.deliveryDate ? getJSTDateString(s.deliveryDate) : null;
            
            // Calculate expected completion date (estimatedEndDate) from startedAt ignoring holidays
            let estimatedEndDate = null;
            if (s.productionTime && startedAtStr) {
                let remainingMins = s.productionTime;
                let current = new Date(startedAtStr + 'T00:00:00Z'); // treated as UTC midnight
                
                while (remainingMins > 0) {
                    const currentJst = getJSTDateString(current)!;
                    if (current.getUTCDay() !== 0 && !holidaySet.has(currentJst)) {
                        remainingMins -= 420;
                    }
                    if (remainingMins > 0) {
                        current.setUTCDate(current.getUTCDate() + 1);
                    }
                }
                estimatedEndDate = getJSTDateString(current);
            }

            // If there are actual logs that go BEYOND the originally estimated end date, extend the bar to that day.
            const originalEstimatedEndDate = estimatedEndDate;
            if (estimatedEndDate && lotLogs.length > 0) {
                const dates = lotLogs.map((l: any) => getJSTDateString(l.date)).filter(Boolean).sort((a: any, b: any) => b.localeCompare(a));
                const lastLogDate = dates[0];
                if (lastLogDate > estimatedEndDate) {
                    estimatedEndDate = lastLogDate;
                }
            }

            // progress rate
            const plannedMinutes = s.productionTime || 0;
            const actualMinutes = totalSum;
            const progressRate = plannedMinutes > 0 ? Math.min(100, Math.floor((actualMinutes / plannedMinutes) * 100)) : 0;

            const userMap = new Map<string, { name: string, duration: number, overtime: number, employmentType: string | null }>()
            let fullTimeDuration = 0
            let fullTimeOvertime = 0
            let partTimeDuration = 0
            let partTimeOvertime = 0

            lotLogs.forEach((l: any) => {
                if (!l.user) return
                if (!userMap.has(l.user.id)) {
                    userMap.set(l.user.id, { name: l.user.name, duration: 0, overtime: 0, employmentType: l.user.employmentType })
                }
                const u = userMap.get(l.user.id)!
                u.duration += (l.duration || 0)
                u.overtime += (l.overtimeDuration || 0)

                if (l.user.employmentType === '正社員') {
                    fullTimeDuration += (l.duration || 0)
                    fullTimeOvertime += (l.overtimeDuration || 0)
                } else if (l.user.employmentType === 'パート') {
                    partTimeDuration += (l.duration || 0)
                    partTimeOvertime += (l.overtimeDuration || 0)
                }
            })

            const datesMap = new Map<string, { date: string, dailyDuration: number, dailyOvertime: number, logs: any[] }>()
            lotLogs.forEach((l: any) => {
                const d = getJSTDateString(l.date)
                if (!d) return
                if (!datesMap.has(d)) {
                    datesMap.set(d, { date: d, dailyDuration: 0, dailyOvertime: 0, logs: [] })
                }
                const dg = datesMap.get(d)!
                dg.dailyDuration += (l.duration || 0)
                dg.dailyOvertime += (l.overtimeDuration || 0)
                dg.logs.push(l)
            })

            // Flatten daily logs into worker-specific records for Gantt detail view
            const dates = Array.from(datesMap.values()).sort((a, b) => a.date.localeCompare(b.date));
            
            // Calculate when the time exceeded the plan
            let overrunDate = null;
            let cumTotal = 0;
            for (const d of dates) {
                cumTotal += (d.dailyDuration + d.dailyOvertime);
                if (plannedMinutes > 0 && cumTotal > plannedMinutes && !overrunDate) {
                    overrunDate = d.date;
                }
            }

            const dailyLogs = dates.flatMap(d => d.logs.map((log: any) => ({
                date: d.date,
                workerName: log.user?.name || '不明',
                normalMinutes: log.duration || 0,
                overtimeMinutes: log.overtimeDuration || 0
            })));

            return {
                id: s.id,
                lotNumber: s.lotNumber,
                productId: s.productId,
                productName: s.product?.name || s.manualProductName || '未設定',
                customerName: s.customerName,
                productionCount: s.productionCount,
                productionTime: plannedMinutes,
                plannedMinutes,
                actualMinutes,
                totalDuration: totalSum,
                totalRegular: totalRegular,
                totalOvertime: totalOvertime,
                fullTimeDuration: fullTimeDuration + fullTimeOvertime,
                fullTimeOvertime,
                partTimeDuration: partTimeDuration + partTimeOvertime,
                partTimeOvertime,
                remarks: s.remarks,
                deliveryDate: dueDateStr,
                dueDate: dueDateStr,
                department: s.department,
                status: s.isCompleted ? '完成' : (lotLogs.length > 0 ? '製作中' : '未着手'),
                isCompleted: s.isCompleted,
                startedAt: startedAtStr,
                startDate: startedAtStr,
                expectedCompletionDate: originalEstimatedEndDate,
                originalEstimatedEndDate: originalEstimatedEndDate,
                estimatedEndDate: estimatedEndDate,
                overrunDate: overrunDate,
                completedAt: s.completedAt ? getJSTDateString(s.completedAt) : null,
                users: Array.from(userMap.values()),
                dates,
                dailyLogs,
                progressRate
            }
        })

        return result.sort((a: any, b: any) => {
            if (a.isCompleted && !b.isCompleted) return 1
            if (!a.isCompleted && b.isCompleted) return -1
            const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
            const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
            return timeB - timeA || b.lotNumber.localeCompare(a.lotNumber)
        })
    } catch (error) {
        console.error('Lot summary failed:', error)
        return []
    }
}

export async function completeLot(id: string | null | undefined) {
    if (!id || typeof id !== 'string' || id.trim() === '') {
        console.error('Complete failed: ID is empty or invalid', id)
        return { success: false, error: '無効なIDです' }
    }
    try {
        await prisma.lotSummary.update({
            where: { id: id.trim() },
            data: {
                isCompleted: true,
                completedAt: new Date()
            }
        })
        revalidatePath('/lot-summary')
        revalidatePath('/completed-products')
        return { success: true }
    } catch (error: any) {
        console.error('Complete failed:', error)
        return { success: false, error: error.message || '完成処理に失敗しました' }
    }
}

export async function deleteLotSummary(id: string) {
    if (!id || typeof id !== 'string' || id.trim() === '') throw new Error('IDが指定されていません')
    try {
        await prisma.lotSummary.delete({
            where: { id }
        })
        revalidatePath('/lot-summary')
        revalidatePath('/completed-products')
        return { success: true }
    } catch (error: any) {
        console.error('Delete lot summary failed:', error)
        throw new Error(`製作記録の削除に失敗しました: ${error?.message || error}`)
    }
}

export async function getHolidays() {
    try {
        const holidays = await prisma.holiday.findMany();
        return holidays.map((h: any) => {
             const date = new Date(h.date);
             date.setUTCHours(date.getUTCHours() + 9);
             return date.toISOString().split('T')[0];
        });
    } catch {
        return [];
    }
}

export async function toggleHoliday(dateStr: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return { success: false, error: 'Invalid date format' };
    try {
        const dateObj = new Date(dateStr + 'T00:00:00Z');
        const existing = await prisma.holiday.findUnique({
            where: { date: dateObj }
        });
        if (existing) {
            await prisma.holiday.delete({ where: { id: existing.id } });
        } else {
            await prisma.holiday.create({ data: { date: dateObj } });
        }
        revalidatePath('/calendar');
        return { success: true };
    } catch (e: any) {
        console.error('toggleHoliday failed:', e);
        return { success: false, error: e.message };
    }
}
