import {
    CHAIN_ID,
    DEFAULT_PLATFORM_URL,
    DEFAULT_RPC_URL,
    ESCROW_ADDRESS,
    EXPLORER_URL,
    MIN_PASS_RATE,
    PLATFORM_FEE_BPS,
    TIPJAR_ADDRESS,
    USDC_ADDRESS,
} from "./constants.js";
import type { PlatformConfig } from "./types.js";

function deriveWsUrl(baseUrl: string) {
    const normalized = baseUrl.replace(/\/$/, "");
    return normalized.startsWith("http://")
        ? `${normalized.replace("http://", "ws://")}/ws`
        : `${normalized.replace("https://", "wss://")}/ws`;
}

export async function fetchPlatformConfig(
    platformUrl = DEFAULT_PLATFORM_URL
): Promise<PlatformConfig> {
    const baseUrl = platformUrl.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/api/config`);

    if (!response.ok) {
        throw new Error(
            `Platform config request failed: ${response.status} ${response.statusText}`
        );
    }

    const remote = (await response.json()) as Partial<PlatformConfig>;

    return {
        chainId: CHAIN_ID,
        escrowAddress: ESCROW_ADDRESS,
        tipJarAddress: TIPJAR_ADDRESS,
        usdcAddress: USDC_ADDRESS,
        rpcUrl: remote.rpcUrl ?? DEFAULT_RPC_URL,
        wsUrl: remote.wsUrl ?? deriveWsUrl(baseUrl),
        explorerUrl: remote.explorerUrl ?? EXPLORER_URL,
        platformUrl: baseUrl,
        envioUrl: remote.envioUrl,
        chainSyncMode: remote.chainSyncMode,
        platformFeeBps: remote.platformFeeBps ?? Number(PLATFORM_FEE_BPS),
        minPassRate: remote.minPassRate ?? MIN_PASS_RATE,
        version: remote.version,
    };
}
