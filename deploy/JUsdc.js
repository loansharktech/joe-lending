module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  const Joetroller = await ethers.getContract("Joetroller");
  const unitroller = await ethers.getContract("Unitroller");
  const joetroller = Joetroller.attach(unitroller.address);

  await deploy("JUsdcDelegate", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    contract: "JCollateralCapErc20Delegate",
  });

  const jUsdcDelegate = await ethers.getContract("JUsdcDelegate");

  const interestRateModel = await ethers.getContract("TripleSlopeRateModel");

  const deployment = await deploy("JUsdcDelegator", {
    from: deployer,
    args: [
      "0x4dbcdf9b62e891a7cec5a2568c3f4faf9e8abe2b", // USDC address on Rinkeby
      joetroller.address,
      interestRateModel.address,
      ethers.utils.parseUnits("2", 14).toString(),
      "Banker Joe USDC Token",
      "jUSDC",
      "8",
      deployer,
      jUsdcDelegate.address,
      "0x",
    ],
    log: true,
    deterministicDeployment: false,
    contract: "JCollateralCapErc20Delegator",
    gasLimit: 4000000,
  });
  await deployment.receipt;
  const jUsdcDelegator = await ethers.getContract("JUsdcDelegator");

  console.log("Supporting jUSDC market...");
  await joetroller._supportMarket(jUsdcDelegator.address, 1, {
    gasLimit: 4000000,
  });

  const collateralFactor = "0.75";
  console.log("Setting collateral factor ", collateralFactor);
  await joetroller._setCollateralFactor(
    jUsdcDelegator.address,
    ethers.utils.parseEther(collateralFactor),
    { gasLimit: 4000000 }
  );

  const reserveFactor = "0.20";
  console.log("Setting reserve factor ", reserveFactor);
  await jUsdcDelegator._setReserveFactor(
    ethers.utils.parseEther(reserveFactor)
  );
};

module.exports.tags = ["jUSDC"];
module.exports.dependencies = ["Joetroller", "TripleSlopeRateModel"];