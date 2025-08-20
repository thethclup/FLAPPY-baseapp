import config from "../basebuilder.json";

export const BASE_CHAIN_ID_HEX = "0x2105";
export const BASE_CHAIN_ID_DEC = 8453;

export function shortenAddress(addr?: string, left = 6, right = 4) {
  if (!addr) return "";
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

export function isAddressAllowed(addr: string | null | undefined) {
  if (!addr) return false;
  const allowed = config.baseBuilder.allowedAddresses.map((a) => a.toLowerCase());
  return allowed.includes(addr.toLowerCase());
}

export async function ensureBaseNetwork(provider: any) {
  try {
    const currentChainId = await provider.request({ method: "eth_chainId" });
    if (currentChainId !== BASE_CHAIN_ID_HEX) {
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BASE_CHAIN_ID_HEX }],
        });
      } catch (switchErr: any) {
        if (switchErr?.code === 4902) {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: BASE_CHAIN_ID_HEX,
                chainName: "Base Mainnet",
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://mainnet.base.org"],
                blockExplorerUrls: ["https://basescan.org"],
              },
            ],
          });
        } else {
          throw switchErr;
        }
      }
    }
  } catch (err) {
    console.error("Network check/switch failed:", err);
    throw err;
  }
}