import { network, run } from "hardhat";
import { BaseContract } from "ethers";
import { blockConfirmation, developmentChains } from "../../helper-hardhat-config";

export const verify = async (contractAddress: string, args: any[], contractName?: string) => {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
      contract: contractName,
    });
  } catch (e: any) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!");
    } else {
      console.log(e);
    }
  }
}

export const verifyContract = async (contract: BaseContract, args: any[], contractName?: string) => {
  if (!developmentChains.includes(network.name)) {
    console.log("Wait before verifying");
    await contract.deploymentTransaction()?.wait(blockConfirmation[network.name] || 6);
    await verify(await contract.getAddress(), args);
  }
}