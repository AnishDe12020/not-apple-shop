import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Keypair, Transaction } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import BackLink from '../components/BackLink'
import Loading from '../components/Loading'
import {
  MakeTransactionInputData,
  MakeTransactionOutputData,
} from './api/makeTransaction'

const Checkout: NextPage = () => {
  const router = useRouter()
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(router.query)) {
    if (value) {
      if (Array.isArray(value)) {
        for (const v of value) {
          searchParams.append(key, v)
        }
      } else {
        searchParams.set(key, value)
      }
    }
  }

  const reference = useMemo(() => Keypair.generate().publicKey, [])

  searchParams.append('reference', reference.toString())

  const getTransaction = async () => {
    if (!publicKey) {
      return
    }

    const body: MakeTransactionInputData = {
      account: publicKey.toString(),
    }

    const response = await fetch(
      `/api/makeTransaction?${searchParams.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    const json = (await response.json()) as MakeTransactionOutputData

    if (response.status !== 200) {
      console.error(json)
      return
    }

    const transaction = Transaction.from(
      Buffer.from(json.transaction, 'base64')
    )
    setTransaction(transaction)
    setMessage(json.message)
    console.log(transaction)
  }

  useEffect(() => {
    getTransaction()
  }, [publicKey])

  const trySendTransaction = async () => {
    if (!transaction) {
      return
    }

    try {
      await sendTransaction(transaction, connection)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    trySendTransaction()
  }, [transaction])

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center gap-8">
        <div>
          <BackLink href="/buy">Cancel</BackLink>
        </div>

        <WalletMultiButton />

        <p>You need to connect your wallet to make transactions</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div>
        <BackLink href="/buy">Cancel</BackLink>
      </div>

      <WalletMultiButton />

      {message ? (
        <p>{message} Please approve the transaction using your wallet</p>
      ) : (
        <p>
          Creating transaction... <Loading />
        </p>
      )}
    </div>
  )
}

export default Checkout
