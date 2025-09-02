-- CreateTable
CREATE TABLE "public"."MainRoleTitleCfg" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MainRoleTitleCfg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectStateKind" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "orderNo" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectStateKind_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskStateKind" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "orderNo" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskStateKind_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PriorityLevelCfg" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "orderNo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriorityLevelCfg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ImpedimentStatusCfg" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "orderNo" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImpedimentStatusCfg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permission" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolePermission" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Echelon" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "orderLevel" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Echelon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" SERIAL NOT NULL,
    "isMainRole" BOOLEAN NOT NULL DEFAULT false,
    "mainRoleTitleId" INTEGER,
    "parentRoleId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "echelonId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "forename" TEXT,
    "surname" TEXT,
    "username" TEXT,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserRole" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tag" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectState" (
    "id" TEXT NOT NULL,
    "kindId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL,
    "orderNo" INTEGER NOT NULL,
    "isInitial" BOOLEAN NOT NULL DEFAULT false,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskState" (
    "id" TEXT NOT NULL,
    "kindId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL,
    "orderNo" INTEGER NOT NULL,
    "isInitial" BOOLEAN NOT NULL DEFAULT false,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Priority" (
    "id" TEXT NOT NULL,
    "kindId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "orderNo" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Priority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Deadline" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "priorityId" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeadlineTag" (
    "id" SERIAL NOT NULL,
    "deadlineId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeadlineTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Solution" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "link" TEXT,
    "authorId" INTEGER,
    "category" TEXT,
    "effectiveness" DOUBLE PRECISION DEFAULT 0.0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Impediment" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "statusId" INTEGER NOT NULL,
    "estimatedHours" INTEGER,
    "actualHours" INTEGER,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "solutionId" INTEGER,
    "assigneeId" INTEGER,
    "taskId" TEXT,
    "similarityScore" DOUBLE PRECISION,
    "mergedIntoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Impediment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ImpedimentMedian" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "hasSolution" BOOLEAN NOT NULL DEFAULT false,
    "solutionId" INTEGER,
    "averageHours" DOUBLE PRECISION,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "confidenceScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImpedimentMedian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "taskStateId" TEXT NOT NULL,
    "priorityId" TEXT,
    "activeUserId" INTEGER,
    "estimatedHours" INTEGER,
    "actualHours" INTEGER,
    "hasSegmentGroupCircle" BOOLEAN NOT NULL DEFAULT false,
    "segmentGroupCircleId" INTEGER,
    "projectId" TEXT,
    "parentTaskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "iterationSegmentId" INTEGER,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserTask" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "taskId" TEXT NOT NULL,
    "role" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskTag" (
    "id" SERIAL NOT NULL,
    "taskId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IterationSegment" (
    "id" SERIAL NOT NULL,
    "segmentNo" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startSchedule" TIMESTAMP(3),
    "endSchedule" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "dropDate" TIMESTAMP(3),
    "actualStartDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "iterationCount" INTEGER NOT NULL DEFAULT 1,
    "completedIterations" INTEGER NOT NULL DEFAULT 0,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "estimatedCost" MONEY,
    "actualCost" MONEY,
    "estimatedHours" INTEGER,
    "actualHours" INTEGER,
    "segmentGroupCircleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IterationSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SegmentGroupCircle" (
    "id" SERIAL NOT NULL,
    "orderNo" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isProjectManagementCircle" BOOLEAN NOT NULL DEFAULT false,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "isFirst" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "maxIterations" INTEGER NOT NULL DEFAULT 1,
    "currentIteration" INTEGER NOT NULL DEFAULT 1,
    "parentCircleId" INTEGER,
    "estimatedDuration" INTEGER,
    "actualDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SegmentGroupCircle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "currentIterationNumber" INTEGER NOT NULL DEFAULT 1,
    "iterationWarnAt" INTEGER NOT NULL DEFAULT 3,
    "maxIterations" INTEGER,
    "currentSegmentId" INTEGER,
    "projectStateId" TEXT NOT NULL,
    "activeUserId" INTEGER,
    "estimatedBudget" MONEY,
    "actualCost" MONEY,
    "estimatedHours" INTEGER,
    "actualHours" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "actualStartDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "priority" TEXT,
    "riskLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectCreator" (
    "id" SERIAL NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectCreator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectCircle" (
    "id" SERIAL NOT NULL,
    "projectId" TEXT NOT NULL,
    "circleId" INTEGER NOT NULL,
    "orderNo" INTEGER NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectCircle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectTag" (
    "id" SERIAL NOT NULL,
    "projectId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SegmentStakeholder" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "iterationSegmentId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SegmentStakeholder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SegmentResponsible" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "iterationSegmentId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SegmentResponsible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SegmentAttendee" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "iterationSegmentId" INTEGER NOT NULL,

    CONSTRAINT "SegmentAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SegmentContributor" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "iterationSegmentId" INTEGER NOT NULL,

    CONSTRAINT "SegmentContributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ip" TEXT,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MainRoleTitleCfg_key_key" ON "public"."MainRoleTitleCfg"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectStateKind_key_key" ON "public"."ProjectStateKind"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectStateKind_orderNo_key" ON "public"."ProjectStateKind"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "TaskStateKind_key_key" ON "public"."TaskStateKind"("key");

-- CreateIndex
CREATE UNIQUE INDEX "TaskStateKind_orderNo_key" ON "public"."TaskStateKind"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "PriorityLevelCfg_key_key" ON "public"."PriorityLevelCfg"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PriorityLevelCfg_orderNo_key" ON "public"."PriorityLevelCfg"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "ImpedimentStatusCfg_key_key" ON "public"."ImpedimentStatusCfg"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ImpedimentStatusCfg_orderNo_key" ON "public"."ImpedimentStatusCfg"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "public"."Permission"("name");

-- CreateIndex
CREATE INDEX "Permission_category_idx" ON "public"."Permission"("category");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "public"."RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "public"."RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "public"."RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Echelon_title_key" ON "public"."Echelon"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Echelon_orderLevel_key" ON "public"."Echelon"("orderLevel");

-- CreateIndex
CREATE INDEX "Echelon_orderLevel_idx" ON "public"."Echelon"("orderLevel");

-- CreateIndex
CREATE INDEX "Role_isMainRole_idx" ON "public"."Role"("isMainRole");

-- CreateIndex
CREATE INDEX "Role_mainRoleTitleId_idx" ON "public"."Role"("mainRoleTitleId");

-- CreateIndex
CREATE INDEX "Role_echelonId_idx" ON "public"."Role"("echelonId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "public"."User"("isActive");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "public"."UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "public"."UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "public"."UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_title_key" ON "public"."Tag"("title");

-- CreateIndex
CREATE INDEX "Tag_title_idx" ON "public"."Tag"("title");

-- CreateIndex
CREATE INDEX "ProjectState_kindId_idx" ON "public"."ProjectState"("kindId");

-- CreateIndex
CREATE INDEX "ProjectState_orderNo_idx" ON "public"."ProjectState"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectState_orderNo_key" ON "public"."ProjectState"("orderNo");

-- CreateIndex
CREATE INDEX "TaskState_kindId_idx" ON "public"."TaskState"("kindId");

-- CreateIndex
CREATE INDEX "TaskState_orderNo_idx" ON "public"."TaskState"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "TaskState_orderNo_key" ON "public"."TaskState"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "Priority_orderNo_key" ON "public"."Priority"("orderNo");

-- CreateIndex
CREATE INDEX "Priority_orderNo_idx" ON "public"."Priority"("orderNo");

-- CreateIndex
CREATE INDEX "Priority_kindId_idx" ON "public"."Priority"("kindId");

-- CreateIndex
CREATE INDEX "Deadline_dueDate_idx" ON "public"."Deadline"("dueDate");

-- CreateIndex
CREATE INDEX "Deadline_priorityId_idx" ON "public"."Deadline"("priorityId");

-- CreateIndex
CREATE INDEX "Deadline_projectId_idx" ON "public"."Deadline"("projectId");

-- CreateIndex
CREATE INDEX "DeadlineTag_deadlineId_idx" ON "public"."DeadlineTag"("deadlineId");

-- CreateIndex
CREATE INDEX "DeadlineTag_tagId_idx" ON "public"."DeadlineTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "DeadlineTag_deadlineId_tagId_key" ON "public"."DeadlineTag"("deadlineId", "tagId");

-- CreateIndex
CREATE INDEX "Solution_category_idx" ON "public"."Solution"("category");

-- CreateIndex
CREATE INDEX "Solution_effectiveness_idx" ON "public"."Solution"("effectiveness");

-- CreateIndex
CREATE INDEX "Impediment_statusId_idx" ON "public"."Impediment"("statusId");

-- CreateIndex
CREATE INDEX "Impediment_assigneeId_idx" ON "public"."Impediment"("assigneeId");

-- CreateIndex
CREATE INDEX "Impediment_taskId_idx" ON "public"."Impediment"("taskId");

-- CreateIndex
CREATE INDEX "Impediment_mergedIntoId_idx" ON "public"."Impediment"("mergedIntoId");

-- CreateIndex
CREATE INDEX "ImpedimentMedian_hasSolution_idx" ON "public"."ImpedimentMedian"("hasSolution");

-- CreateIndex
CREATE INDEX "ImpedimentMedian_occurrenceCount_idx" ON "public"."ImpedimentMedian"("occurrenceCount");

-- CreateIndex
CREATE INDEX "Task_taskStateId_idx" ON "public"."Task"("taskStateId");

-- CreateIndex
CREATE INDEX "Task_activeUserId_idx" ON "public"."Task"("activeUserId");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "public"."Task"("projectId");

-- CreateIndex
CREATE INDEX "Task_parentTaskId_idx" ON "public"."Task"("parentTaskId");

-- CreateIndex
CREATE INDEX "Task_isDone_idx" ON "public"."Task"("isDone");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "public"."Task"("dueDate");

-- CreateIndex
CREATE INDEX "UserTask_userId_idx" ON "public"."UserTask"("userId");

-- CreateIndex
CREATE INDEX "UserTask_taskId_idx" ON "public"."UserTask"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTask_userId_taskId_key" ON "public"."UserTask"("userId", "taskId");

-- CreateIndex
CREATE INDEX "TaskTag_taskId_idx" ON "public"."TaskTag"("taskId");

-- CreateIndex
CREATE INDEX "TaskTag_tagId_idx" ON "public"."TaskTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskTag_taskId_tagId_key" ON "public"."TaskTag"("taskId", "tagId");

-- CreateIndex
CREATE INDEX "IterationSegment_segmentGroupCircleId_idx" ON "public"."IterationSegment"("segmentGroupCircleId");

-- CreateIndex
CREATE INDEX "IterationSegment_segmentNo_idx" ON "public"."IterationSegment"("segmentNo");

-- CreateIndex
CREATE INDEX "IterationSegment_isComplete_idx" ON "public"."IterationSegment"("isComplete");

-- CreateIndex
CREATE INDEX "IterationSegment_dueDate_idx" ON "public"."IterationSegment"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "IterationSegment_segmentGroupCircleId_segmentNo_key" ON "public"."IterationSegment"("segmentGroupCircleId", "segmentNo");

-- CreateIndex
CREATE INDEX "SegmentGroupCircle_orderNo_idx" ON "public"."SegmentGroupCircle"("orderNo");

-- CreateIndex
CREATE INDEX "SegmentGroupCircle_isProjectManagementCircle_idx" ON "public"."SegmentGroupCircle"("isProjectManagementCircle");

-- CreateIndex
CREATE INDEX "SegmentGroupCircle_isInternal_idx" ON "public"."SegmentGroupCircle"("isInternal");

-- CreateIndex
CREATE INDEX "SegmentGroupCircle_isFirst_idx" ON "public"."SegmentGroupCircle"("isFirst");

-- CreateIndex
CREATE INDEX "SegmentGroupCircle_isActive_idx" ON "public"."SegmentGroupCircle"("isActive");

-- CreateIndex
CREATE INDEX "SegmentGroupCircle_parentCircleId_idx" ON "public"."SegmentGroupCircle"("parentCircleId");

-- CreateIndex
CREATE INDEX "Project_projectStateId_idx" ON "public"."Project"("projectStateId");

-- CreateIndex
CREATE INDEX "Project_activeUserId_idx" ON "public"."Project"("activeUserId");

-- CreateIndex
CREATE INDEX "Project_isDone_idx" ON "public"."Project"("isDone");

-- CreateIndex
CREATE INDEX "Project_currentIterationNumber_idx" ON "public"."Project"("currentIterationNumber");

-- CreateIndex
CREATE INDEX "Project_startDate_idx" ON "public"."Project"("startDate");

-- CreateIndex
CREATE INDEX "Project_endDate_idx" ON "public"."Project"("endDate");

-- CreateIndex
CREATE INDEX "ProjectCreator_projectId_idx" ON "public"."ProjectCreator"("projectId");

-- CreateIndex
CREATE INDEX "ProjectCreator_userId_idx" ON "public"."ProjectCreator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCreator_projectId_userId_key" ON "public"."ProjectCreator"("projectId", "userId");

-- CreateIndex
CREATE INDEX "ProjectCircle_projectId_idx" ON "public"."ProjectCircle"("projectId");

-- CreateIndex
CREATE INDEX "ProjectCircle_circleId_idx" ON "public"."ProjectCircle"("circleId");

-- CreateIndex
CREATE INDEX "ProjectCircle_isCurrent_idx" ON "public"."ProjectCircle"("isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCircle_projectId_circleId_key" ON "public"."ProjectCircle"("projectId", "circleId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCircle_projectId_orderNo_key" ON "public"."ProjectCircle"("projectId", "orderNo");

-- CreateIndex
CREATE INDEX "ProjectTag_projectId_idx" ON "public"."ProjectTag"("projectId");

-- CreateIndex
CREATE INDEX "ProjectTag_tagId_idx" ON "public"."ProjectTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTag_projectId_tagId_key" ON "public"."ProjectTag"("projectId", "tagId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_tableName_idx" ON "public"."AuditLog"("tableName");

-- CreateIndex
CREATE INDEX "AuditLog_recordId_idx" ON "public"."AuditLog"("recordId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "public"."AuditLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "public"."SystemSetting"("key");

-- CreateIndex
CREATE INDEX "SystemSetting_category_idx" ON "public"."SystemSetting"("category");

-- CreateIndex
CREATE INDEX "SystemSetting_isPublic_idx" ON "public"."SystemSetting"("isPublic");

-- CreateIndex
CREATE INDEX "SegmentStakeholder_userId_idx" ON "public"."SegmentStakeholder"("userId");

-- CreateIndex
CREATE INDEX "SegmentStakeholder_iterationSegmentId_idx" ON "public"."SegmentStakeholder"("iterationSegmentId");

-- CreateIndex
CREATE UNIQUE INDEX "SegmentStakeholder_userId_iterationSegmentId_key" ON "public"."SegmentStakeholder"("userId", "iterationSegmentId");

-- CreateIndex
CREATE INDEX "SegmentResponsible_userId_idx" ON "public"."SegmentResponsible"("userId");

-- CreateIndex
CREATE INDEX "SegmentResponsible_iterationSegmentId_idx" ON "public"."SegmentResponsible"("iterationSegmentId");

-- CreateIndex
CREATE UNIQUE INDEX "SegmentResponsible_userId_iterationSegmentId_key" ON "public"."SegmentResponsible"("userId", "iterationSegmentId");

-- CreateIndex
CREATE INDEX "SegmentAttendee_userId_idx" ON "public"."SegmentAttendee"("userId");

-- CreateIndex
CREATE INDEX "SegmentAttendee_iterationSegmentId_idx" ON "public"."SegmentAttendee"("iterationSegmentId");

-- CreateIndex
CREATE UNIQUE INDEX "SegmentAttendee_userId_iterationSegmentId_key" ON "public"."SegmentAttendee"("userId", "iterationSegmentId");

-- CreateIndex
CREATE INDEX "SegmentContributor_userId_idx" ON "public"."SegmentContributor"("userId");

-- CreateIndex
CREATE INDEX "SegmentContributor_iterationSegmentId_idx" ON "public"."SegmentContributor"("iterationSegmentId");

-- CreateIndex
CREATE UNIQUE INDEX "SegmentContributor_userId_iterationSegmentId_key" ON "public"."SegmentContributor"("userId", "iterationSegmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "public"."Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "public"."Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_tokenHash_key" ON "public"."VerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "VerificationToken_userId_idx" ON "public"."VerificationToken"("userId");

-- CreateIndex
CREATE INDEX "VerificationToken_expiresAt_idx" ON "public"."VerificationToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "public"."PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "public"."PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "public"."PasswordResetToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Role" ADD CONSTRAINT "Role_mainRoleTitleId_fkey" FOREIGN KEY ("mainRoleTitleId") REFERENCES "public"."MainRoleTitleCfg"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Role" ADD CONSTRAINT "Role_parentRoleId_fkey" FOREIGN KEY ("parentRoleId") REFERENCES "public"."Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Role" ADD CONSTRAINT "Role_echelonId_fkey" FOREIGN KEY ("echelonId") REFERENCES "public"."Echelon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectState" ADD CONSTRAINT "ProjectState_kindId_fkey" FOREIGN KEY ("kindId") REFERENCES "public"."ProjectStateKind"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskState" ADD CONSTRAINT "TaskState_kindId_fkey" FOREIGN KEY ("kindId") REFERENCES "public"."TaskStateKind"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Priority" ADD CONSTRAINT "Priority_kindId_fkey" FOREIGN KEY ("kindId") REFERENCES "public"."PriorityLevelCfg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Deadline" ADD CONSTRAINT "Deadline_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "public"."Priority"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Deadline" ADD CONSTRAINT "Deadline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeadlineTag" ADD CONSTRAINT "DeadlineTag_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "public"."Deadline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeadlineTag" ADD CONSTRAINT "DeadlineTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Solution" ADD CONSTRAINT "Solution_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Impediment" ADD CONSTRAINT "Impediment_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."ImpedimentStatusCfg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Impediment" ADD CONSTRAINT "Impediment_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "public"."Solution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Impediment" ADD CONSTRAINT "Impediment_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Impediment" ADD CONSTRAINT "Impediment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Impediment" ADD CONSTRAINT "Impediment_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "public"."ImpedimentMedian"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ImpedimentMedian" ADD CONSTRAINT "ImpedimentMedian_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "public"."Solution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_taskStateId_fkey" FOREIGN KEY ("taskStateId") REFERENCES "public"."TaskState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "public"."Priority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_activeUserId_fkey" FOREIGN KEY ("activeUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_segmentGroupCircleId_fkey" FOREIGN KEY ("segmentGroupCircleId") REFERENCES "public"."SegmentGroupCircle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "public"."Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_iterationSegmentId_fkey" FOREIGN KEY ("iterationSegmentId") REFERENCES "public"."IterationSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserTask" ADD CONSTRAINT "UserTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserTask" ADD CONSTRAINT "UserTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskTag" ADD CONSTRAINT "TaskTag_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskTag" ADD CONSTRAINT "TaskTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IterationSegment" ADD CONSTRAINT "IterationSegment_segmentGroupCircleId_fkey" FOREIGN KEY ("segmentGroupCircleId") REFERENCES "public"."SegmentGroupCircle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SegmentGroupCircle" ADD CONSTRAINT "SegmentGroupCircle_parentCircleId_fkey" FOREIGN KEY ("parentCircleId") REFERENCES "public"."SegmentGroupCircle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_currentSegmentId_fkey" FOREIGN KEY ("currentSegmentId") REFERENCES "public"."IterationSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_projectStateId_fkey" FOREIGN KEY ("projectStateId") REFERENCES "public"."ProjectState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_activeUserId_fkey" FOREIGN KEY ("activeUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectCreator" ADD CONSTRAINT "ProjectCreator_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectCreator" ADD CONSTRAINT "ProjectCreator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectCircle" ADD CONSTRAINT "ProjectCircle_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectCircle" ADD CONSTRAINT "ProjectCircle_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "public"."SegmentGroupCircle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectTag" ADD CONSTRAINT "ProjectTag_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectTag" ADD CONSTRAINT "ProjectTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SegmentStakeholder" ADD CONSTRAINT "SegmentStakeholder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SegmentStakeholder" ADD CONSTRAINT "SegmentStakeholder_iterationSegmentId_fkey" FOREIGN KEY ("iterationSegmentId") REFERENCES "public"."IterationSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SegmentResponsible" ADD CONSTRAINT "SegmentResponsible_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SegmentResponsible" ADD CONSTRAINT "SegmentResponsible_iterationSegmentId_fkey" FOREIGN KEY ("iterationSegmentId") REFERENCES "public"."IterationSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SegmentAttendee" ADD CONSTRAINT "SegmentAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SegmentAttendee" ADD CONSTRAINT "SegmentAttendee_iterationSegmentId_fkey" FOREIGN KEY ("iterationSegmentId") REFERENCES "public"."IterationSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SegmentContributor" ADD CONSTRAINT "SegmentContributor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SegmentContributor" ADD CONSTRAINT "SegmentContributor_iterationSegmentId_fkey" FOREIGN KEY ("iterationSegmentId") REFERENCES "public"."IterationSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
