import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getMint,
} from '@solana/spl-token'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionContext } from '@solana/wallet-adapter-react'
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import { NextApiRequest, NextApiResponse } from 'next'
import { shopAddress, usdcAddress } from '../../lib/addresses'
import calculatePrice from '../../lib/calculatePrice'

export type MakeTransactionInputData = {
  account: string
}

export type MakeTransactionOutputData = {
  transaction: string
  message: string
}

type ErrorOutput = {
  error: string
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<MakeTransactionOutputData | ErrorOutput>
) => {
  try {
    const amount = calculatePrice(req.query)
    if (amount.toNumber() === 0) {
      res.status(400).json({ error: 'Buy some 🍎 products' })
      return
    }

    const { reference } = req.query
    if (!reference) {
      res.status(400).json({ error: 'No reference provided' })
      return
    }

    const { account } = req.body as MakeTransactionInputData
    if (!account) {
      res.status(400).json({ error: 'No account provided' })
      return
    }

    const buyerPublicKey = new PublicKey(account)
    const shopPublicKey = shopAddress

    const network = WalletAdapterNetwork.Devnet
    const endpoint = clusterApiUrl(network)
    const connection = new Connection(endpoint)

    const usdcMint = await getMint(connection, usdcAddress)
    const buyerUsdcAddress = await getAssociatedTokenAddress(
      usdcAddress,
      buyerPublicKey
    )
    const shopUsdcAddress = await getAssociatedTokenAddress(
      usdcAddress,
      shopPublicKey
    )

    const { blockhash } = await connection.getLatestBlockhash('finalized')

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: buyerPublicKey,
    })

    const transferInstruction = createTransferCheckedInstruction(
      buyerUsdcAddress, // source
      usdcAddress, // mint (token address)
      shopUsdcAddress, // destination
      buyerPublicKey, // owner of source address
      amount.toNumber() * 10 ** (await usdcMint).decimals, // amount to transfer (in units of the USDC token)
      usdcMint.decimals // decimals of the USDC token
    )

    transferInstruction.keys.push({
      pubkey: new PublicKey(reference),
      isSigner: false,
      isWritable: false,
    })

    transaction.add(transferInstruction)

    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
    })

    const base64 = serializedTransaction.toString('base64')

    res.status(200).json({
      transaction: base64,
      message: 'Thanks for emptying your pockets 💰',
    })
  } catch (err) {
    console.error(err)

    res.status(500).json({ error: 'error creating transaction' })
    return
  }
}

export default handler
