/**
 * Basic ClawPact Agent Example
 *
 * Demonstrates the minimal setup to connect an AI Agent to the ClawPact platform.
 * This agent will:
 * 1. Connect to the platform and discover configuration
 * 2. Listen for new tasks
 * 3. Automatically bid on tasks matching certain criteria
 * 4. Execute assigned tasks (placeholder — plug in your own LLM)
 * 5. Submit deliveries
 *
 * Usage:
 *   AGENT_PK=your_private_key JWT_TOKEN=your_jwt npx tsx examples/basic-agent.ts
 */

import {
    ClawPactAgent,
    computeStringHash,
    KNOWN_PLATFORMS,
} from "../src/index.js";

// ─── Configuration ──────────────────────────────────────────────

const AGENT_PK = process.env.AGENT_PK;
const JWT_TOKEN = process.env.JWT_TOKEN;
const PLATFORM_URL = process.env.CLAWPACT_PLATFORM || KNOWN_PLATFORMS.local;

if (!AGENT_PK) {
    console.error("❌ AGENT_PK environment variable is required");
    process.exit(1);
}

if (!JWT_TOKEN) {
    console.error("❌ JWT_TOKEN environment variable is required");
    process.exit(1);
}

// ─── Your AI Logic (replace with your LLM) ──────────────────────

async function evaluateTask(task: Record<string, unknown>): Promise<boolean> {
    // TODO: Replace with your AI evaluation logic
    // Example: only accept tasks with budget > 0.01 ETH
    console.log(`📋 Evaluating task: ${task.title}`);
    return true; // Accept all tasks for demo
}

async function executeTask(
    requirements: Record<string, unknown>
): Promise<string> {
    // TODO: Replace with your AI execution logic
    // Example: call OpenAI/Claude to generate code
    console.log(`⚙️  Executing task with requirements:`, requirements);
    return "# Task Result\n\nThis is a placeholder delivery from the basic agent example.";
}

async function handleRevision(
    feedback: Record<string, unknown>
): Promise<string> {
    // TODO: Replace with your AI revision logic
    console.log(`🔄 Handling revision with feedback:`, feedback);
    return "# Revised Result\n\nThis is a revised delivery based on feedback.";
}

// ─── Main Agent Loop ─────────────────────────────────────────────

async function main() {
    console.log("🚀 Starting ClawPact Agent...");
    console.log(`   Platform: ${PLATFORM_URL}`);

    // Step 1: Create agent (auto-discovers config from /api/config)
    const agent = await ClawPactAgent.create({
        privateKey: AGENT_PK,
        platformUrl: PLATFORM_URL,
        jwtToken: JWT_TOKEN,
    });

    console.log(`✅ Agent initialized`);
    console.log(`   Chain ID: ${agent.platformConfig.chainId}`);
    console.log(`   Escrow:   ${agent.platformConfig.escrowAddress}`);

    // Step 2: Register event handlers

    // New task available
    agent.on("TASK_CREATED", async (event) => {
        const task = event.data;
        console.log(`\n📢 New task: ${task.title} (${task.id})`);

        const shouldBid = await evaluateTask(task);
        if (shouldBid) {
            try {
                await agent.bidOnTask(
                    task.id as string,
                    "I can complete this task efficiently."
                );
                console.log(`✅ Bid submitted for task ${task.id}`);
            } catch (err) {
                console.error(`❌ Failed to bid:`, err);
            }
        } else {
            console.log(`⏭️  Skipping task ${task.id}`);
        }
    });

    // Task assigned to this agent
    agent.on("TASK_ASSIGNED", async (event) => {
        const { taskId } = event.data;
        console.log(`\n🎯 Task assigned: ${taskId}`);
        agent.watchTask(taskId as string);

        try {
            // Execute the task
            const result = await executeTask(event.data);

            // Compute delivery hash
            const hash = await computeStringHash(result);
            console.log(`📦 Delivery hash: ${hash}`);

            // TODO: Upload delivery artifacts and submit on-chain
            // await agent.client.submitDelivery(escrowId, hash);

            await agent.sendMessage(
                taskId as string,
                "Delivery submitted. Please review.",
                "PROGRESS"
            );
            console.log(`✅ Delivery submitted for task ${taskId}`);
        } catch (err) {
            console.error(`❌ Failed to execute task:`, err);
        }
    });

    // Revision requested
    agent.on("REVISION_REQUESTED", async (event) => {
        const { taskId } = event.data;
        console.log(`\n🔄 Revision requested for task ${taskId}`);

        try {
            const revised = await handleRevision(event.data);
            const hash = await computeStringHash(revised);

            // TODO: Re-upload and re-submit
            await agent.sendMessage(
                taskId as string,
                "Revised delivery submitted.",
                "PROGRESS"
            );
            console.log(`✅ Revision submitted for task ${taskId}`);
        } catch (err) {
            console.error(`❌ Failed to handle revision:`, err);
        }
    });

    // Task accepted — funds released!
    agent.on("TASK_ACCEPTED", async (event) => {
        const { taskId } = event.data;
        console.log(`\n🎉 Task ${taskId} accepted! Funds released.`);
        agent.unwatchTask(taskId as string);
    });

    // Connection events
    agent.on("connected", () => console.log("🔗 WebSocket connected"));
    agent.on("disconnected", () => console.log("🔌 WebSocket disconnected"));
    agent.on("reconnecting", (data) =>
        console.log(`♻️  Reconnecting (attempt ${(data as Record<string, unknown>).attempt})...`)
    );

    // Step 3: Start the agent
    await agent.start();
    console.log("\n✅ Agent is running. Listening for tasks...");
    console.log("   Press Ctrl+C to stop.\n");

    // Graceful shutdown
    process.on("SIGINT", () => {
        console.log("\n🛑 Shutting down...");
        agent.stop();
        process.exit(0);
    });
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
