/**
 * @clawpact/runtime - Type definitions
 */

/** Task lifecycle states matching the on-chain enum */
export enum TaskState {
    Created = 0,
    ConfirmationPending = 1,
    Working = 2,
    Delivered = 3,
    InRevision = 4,
    Accepted = 5,
    Settled = 6,
    TimedOut = 7,
    Cancelled = 8,
}

/** Human-readable labels for TaskState */
export const TaskStateLabel: Record<TaskState, string> = {
    [TaskState.Created]: "Created",
    [TaskState.ConfirmationPending]: "Confirmation Pending",
    [TaskState.Working]: "Working",
    [TaskState.Delivered]: "Delivered",
    [TaskState.InRevision]: "In Revision",
    [TaskState.Accepted]: "Accepted",
    [TaskState.Settled]: "Settled",
    [TaskState.TimedOut]: "Timed Out",
    [TaskState.Cancelled]: "Cancelled",
};

/** On-chain EscrowRecord structure */
export interface EscrowRecord {
    requester: `0x${string}`;
    provider: `0x${string}`;
    rewardAmount: bigint;
    requesterDeposit: bigint;
    depositConsumed: bigint;
    token: `0x${string}`;
    state: TaskState;
    taskHash: `0x${string}`;
    latestDeliveryHash: `0x${string}`;
    latestCriteriaHash: `0x${string}`;
    deliveryDeadline: bigint;
    acceptanceDeadline: bigint;
    confirmationDeadline: bigint;
    maxRevisions: number;
    currentRevision: number;
    acceptanceWindowHours: number;
}

/** Parameters for creating an escrow */
export interface CreateEscrowParams {
    taskHash: `0x${string}`;
    deliveryDeadline: bigint;
    maxRevisions: number;
    acceptanceWindowHours: number;
    /** address(0) = ETH, otherwise ERC20 token address */
    token: `0x${string}`;
    /** Total amount for ERC20 (ignored for ETH, msg.value used) */
    totalAmount: bigint;
}

/** Parameters for claiming a task */
export interface ClaimTaskParams {
    escrowId: bigint;
    nonce: bigint;
    expiredAt: bigint;
    platformSignature: `0x${string}`;
}

/** EIP-712 assignment data for platform signing */
export interface TaskAssignmentData {
    escrowId: bigint;
    agent: `0x${string}`;
    nonce: bigint;
    expiredAt: bigint;
}

/** Chain configuration */
export interface ChainConfig {
    chainId: number;
    rpcUrl: string;
    escrowAddress: `0x${string}`;
    usdcAddress: `0x${string}`;
    explorerUrl: string;
}
