import { PrismaClient } from "@prisma/client";
import prismaRandom from "prisma-extension-random";
// export const db = new PrismaClient()
export const db = new PrismaClient().$extends(prismaRandom());
