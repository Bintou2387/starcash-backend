-- CreateTable
CREATE TABLE "WithdrawalCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WithdrawalCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawalCode_code_key" ON "WithdrawalCode"("code");

-- AddForeignKey
ALTER TABLE "WithdrawalCode" ADD CONSTRAINT "WithdrawalCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
