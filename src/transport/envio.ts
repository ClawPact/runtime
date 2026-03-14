import type { PlatformConfig, TaskChainProjection, TaskListItem } from "../types.js";

export interface EnvioTaskProjection {
    taskId: string;
    escrowId?: string | null;
    taskHash?: string | null;
    requester?: string | null;
    provider?: string | null;
    token?: string | null;
    rewardAmount?: string | null;
    requesterDeposit?: string | null;
    providerPayout?: string | null;
    platformFee?: string | null;
    requesterRefund?: string | null;
    compensation?: string | null;
    status: string;
    currentRevision?: number | null;
    maxRevisions?: number | null;
    acceptanceWindowHours?: number | null;
    criteriaCount?: number | null;
    declineCount?: number | null;
    passRate?: number | null;
    confirmationDeadline?: string | null;
    deliveryDeadline?: string | null;
    acceptanceDeadline?: string | null;
    lastEventName?: string | null;
    lastUpdatedBlock?: string | null;
    lastUpdatedAt?: string | null;
}

export interface QueryEnvioTasksOptions {
    status?: string;
    limit?: number;
    offset?: number;
}

function mapProjectionToTaskItem(projection: EnvioTaskProjection): TaskListItem {
    const chainProjection: TaskChainProjection = {
        escrowId: projection.escrowId ?? null,
        taskHash: projection.taskHash ?? null,
        requester: projection.requester ?? null,
        provider: projection.provider ?? null,
        token: projection.token ?? null,
        rewardAmount: projection.rewardAmount ?? null,
        requesterDeposit: projection.requesterDeposit ?? null,
        providerPayout: projection.providerPayout ?? null,
        platformFee: projection.platformFee ?? null,
        requesterRefund: projection.requesterRefund ?? null,
        compensation: projection.compensation ?? null,
        currentRevision: projection.currentRevision ?? null,
        maxRevisions: projection.maxRevisions ?? null,
        acceptanceWindowHours: projection.acceptanceWindowHours ?? null,
        criteriaCount: projection.criteriaCount ?? null,
        declineCount: projection.declineCount ?? null,
        passRate: projection.passRate ?? null,
        confirmationDeadline: projection.confirmationDeadline ?? null,
        deliveryDeadline: projection.deliveryDeadline ?? null,
        acceptanceDeadline: projection.acceptanceDeadline ?? null,
        lastEventName: projection.lastEventName ?? null,
        lastUpdatedBlock: projection.lastUpdatedBlock ?? null,
        lastUpdatedAt: projection.lastUpdatedAt ?? null,
    };

    return {
        id: projection.taskId,
        escrowId: projection.escrowId ?? null,
        taskHash: projection.taskHash ?? null,
        rewardAmount: projection.rewardAmount ?? undefined,
        status: projection.status,
        chainProjection,
        chainProjectionSource: "envio",
    };
}

function normalizeStatusFilter(status?: string) {
    const normalized = status?.toUpperCase();
    if (!normalized) return "CREATED";
    if (normalized === "OPEN") return "CREATED";
    return normalized;
}

function buildTaskProjectionQuery(status: string, limit: number, offset: number) {
    return {
        query: `
            query TaskProjections($status: String!, $limit: Int!, $offset: Int!) {
              taskProjections(
                where: { status: $status }
                orderBy: "lastUpdatedAt_DESC"
                limit: $limit
                offset: $offset
              ) {
                taskId
                escrowId
                taskHash
                requester
                provider
                token
                rewardAmount
                requesterDeposit
                providerPayout
                platformFee
                requesterRefund
                compensation
                status
                currentRevision
                maxRevisions
                acceptanceWindowHours
                criteriaCount
                declineCount
                passRate
                confirmationDeadline
                deliveryDeadline
                acceptanceDeadline
                lastEventName
                lastUpdatedBlock
                lastUpdatedAt
              }
            }
        `,
        variables: {
            status,
            limit,
            offset,
        },
    };
}

export async function queryAvailableTasksFromEnvio(
    config: PlatformConfig,
    options: QueryEnvioTasksOptions = {}
): Promise<TaskListItem[]> {
    if (!config.envioUrl) {
        throw new Error("Envio URL is not configured");
    }

    const status = normalizeStatusFilter(options.status);
    const limit = Math.max(1, Math.min(options.limit ?? 20, 100));
    const offset = Math.max(0, options.offset ?? 0);

    const response = await fetch(config.envioUrl, {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(buildTaskProjectionQuery(status, limit, offset)),
    });

    if (!response.ok) {
        throw new Error(`Envio query failed: ${response.status} ${response.statusText}`);
    }

    const body = (await response.json()) as {
        data?: { taskProjections?: EnvioTaskProjection[] };
        errors?: Array<{ message?: string }>;
    };

    if (body.errors?.length) {
        throw new Error(body.errors.map((item) => item.message || "Unknown GraphQL error").join("; "));
    }

    return (body.data?.taskProjections ?? []).map(mapProjectionToTaskItem);
}
