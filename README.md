# Uniswap V3 fork

This is a fork of the Uniswap [v3-core](https://github.com/Uniswap/v3-core) and [v3-periphery](https://github.com/Uniswap/v3-periphery).

The project uses [hardhat-deploy](https://github.com/wighawag/hardhat-deploy) to facilitate the deployment and the live testing of the contracts.

## Setup

First, run:
```
npm install
```

Then, you have to create a `.env` file that follows the `.example.env`. You can remove the networks you don't use from it.

## Deploy

In order to deploy the factory and 2 tests tokens, you just have to run:
```
npx hardhat deploy --network <your-network>
```

## Test

Finally, if you want to run the tests:
```
npx hardhat test --network <your-network>
```

**Note:** The tests can be run both locally or on a live chain. If you runned the tests on a live chain, some tests won't run again if you don't redeploy others tokens as you can only create a pool one time per pair of token. If you want to rerun the creation pool tests on a live chain, delete manually the files `deployments/<your-network>/Token0.json` and `deployments/<your-network>/Token1.json` then rerun the command in the deploy section above (it won't redeploy the factory if you didn't deleted it too).