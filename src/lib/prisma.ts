import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const prismaClientSingleton = () => {
    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = (() => {
    // In production, we definitely want the singleton
    if (process.env.NODE_ENV === 'production') {
        if (!globalThis.prisma) {
            globalThis.prisma = prismaClientSingleton();
        }
        return globalThis.prisma;
    }

    // In development, we'll try to use the cache BUT we'll force a reload
    // if we suspect the schema is out of date. 
    // Since we just added 'active' to Materia, let's just force it once or 
    // provide a cleaner way to reset.
    if (globalThis.prisma) {
        // If we are here, it means the server hot-reloaded. 
        // Let's just create a new one to be safe during this transition.
        return prismaClientSingleton();
    }

    return prismaClientSingleton();
})();

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
