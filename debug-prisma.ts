
import prisma from './src/lib/prisma';

async function main() {
    console.log('Prisma Models:', Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_')));
}

main();
