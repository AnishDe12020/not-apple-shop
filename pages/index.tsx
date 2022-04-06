import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import CouponBook from '../components/CouponBook'
import Products from '../components/Products'
import SiteHeading from '../components/SiteHeading'

export default function HomePage() {
  const { publicKey } = useWallet()

  return (
    <div className="m-auto flex max-w-4xl flex-col items-stretch gap-8 pt-24">
      <SiteHeading>Not Apple Inc</SiteHeading>

      <div className="basis-1/4">
        <WalletMultiButton className="duration-i00 !bg-gray-900 transition hover:scale-110" />
      </div>

      {publicKey && <CouponBook />}

      <Products submitTarget="/checkout" enabled={publicKey != null} />
    </div>
  )
}
