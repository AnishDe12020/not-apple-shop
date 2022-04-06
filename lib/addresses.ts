import { PublicKey } from '@solana/web3.js'

export const shopAddress = new PublicKey(
  process.env.NEXT_PUBLIC_SHOP_WALLET_ADDRESS as string
)

export const usdcAddress = new PublicKey(
  'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'
)

export const couponAddress = new PublicKey(
  process.env.NEXT_PUBLIC_COUPON_ADDRESS as string
)
