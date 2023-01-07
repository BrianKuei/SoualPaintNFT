import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from 'hardhat';
import { SoulPaint } from "../typechain-types";
const { parseEther } = ethers.utils;

describe("soul paint", () => {
  let soulPaint: SoulPaint;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let newRoyaltyReceiver: SignerWithAddress;
  const RoyaltyPrice = 1000;
  const baseURI = "ipfs://QmPoqWXooyBgooB5koNtih3q9tf6qGA51n28vXChr2PTf4/";


  beforeEach(async () => {
    [owner, user1, newRoyaltyReceiver] = await ethers.getSigners();
    const SoulPaintContractFactory = await ethers.getContractFactory('SoulPaint');
    soulPaint = await (await SoulPaintContractFactory.deploy(baseURI, owner.address, RoyaltyPrice)).deployed();

  });

  describe("Correct Supply", () => {
    it("should have correct max_supply", async () => {
      const max_supply = await soulPaint.MAX_SUPPLY();
      expect(max_supply).to.equal(1000);
    });

    it("should have correct totalSupply", async () => {
      const total_supply = await soulPaint.totalSupply();
      expect(total_supply).to.equal(0);
    });

  });

  describe("Mint should be fail", () => {
    it("should fail if is not owner call mint_Owner", async () => {
      await expect(soulPaint.connect(user1).mint_Owner(1)).to.be.revertedWith("Ownable: caller is not the owner");
    })
  });


  describe("royalty should fail", () => {
    it("should not a non-owner to update royalty info", async function () {

      const newRoyaltyPrice = 200;
      await expect(soulPaint.connect(user1).setDefaultRoyalty(newRoyaltyReceiver.address, newRoyaltyPrice)).to.be.revertedWith("Ownable: caller is not the owner");

    });

    it("should not a non-owner to update token royalty info", async function () {

      const newRoyaltyPrice = 200;
      const tokenId = 1;
      await expect(soulPaint.connect(user1).setTokenRoyalty(tokenId, newRoyaltyReceiver.address, newRoyaltyPrice)).to.be.revertedWith("Ownable: caller is not the owner");

    });
  })

  describe("royalty should correct", () => {

    it("should signal support for the ERC2981 Interface", async () => {
      const result = await soulPaint.supportsInterface("0x2a55205a");
      expect(result).to.equal(true);
    });

    it("should owner receive royalty fee", async () => {
      const ownerMintAmount = 2;
      await soulPaint.mint_Owner(ownerMintAmount);

      expect((await soulPaint.tokensOfOwner(owner.address)).length).eq(ownerMintAmount);

      const beforeTransferBalance = await owner.getBalance();
      const transferFromTx = await soulPaint.transferFrom(owner.address, user1.address, 0);
      const afterTransferBalance = await owner.getBalance();
      const receipt = await transferFromTx.wait();
      const gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      expect(beforeTransferBalance.sub(beforeTransferBalance)).to.eq(gasSpent)

      expect((await soulPaint.tokensOfOwner(owner.address)).length).eq(1);
      expect((await soulPaint.tokensOfOwner(user1.address)).length).eq(1);
    })
  });



  describe("token url should fail", () => {
    it("should revert if a non-existent tokenId is provided", async function () {
      await expect(soulPaint.tokenURI(2)).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
    })
  })

});