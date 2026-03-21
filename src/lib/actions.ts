'use server'

import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'

export async function createWorkLog(formData: FormData) {
    const content = formData.get('content') as string
    if (!content) return

    try {
        await prisma.workLog.create({
            data: { content }
        })
        revalidatePath('/')
    } catch (error) {
        console.error('Failed to create log:', error)
    }
}

export async function deleteWorkLog(id: string) {
    try {
        await prisma.workLog.delete({
            where: { id }
        })
        revalidatePath('/')
    } catch (error) {
        console.error('Failed to delete log:', error)
    }
}