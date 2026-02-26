import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('API /tutores/assign received body:', body);
        const { tutorId, studentIds } = body;

        if (!tutorId || !Array.isArray(studentIds)) {
            console.error('Invalid data in /tutores/assign:', { tutorId, studentIds });
            return NextResponse.json(
                { error: 'Invalid data' },
                { status: 400 }
            );
        }

        // Use a transaction to update relationships safely
        await prisma.$transaction(async (tx: any) => {
            console.log(`Starting transaction for tutorId: ${tutorId}`);

            // 1. Remove all existing assignments for this tutor
            // @ts-ignore
            const deleted = await tx.alumno_Tutor.deleteMany({
                where: {
                    id_tutor: Number(tutorId)
                }
            });
            console.log(`Deleted ${deleted.count} existing assignments.`);

            // 2. Create new assignments
            if (studentIds.length > 0) {
                console.log(`Creating ${studentIds.length} new assignments for students:`, studentIds);
                // @ts-ignore
                const created = await tx.alumno_Tutor.createMany({
                    data: studentIds.map((studentId: number) => ({
                        id_tutor: Number(tutorId),
                        id_alumno: Number(studentId)
                    }))
                });
                console.log(`Created ${created.count} assignments.`);
            } else {
                console.log('No new students to assign.');
            }
        });

        console.log('Transaction completed successfully.');
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error assigning students:', error);
        return NextResponse.json(
            { error: 'Error al actualizar asignaciones', details: error.message },
            { status: 500 }
        );
    }
}
