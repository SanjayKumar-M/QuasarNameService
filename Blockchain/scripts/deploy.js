const deploy = async () => {
  const [owner, nameservice] = await hre.ethers.getSigners();

  const PolyDomainContract = await hre.ethers.getContractFactory('polyDomain');
  const Contract = await PolyDomainContract.deploy("quasar");
  await Contract.deployed();
  console.log("polyDomain Contract is successfully deployed to :", Contract.address);


  let registration = await Contract.Register("sanjaymusk", { value: hre.ethers.utils.parseEther('1234') });
  await registration.wait();


  const address = await Contract.getAddress("sanjaymusk");
  console.log("Domain owner is", address);

  const balance = await hre.ethers.provider.getBalance(Contract.address);
  console.log("Contract balance:", hre.ethers.utils.formatEther(balance));

  try {
    registration = await Contract.connect(nameservice).withdraw();
    await registration.wait();
  } catch (error) {
    console.log("Not getting contract fuck!!");
  }
  let ownerBalance = await hre.ethers.provider.getBalance(owner.address);
  console.log("Balance of owner before withdrawal:", hre.ethers.utils.formatEther(ownerBalance));

  const contractBalance = await hre.ethers.provider.getBalance(Contract.address);
  ownerBalance = await hre.ethers.provider.getBalance(owner.address);

  console.log("Contract balance after withdrawal:", hre.ethers.utils.formatEther(contractBalance));
  console.log("Balance of owner after withdrawal:", hre.ethers.utils.formatEther(ownerBalance));
};

const runDeploy = async () => {
  try {
    await deploy();
    process.exit(0);
  }
  catch (error) {
    console.log(error);
    process.exit(1);

  }
};

runDeploy();