import { deployments, network, ethers } from "hardhat";
import { expect } from "chai";
import { TestToken,  } from "../../typechain-types";
import { developmentChains } from "../../helper-hardhat-config";
import { FeeAmount, TICK_SPACINGS, getCreate2Address, sortTokens } from "../../scripts/utils/utilities";
import { UniswapV3Factory } from "../../typechain-types/UniswapV3Factory";
import { ZeroAddress } from "ethers";

const setup = deployments.createFixture(async ({deployments, getNamedAccounts, ethers}, options) => {
  if (developmentChains.includes(network.name)) {
    console.log("cc");
    await deployments.fixture(["UniswapV3Factory", "tokens"]); // ensure you start from a fresh deployments
  }
  const { deployer } = await getNamedAccounts();
  const uniswapV3Factory = await ethers.getContract('UniswapV3Factory', deployer) as UniswapV3Factory;
  const token0 = await ethers.getContract('Token0', deployer) as TestToken;
  const token1 = await ethers.getContract('Token1', deployer) as TestToken;
  const poolBytecode = (await ethers.getContractFactory("UniswapV3Pool")).bytecode;

  return { deployer, uniswapV3Factory, token0, token1, poolBytecode };
});

// Tests both local and on-chain
describe('UniswapV3Factory', () => {
  it("owner is deployer", async function () {
    const { deployer, uniswapV3Factory } = await setup();

    expect(await uniswapV3Factory.owner()).to.eq(deployer);
  }).timeout(100000);

  it("initial enabled fee amounts", async function () {
    const { uniswapV3Factory } = await setup();

    expect(await uniswapV3Factory.feeAmountTickSpacing(FeeAmount.LOW)).to.eq(TICK_SPACINGS[FeeAmount.LOW]);
    expect(await uniswapV3Factory.feeAmountTickSpacing(FeeAmount.MEDIUM)).to.eq(TICK_SPACINGS[FeeAmount.MEDIUM]);
    expect(await uniswapV3Factory.feeAmountTickSpacing(FeeAmount.HIGH)).to.eq(TICK_SPACINGS[FeeAmount.HIGH]);
  }).timeout(100000);

  async function createAndCheckPool(
    factory: UniswapV3Factory,
    tokens: [string, string],
    feeAmount: FeeAmount,
    poolBytecode: any,
    tickSpacing: number = TICK_SPACINGS[feeAmount],
  ) {
    const factoryAddress = await factory.getAddress();
    const create2Address = getCreate2Address(factoryAddress, tokens, feeAmount, poolBytecode);
    const create = await factory.createPool(tokens[0], tokens[1], feeAmount);
    const [token0, token1] = sortTokens(tokens);

    await expect(create)
      .to.emit(factory, 'PoolCreated')
      .withArgs(token0, token1, feeAmount, tickSpacing, create2Address);

    await expect(factory.createPool(tokens[0], tokens[1], feeAmount)).to.be.reverted;
    await expect(factory.createPool(tokens[1], tokens[0], feeAmount)).to.be.reverted;
    expect(await factory.getPool(tokens[0], tokens[1], feeAmount), 'getPool in order').to.eq(create2Address);
    expect(await factory.getPool(tokens[1], tokens[0], feeAmount), 'getPool in reverse').to.eq(create2Address);

    const poolContractFactory = await ethers.getContractFactory('UniswapV3Pool');
    const pool = poolContractFactory.attach(create2Address);
    expect(await pool.factory(), 'pool factory address').to.eq(factoryAddress);
    expect(await pool.token0(), 'pool token0').to.eq(token0);
    expect(await pool.token1(), 'pool token1').to.eq(token1);
    expect(await pool.fee(), 'pool fee').to.eq(feeAmount);
    expect(await pool.tickSpacing(), 'pool tick spacing').to.eq(tickSpacing);
  }

  describe("Create pools", () => {
    // Check if pools are already created
    before(async function() {
      const { uniswapV3Factory, token0, token1, poolBytecode } = await setup();

      const poolAddress = await uniswapV3Factory.getPool(token0, token1, FeeAmount.LOW);
      if (poolAddress != ZeroAddress) {
        // Pool already created, stop the test
        console.log("WARNING: tests skipped because the pools are already created. Redeploy new tokens.");
        this.skip();
      }
    });

    it("succeeds for low fee pool", async function () {
      const { uniswapV3Factory, token0, token1, poolBytecode } = await setup();
  
      await createAndCheckPool(uniswapV3Factory, [await token0.getAddress(), await token1.getAddress()], FeeAmount.LOW, poolBytecode);
    }).timeout(100000);
    
    it("succeeds for medium fee pool", async function () {
      const { uniswapV3Factory, token0, token1, poolBytecode } = await setup();
  
      await createAndCheckPool(uniswapV3Factory, [await token0.getAddress(), await token1.getAddress()], FeeAmount.MEDIUM, poolBytecode);
    }).timeout(100000);

    it("succeeds for high fee pool", async function () {
      const { uniswapV3Factory, token0, token1, poolBytecode } = await setup();
  
      await createAndCheckPool(uniswapV3Factory, [await token0.getAddress(), await token1.getAddress()], FeeAmount.HIGH, poolBytecode);
    }).timeout(100000);
  });
});