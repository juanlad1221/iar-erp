import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const roles = await prisma.rol.findMany({
            orderBy: {
                rol: 'asc'
            }
        });

        const serializedRoles = roles.map((r) => ({
            id: r.id.toString(),
            rol: r.rol,
            created_at: r.created_at?.toISOString()
        }));

        return NextResponse.json(serializedRoles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        return NextResponse.json(
            { error: 'Error al obtener roles' },
            { status: 500 }
        );
    }
}
