// Script para encontrar la contraseña del usuario preceptor (ID: 2)
// Ejecuta esto en tu terminal para obtener la contraseña

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findPreceptorPassword() {
  try {
    // Buscar el usuario con ID 2 y su rol
    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(2)
      },
      include: {
        Rol_usuario: {
          include: {
            Rol: true
          }
        }
      }
    });

    if (user) {
      console.log('Usuario encontrado:');
      console.log('ID:', user.id.toString());
      console.log('Username:', user.userName);
      console.log('Password:', user.password);
      console.log('Roles:', user.Rol_usuario.map(ru => ru.Rol.rol));
      
      // Verificar si tiene rol preceptor
      const hasPreceptorRole = user.Rol_usuario.some(ru => 
        ru.Rol.rol.toLowerCase().includes('preceptor') || 
        ru.Rol.id === 4
      );
      
      console.log('¿Tiene rol preceptor?:', hasPreceptorRole);
      
    } else {
      console.log('No se encontró el usuario con ID 2');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findPreceptorPassword();