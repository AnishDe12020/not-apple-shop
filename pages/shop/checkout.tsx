import { NextPage } from 'next'
import { createQR, encodeURL, EncodeURLComponents } from '@solana/pay'
import { Keypair } from '@solana/web3.js'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef } from 'react'
import BackLink from '../../components/BackLink'
import PageHeading from '../../components/PageHeading'
import { shopAddress, usdcAddress } from '../../lib/addresses'
import calculatePrice from '../../lib/calculatePrice'

const Checkout: NextPage = () => {
  const router = useRouter()

  const qrRef = useRef<HTMLDivElement>(null)

  const amount = useMemo(() => calculatePrice(router.query), [router.query])

  const reference = useMemo(() => Keypair.generate().publicKey, [])

  const urlParams: EncodeURLComponents = {
    recipient: shopAddress,
    splToken: usdcAddress,
    amount,
    reference,
    label: 'Not Apple Inc',
    message: 'Thanks for emptying your pockets!',
  }

  const url = encodeURL(urlParams)
  console.log({ url })

  useEffect(() => {
    const qr = createQR(url, 512, 'transparent')
    if (qrRef.current && amount.isGreaterThan(0)) {
      qrRef.current.innerHTML = ''
      qr.append(qrRef.current)
    }
  })

  return (
    <div className="flex flex-col items-center gap-8">
      <BackLink href="/shop">Cancel</BackLink>
      <PageHeading>Checkout ${amount.toString()}</PageHeading>

      <div ref={qrRef} />
    </div>
  )
}

export default Checkout
