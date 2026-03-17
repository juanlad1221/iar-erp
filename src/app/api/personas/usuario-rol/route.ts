import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('Request body:', JSON.stringify(body, null, 2));
        
        const { 
            name, 
            lastName, 
            dni, 
            movil, 
            adress, 
            fecha_nacimiento,
            userName, 
            password, 
            active, 
            roles,
            id_curso
        } = body;

        if (!name || !lastName) {
            return NextResponse.json(
                { error: 'El nombre y apellido son requeridos' },
                { status: 400 }
            );
        }

        if (!userName || !password) {
            return NextResponse.json(
                { error: 'El usuario y contraseña son requeridos' },
                { status: 400 }
            );
        }

        if (!roles || roles.length === 0) {
            return NextResponse.json(
                { error: 'Debe seleccionar al menos un rol' },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { userName }
        });

        console.log('Existing user:', existingUser);

        if (existingUser) {
            return NextResponse.json(
                { error: 'El nombre de usuario ya existe' },
                { status: 400 }
            );
        }

        if (dni) {
            const existingDni = await prisma.data_personal.findFirst({
                where: { dni: String(dni) }
            });

            console.log('Existing DNI:', existingDni);

            if (existingDni) {
                return NextResponse.json(
                    { error: 'Ya existe una persona con este DNI' },
                    { status: 400 }
                );
            }
        }

        console.log('All validations passed, starting transaction');

        const result = await prisma.$transaction(async (tx: any) => {
            const dataPersonal = await tx.data_personal.create({
                data: {
                    name,
                    lastName,
                    dni: dni || null,
                    movil: movil || null,
                    adress: adress || null,
                    fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
                    active: true,
                },
            });

            const user = await tx.user.create({
                data: {
                    userName,
                    password,
                    active: active ?? true,
                    IdDataPersonal: dataPersonal.id
                },
                include: {
                    Data_personal: true,
                    Rol_usuario: {
                        include: {
                            Rol: true
                        }
                    }
                }
            });

            if (roles && roles.length > 0) {
                let idCurso: number | null = null;
                
                if (id_curso) {
                    console.log('Buscando curso para anio:', id_curso);
                    const curso = await tx.curso.findFirst({
                        where: { anio: parseInt(id_curso) }
                    });
                    console.log('Curso encontrado:', curso);
                    idCurso = curso ? Number(curso.id_curso) : null;
                }

                console.log('Insertando rol_usuario con idCurso:', idCurso);
                
                await tx.rol_usuario.createMany({
                    data: roles.map((roleId: string) => ({
                        idRol: BigInt(roleId),
                        idUser: user.id,
                        idCurso: idCurso
                    }))
                });
                console.log('Rol usuario insertado');
            }

            const userWithRoles = await tx.user.findUnique({
                where: { id: user.id },
                include: {
                    Data_personal: true,
                    Rol_usuario: {
                        include: {
                            Rol: true
                        }
                    }
                }
            });

            return userWithRoles;
        });

        const serializedResult = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serializedResult, { status: 201 });
    } catch (error: any) {
        console.error('Error creating persona with user and roles:', error);
        console.error('Error stack:', error.stack);
        const errorMessage = error.message || 'Error al crear la persona';
        return NextResponse.json(
            { error: errorMessage, details: String(error) },
            { status: 500 }
        );
    }
}
