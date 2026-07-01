-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "verificationToken" TEXT,
ALTER COLUMN "googleId" DROP NOT NULL;
