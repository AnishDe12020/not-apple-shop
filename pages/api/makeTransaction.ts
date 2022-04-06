import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getMint,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js'
import base58 from 'bs58'
import { NextApiRequest, NextApiResponse } from 'next'
import { couponAddress, shopAddress, usdcAddress } from '../../lib/addresses'
import calculatePrice from '../../lib/calculatePrice'

export type MakeTransactionInputData = {
  account: string
}

export type MakeTransactionOutputData = {
  transaction: string
  message: string
}

export type MakeTransactionGetResponse = {
  label: string,
  icon: string,
}


type ErrorOutput = {
  error: string
}

const get = (res: NextApiResponse<MakeTransactionGetResponse>) => {
res.status(200).json({
    label: "Not Apple Inc",
    icon: "https://freesvg.org/img/1370962427.png",
  })
}

const post = async (
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

    const shopPrivateKey = process.env.SHOP_PRIVATE_KEY as string
if (!shopPrivateKey) {
  res.status(500).json({ error: "Shop private key not available" })
}
const shopKeypair = Keypair.fromSecretKey(base58.decode(shopPrivateKey))

    const buyerPublicKey = new PublicKey(account)
    const shopPublicKey = shopAddress

    const network = WalletAdapterNetwork.Devnet
    const endpoint = clusterApiUrl(network)
    const connection = new Connection(endpoint)

      const buyerCouponAddress = await getOrCreateAssociatedTokenAccount(
      connection,
      shopKeypair, // shop pays the fee to create it
      couponAddress, // which token the account is for
      buyerPublicKey, // who the token account belongs to (the buyer)
    ).then(account => account.address)



    const shopCouponAddress = await getAssociatedTokenAddress(couponAddress, shopPublicKey)

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

     const couponInstruction = createTransferCheckedInstruction(
      shopCouponAddress, // source account (coupon)
      couponAddress, // token address (coupon)
      buyerCouponAddress, // destination account (coupon)
      shopPublicKey, // owner of source account
      1, // amount to transfer
      0, // decimals of the token - we know this is 0
    )

    transaction.add(transferInstruction, couponInstruction)

     transaction.partialSign(shopKeypair)

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

const handler = async (req: NextApiRequest, res: NextApiResponse<MakeTransactionGetResponse | MakeTransactionOutputData | ErrorOutput>) => {
  if (req.method === "GET") {
    return get(res)
  } else if (req.method === "POST") {
    return await post(req, res)
  } else {
    return res.status(405).json({ error: "Method not allowed" })
  }
}

export default handler
