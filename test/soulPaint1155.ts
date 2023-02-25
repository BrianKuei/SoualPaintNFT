import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect, use } from "chai";
import { ethers } from 'hardhat';
import { SoulPaintAP } from "../typechain-types";

describe("soul paint 1155", () => {
  let SoulPaintAP: SoulPaintAP;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  const baseURI = "ipfs://QmPoqWXooyBgooB5koNtih3q9tf6qGA51n28vXChr2PTf4/";


  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    const SoulPaintContractFactory = await ethers.getContractFactory('SoulPaintAP');
    SoulPaintAP = await (await SoulPaintContractFactory.deploy(baseURI)).deployed();

  });

  describe("Mint", () => {
    const id = 0;
    it("should fail if is not owner call mint", async () => {
      await expect(SoulPaintAP.connect(user1).mint(owner.address, id, 1, '0x')).to.be.revertedWith("Ownable: caller is not the owner");
    })

    it("mint correctly works", async () => {
      await SoulPaintAP.connect(owner).mint(user1.address, id, 2, '0x')
      expect(await SoulPaintAP.balanceOf(user1.address, id)).equal(2)
    })
  });

  describe("Transfer", () => {
    const id = 0;

    describe("transferByCustomer", () => {
      it("transfer should be fail when target is not owner", async () => {
        await SoulPaintAP.connect(owner).mint(user1.address, id, 2, '0x')
        await expect(SoulPaintAP.connect(user1).transferByCustomer(user1.address, user2.address, id, 1)).to.be.revertedWith('target is not owner')
      })

      it("transfer should be fail when caller is not the owner", async () => {
        await SoulPaintAP.connect(owner).mint(user1.address, id, 2, '0x')
        await expect(SoulPaintAP.connect(user2).transferByCustomer(user1.address, user2.address, id, 1)).to.be.revertedWith('caller is not owner nor approved')
      })

      it("transfer should correctly and owner must get one token", async () => {
        await SoulPaintAP.connect(owner).mint(user1.address, id, 2, '0x')
        await SoulPaintAP.connect(user1).transferByCustomer(user1.address, owner.address, id, 1)
        expect(await SoulPaintAP.balanceOf(owner.address, id)).equal(1)
      })
    })
  })

  describe("URI", () => {
    const id = 0;
    it("get token uri", async () => {
      await SoulPaintAP.connect(owner).mint(user1.address, id, 2, '0x')
      console.log(await SoulPaintAP.uri(id))
    })
  })
});