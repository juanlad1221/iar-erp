const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const fs = require('fs');
const path = require('path');

// 1. Cargar .env manualmente para asegurar que DATABASE_URL esté disponible
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2 && !line.startsWith('#')) {
                    const key = parts[0].trim();
                    let value = parts.slice(1).join('=').trim();

                    // Quitar comillas dobles o simples si envuelven el valor
                    if ((value.startsWith('"') && value.endsWith('"')) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }

                    if (!process.env[key]) {
                        process.env[key] = value;
                    }
                }
            });
            console.log('Variables de entorno cargadas desde .env');
        }
    } catch (e) {
        console.error('Error leyendo .env:', e);
    }
}

loadEnv();

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('ERROR: DATABASE_URL no encontrada en process.env');
        process.exit(1);
    }

    // 2. Configurar Prisma con el adaptador (necesario porque schema no tiene url)
    console.log('Conectando a BD...');
    const pool = new pg.Pool({
        connectionString,
        ssl: { rejectUnauthorized: false } // Importante para Supabase/AWS en dev
    });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        // 3. Obtener el ID máximo
        console.log('Consultando ID máximo de Tutores...');
        const maxResult = await prisma.tutor.findFirst({
            orderBy: { id_tutor: 'desc' },
            select: { id_tutor: true }
        });

        const maxId = maxResult ? maxResult.id_tutor : 0;
        console.log('ID máximo actual en tabla Tutores:', maxId);

        // 4. Resetear la secuencia
        const nextId = maxId + 1;
        // Nombre de secuencia inferido: Tutores_id_tutor_seq. 
        // Usamos pg_get_serial_sequence para mayor seguridad.
        const query = `SELECT setval(pg_get_serial_sequence('"Tutores"', 'id_tutor'), ${nextId}, false);`;

        console.log(`Ejecutando ajuste de secuencia a ${nextId}...`);
        await prisma.$executeRawUnsafe(query);

        console.log('¡ÉXITO! Secuencia reparada.');

    } catch (e) {
        console.error('Error durante la ejecución:', e);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
