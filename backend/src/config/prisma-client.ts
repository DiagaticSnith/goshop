import { PrismaClient } from "@prisma/client";

declare const global: {
    prisma: PrismaClient | undefined;
};

let prisma: PrismaClient;
if (process.env.NODE_ENV === "prod") {
    prisma = new PrismaClient({
        errorFormat: "minimal"
    });
} else {
    // If a test or other code injected a fake `global.prisma`, ensure it looks like a PrismaClient.
    const isValidPrisma = (g: any) => {
        try {
            if (!g) return false;
            if (g.__isMock === true) return true;
            return (typeof g.$connect === 'function' || typeof g.$queryRaw === 'function') && typeof (g.product ?? {}).deleteMany === 'function';
        } catch (e) {
            return false;
        }
    };
    if (!global.prisma || !isValidPrisma(global.prisma)) {
        global.prisma = new PrismaClient({
            errorFormat: "minimal"
        });
    }
    prisma = global.prisma;
}

export default prisma;