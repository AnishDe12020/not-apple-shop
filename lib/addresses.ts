import { PublicKey } from '@solana/web3.js'

export const shopAddress = new PublicKey(
  process.env.NEXT_PUBLIC_SHOP_WALLET_ADDRESS as string
)
