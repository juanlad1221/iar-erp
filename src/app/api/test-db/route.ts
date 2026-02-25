import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const result: any[] = await prisma.$queryRaw`SELECT NOW() as now, version() as version;`;
        return NextResponse.json({
            success: true,
            data: result[0],
        });
    } catch (error: any) {
        console.error('Test DB Connection Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Error connecting to the database',
            },
            { status: 500 }
        );
    }
}
