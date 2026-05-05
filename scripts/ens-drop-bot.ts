import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  keccak256,
  parseEther,
  parseGwei,
  toBytes,
} from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const CONTROLLER_ADDRESS = '0x253553366Da8546fC250F225fe3d25d0C782303b' as const
const BASE_REGISTRAR_ADDRESS = '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85' as const
const DEFAULT_RPC_URL = 'https://ethereum-rpc.publicnode.com'
const ONE_YEAR_SECONDS = 31536000n

const controllerAbi = [
  { type: 'function', name: 'available', stateMutability: 'view', inputs: [{ name: 'label', type: 'string' }], outputs: [{ name: '', type: 'bool' }] },
  { type: 'function', name: 'rentPrice', stateMutability: 'view', inputs: [{ name: 'label', type: 'string' }, { name: 'duration', type: 'uint256' }], outputs: [{ components: [{ name: 'base', type: 'uint256' }, { name: 'premium', type: 'uint256' }], name: 'price', type: 'tuple' }] },
  { type: 'function', name: 'minCommitmentAge', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'maxCommitmentAge', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'makeCommitment', stateMutability: 'pure', inputs: [{ name: 'registration', type: 'tuple', components: [
      { name: 'label', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'duration', type: 'uint256' },
      { name: 'secret', type: 'bytes32' },
      { name: 'resolver', type: 'address' },
      { name: 'data', type: 'bytes[]' },
      { name: 'reverseRecord', type: 'uint8' },
      { name: 'referrer', type: 'bytes32' },
    ] }], outputs: [{ name: 'commitment', type: 'bytes32' }] },
  { type: 'function', name: 'commitments', stateMutability: 'view', inputs: [{ name: '', type: 'bytes32' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'commit', stateMutability: 'nonpayable', inputs: [{ name: 'commitment', type: 'bytes32' }], outputs: [] },
  { type: 'function', name: 'register', stateMutability: 'payable', inputs: [{ name: 'registration', type: 'tuple', components: [
      { name: 'label', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'duration', type: 'uint256' },
      { name: 'secret', type: 'bytes32' },
      { name: 'resolver', type: 'address' },
      { name: 'data', type: 'bytes[]' },
      { name: 'reverseRecord', type: 'uint8' },
      { name: 'referrer', type: 'bytes32' },
    ] }], outputs: [] },
] as const

const baseAbi = [
  { type: 'function', name: 'nameExpires', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'available', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
] as const

type Config = {
  label: string
  owner: `0x${string}`
  rpcUrl: string
  privateKey?: `0x${string}`
  duration: bigint
  maxPriceEth: string
  pollMs: number
  slippageBps: bigint
  priorityFeeGwei: string
  maxFeeGwei?: string
  dryRun: boolean
}

type Registration = {
  label: string
  owner: `0x${string}`
  duration: bigint
  secret: `0x${string}`
  resolver: `0x${string}`
  data: readonly `0x${string}`[]
  reverseRecord: number
  referrer: `0x${string}`
}

function env(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback
  if (value == null || value === '') throw new Error(`Missing env: ${name}`)
  return value
}

function getConfig(): Config {
  return {
    label: env('ENS_LABEL'),
    owner: env('ENS_OWNER') as `0x${string}`,
    rpcUrl: process.env.ETH_RPC_URL || DEFAULT_RPC_URL,
    privateKey: process.env.ENS_PRIVATE_KEY as `0x${string}` | undefined,
    duration: BigInt(process.env.ENS_DURATION_SECONDS || ONE_YEAR_SECONDS),
    maxPriceEth: process.env.ENS_MAX_PRICE_ETH || '0.25',
    pollMs: Number(process.env.ENS_POLL_MS || '1000'),
    slippageBps: BigInt(process.env.ENS_SLIPPAGE_BPS || '1000'),
    priorityFeeGwei: process.env.ENS_PRIORITY_FEE_GWEI || '5',
    maxFeeGwei: process.env.ENS_MAX_FEE_GWEI,
    dryRun: (process.env.DRY_RUN || 'false').toLowerCase() === 'true',
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatTs(ts: bigint) {
  return `${new Date(Number(ts) * 1000).toISOString()} (${ts})`
}

function withSlippage(value: bigint, bps: bigint) {
  return (value * (10000n + bps)) / 10000n
}

async function main() {
  const mode = process.argv[2]

  if (mode === 'generate-wallet') {
    const pk = generatePrivateKey()
    const account = privateKeyToAccount(pk)
    console.log(JSON.stringify({ address: account.address, privateKey: pk }, null, 2))
    return
  }

  const config = getConfig()
  const publicClient = createPublicClient({ chain: mainnet, transport: http(config.rpcUrl) })
  const labelhash = keccak256(toBytes(config.label))

  const [minCommitmentAge, maxCommitmentAge] = await Promise.all([
    publicClient.readContract({ address: CONTROLLER_ADDRESS, abi: controllerAbi, functionName: 'minCommitmentAge' }),
    publicClient.readContract({ address: CONTROLLER_ADDRESS, abi: controllerAbi, functionName: 'maxCommitmentAge' }),
  ])

  const expiryTs = await publicClient.readContract({
    address: BASE_REGISTRAR_ADDRESS,
    abi: baseAbi,
    functionName: 'nameExpires',
    args: [BigInt(labelhash)],
  })
  const dropTs = expiryTs + 90n * 24n * 60n * 60n

  const account = config.privateKey ? privateKeyToAccount(config.privateKey) : undefined
  const registration: Registration = {
    label: config.label,
    owner: config.owner,
    duration: config.duration,
    secret: keccak256(toBytes(`${config.label}:${config.owner}:${env('ENS_SECRET_SEED', 'change-me')}`)),
    resolver: '0x0000000000000000000000000000000000000000',
    data: [],
    reverseRecord: 0,
    referrer: '0x0000000000000000000000000000000000000000000000000000000000000000',
  }

  const commitment = await publicClient.readContract({
    address: CONTROLLER_ADDRESS,
    abi: controllerAbi,
    functionName: 'makeCommitment',
    args: [registration],
  })

  const initialPrice = await publicClient.readContract({
    address: CONTROLLER_ADDRESS,
    abi: controllerAbi,
    functionName: 'rentPrice',
    args: [config.label, config.duration],
  })

  if (mode === 'inspect') {
    const [available, baseAvailable, nowBlock, existingCommitmentTs] = await Promise.all([
      publicClient.readContract({ address: CONTROLLER_ADDRESS, abi: controllerAbi, functionName: 'available', args: [config.label] }),
      publicClient.readContract({ address: BASE_REGISTRAR_ADDRESS, abi: baseAbi, functionName: 'available', args: [BigInt(labelhash)] }),
      publicClient.getBlock(),
      publicClient.readContract({ address: CONTROLLER_ADDRESS, abi: controllerAbi, functionName: 'commitments', args: [commitment] }),
    ])

    console.log(JSON.stringify({
      label: config.label,
      owner: config.owner,
      rpcUrl: config.rpcUrl,
      expiryTimestamp: expiryTs.toString(),
      expiryIso: new Date(Number(expiryTs) * 1000).toISOString(),
      dropTimestamp: dropTs.toString(),
      dropIso: new Date(Number(dropTs) * 1000).toISOString(),
      nowTimestamp: nowBlock.timestamp.toString(),
      nowIso: new Date(Number(nowBlock.timestamp) * 1000).toISOString(),
      secondsUntilDrop: (dropTs - nowBlock.timestamp).toString(),
      available,
      baseAvailable,
      minCommitmentAge: minCommitmentAge.toString(),
      maxCommitmentAge: maxCommitmentAge.toString(),
      commitment,
      commitmentTimestamp: existingCommitmentTs.toString(),
      price: {
        baseWei: initialPrice.base.toString(),
        premiumWei: initialPrice.premium.toString(),
        totalWei: (initialPrice.base + initialPrice.premium).toString(),
        totalEth: formatEther(initialPrice.base + initialPrice.premium),
      },
    }, null, 2))
    return
  }

  if (!account) throw new Error('ENS_PRIVATE_KEY is required for live modes')

  const walletClient = createWalletClient({ chain: mainnet, transport: http(config.rpcUrl), account })
  const balance = await publicClient.getBalance({ address: account.address })

  if (mode === 'funding') {
    const estimatedTotal = withSlippage(initialPrice.base + parseEther(config.maxPriceEth), config.slippageBps) + parseEther('0.05')
    console.log(JSON.stringify({
      label: config.label,
      botAddress: account.address,
      owner: config.owner,
      rpcUrl: config.rpcUrl,
      dropTime: formatTs(dropTs),
      oneYearBaseEth: formatEther(initialPrice.base),
      currentPremiumEth: formatEther(initialPrice.premium),
      maxExtraPriceEthBudget: config.maxPriceEth,
      suggestedFundingEth: formatEther(estimatedTotal),
      notes: [
        'Suggested funding = one-year base + your max premium budget + 10% slippage + 0.05 ETH gas buffer.',
        'If you want to buy earlier in the 21-day premium window, raise ENS_MAX_PRICE_ETH.',
      ],
    }, null, 2))
    return
  }

  if (mode === 'commit') {
    console.log(`Using bot account ${account.address}`)
    console.log(`Current balance: ${formatEther(balance)} ETH`)
    console.log(`Drop target: ${formatTs(dropTs)}`)
    if (config.dryRun) {
      console.log(`DRY_RUN: would commit ${commitment}`)
      return
    }
    const hash = await walletClient.writeContract({
      address: CONTROLLER_ADDRESS,
      abi: controllerAbi,
      functionName: 'commit',
      args: [commitment],
      maxPriorityFeePerGas: parseGwei(config.priorityFeeGwei),
      ...(config.maxFeeGwei ? { maxFeePerGas: parseGwei(config.maxFeeGwei) } : {}),
    })
    console.log(JSON.stringify({ action: 'commit', hash, commitment, account: account.address }, null, 2))
    return
  }

  if (mode !== 'watch-and-register') {
    throw new Error('Usage: generate-wallet | inspect | funding | commit | watch-and-register')
  }

  const commitmentTimestamp = await publicClient.readContract({
    address: CONTROLLER_ADDRESS,
    abi: controllerAbi,
    functionName: 'commitments',
    args: [commitment],
  })

  if (commitmentTimestamp === 0n) {
    throw new Error('Commitment not found onchain for this exact registration. Run commit mode first and keep the same env values.')
  }

  const nowBlock = await publicClient.getBlock()
  if (commitmentTimestamp + minCommitmentAge > nowBlock.timestamp) {
    throw new Error(`Commitment too new. Earliest register time: ${formatTs(commitmentTimestamp + minCommitmentAge)}`)
  }
  if (commitmentTimestamp + maxCommitmentAge <= nowBlock.timestamp) {
    throw new Error('Commitment expired. Re-commit and try again.')
  }

  const maxPriceWei = parseEther(config.maxPriceEth)
  console.log(`Watching ${config.label}.eth with bot ${account.address}`)
  console.log(`Current balance: ${formatEther(balance)} ETH`)
  console.log(`Drop timestamp: ${formatTs(dropTs)}`)
  console.log(`Commitment valid until: ${formatTs(commitmentTimestamp + maxCommitmentAge)}`)
  console.log(`Max premium budget: ${config.maxPriceEth} ETH`)

  while (true) {
    const [block, available, price] = await Promise.all([
      publicClient.getBlock(),
      publicClient.readContract({ address: CONTROLLER_ADDRESS, abi: controllerAbi, functionName: 'available', args: [config.label] }),
      publicClient.readContract({ address: CONTROLLER_ADDRESS, abi: controllerAbi, functionName: 'rentPrice', args: [config.label, config.duration] }),
    ])
    const total = price.base + price.premium
    console.log(JSON.stringify({
      now: new Date(Number(block.timestamp) * 1000).toISOString(),
      available,
      baseEth: formatEther(price.base),
      premiumEth: formatEther(price.premium),
      totalEth: formatEther(total),
    }))

    if (available && price.premium <= maxPriceWei) {
      const value = withSlippage(total, config.slippageBps)
      if (config.dryRun) {
        console.log(`DRY_RUN: would register with value ${formatEther(value)} ETH`)
        return
      }
      const hash = await walletClient.writeContract({
        address: CONTROLLER_ADDRESS,
        abi: controllerAbi,
        functionName: 'register',
        args: [registration],
        value,
        maxPriorityFeePerGas: parseGwei(config.priorityFeeGwei),
        ...(config.maxFeeGwei ? { maxFeePerGas: parseGwei(config.maxFeeGwei) } : {}),
      })
      console.log(JSON.stringify({ action: 'register', hash, owner: config.owner, valueEth: formatEther(value) }, null, 2))
      return
    }

    await sleep(config.pollMs)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
