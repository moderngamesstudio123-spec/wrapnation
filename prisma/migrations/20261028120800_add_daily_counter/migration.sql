-- CreateTable
CREATE TABLE "DailyCounter" (
    "date" TEXT NOT NULL,
    "last" INTEGER NOT NULL DEFAULT 100,
    "takeaway" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyCounter_pkey" PRIMARY KEY ("date")
);
