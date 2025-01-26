async function main() {
    const [deployer] = await ethers.getSigners()
  
    console.log('Deploying contracts with the account:', deployer.address)

    const TokenForwarder = await ethers.getContractFactory('TokenForwarder')
    const tokenForwarder = await TokenForwarder.deploy()

    console.log(
      'Token Forwarder contract deployed to:',
      await tokenForwarder.address
    )
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })