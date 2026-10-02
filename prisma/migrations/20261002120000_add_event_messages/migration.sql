-- CreateTable
CREATE TABLE "EventMessage" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "standNumber" TEXT,
    "attendingDates" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventMessage_eventId_idx" ON "EventMessage"("eventId");

-- CreateIndex
CREATE INDEX "EventMessage_authorId_idx" ON "EventMessage"("authorId");

-- CreateIndex
CREATE INDEX "EventMessage_parentId_idx" ON "EventMessage"("parentId");

-- AddForeignKey
ALTER TABLE "EventMessage" ADD CONSTRAINT "EventMessage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMessage" ADD CONSTRAINT "EventMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMessage" ADD CONSTRAINT "EventMessage_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "EventMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Only the server (service role) reads and writes messages; block direct anon/authenticated access
ALTER TABLE "EventMessage" ENABLE ROW LEVEL SECURITY;
