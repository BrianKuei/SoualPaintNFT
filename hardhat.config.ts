import { HardhatUserConfig } from "hardhat/config";
import "hardhat-gas-reporter";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from 'dotenv';

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      gas: 'auto',
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts:
        typeof process.env.GOERLI_PRIVATE_KEY !== 'undefined'
          ? [process.env.GOERLI_PRIVATE_KEY as string]
          : [],
    },
  },
  gasReporter: {
    enabled: true,
    // outputFile: "gas-report.txt",
    // noColors: true
  }
};

export default config;
