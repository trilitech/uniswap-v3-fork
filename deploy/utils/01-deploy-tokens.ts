import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { blockConfirmation, developmentChains } from "../../helper-hardhat-config";
import { verify } from "../../scripts/utils/verify";
import { expandTo18Decimals } from "../../scripts/utils/utilities";

// This is used to deploy 2 ERC20 tokens under deploy names Token0 and Token1
const deployTokens: DeployFunction = async function(
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("----------------------------------------------------");
  log("Deploying 2 ERC20 tokens and waiting for confirmations...");
  // Deploy 2 fake tokens
  const token0 = await deploy("Token0", {
    contract: "contracts/test/TestToken.sol:TestToken",
    from: deployer,
    args: [expandTo18Decimals(10000n), "Token0", "TK0"],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: blockConfirmation[network.name] || 1,
  });
  const token1 = await deploy("Token1", {
    contract: "contracts/test/TestToken.sol:TestToken",
    from: deployer,
    args: [expandTo18Decimals(10000n), "Token1", "TK1"],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: blockConfirmation[network.name] || 1,
  });

  // verify if not on a local chain
  if (!developmentChains.includes(network.name)) {
    console.log("Wait before verifying");
    await verify(token0.address, [expandTo18Decimals(10000n), "Token0", "TK0"], "contracts/test/TestToken.sol:TestToken");
    await verify(token1.address, [expandTo18Decimals(10000n), "Token1", "TK1"], "contracts/test/TestToken.sol:TestToken");
  }
};

export default deployTokens;
deployTokens.tags = ["all", "utils", "tokens", "Tokens"];
