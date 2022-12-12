import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from 'hardhat';
import { SoulPaintErc721 } from "../typechain-types";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

describe("soul pain ERC721", () => {
  let soulPaint: SoulPaintErc721;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let whitelisted: string[];
  let root: string;
  let proof: string[];


  beforeEach(async () => {
    const SoulPaintContractFactory = await ethers.getContractFactory('SoulPaintErc721');
    soulPaint = await (await SoulPaintContractFactory.deploy('')).deployed();
    [owner, user1] = await ethers.getSigners();
    whitelisted = [
      "0x1C541e05a5A640755B3F1B2434dB4e8096b8322f",
      "0x1071258E2C706fFc9A32a5369d4094d11D4392Ec",
      "0x25f7fF7917555132eDD3294626D105eA1C797250",
      "0xF6574D878f99D94896Da75B6762fc935F34C1300",
      owner.address
    ]
    const buf2hex = (x: Buffer) => '0x' + x.toString('hex')
    const leaves = whitelisted.map(addr => keccak256(addr))
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true })
    const leaf = keccak256(owner.address);
    root = buf2hex(tree.getRoot())
    proof = tree.getProof(leaf).map(x => buf2hex(x.data))
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

    it("should fail by _isSaleActive is false", async () => {
      await expect(soulPaint.mint(1)).to.be.revertedWith("Sale is not active");
    });

    it("should fail if exceed max supply", async () => {
      await soulPaint.toggleSaleActive();
      const count = Number(await soulPaint.MAX_SUPPLY()) + 1;
      const price = Number(await soulPaint.mintPrice()) * 2;
      await expect(soulPaint.mint(count, { value: price.toString() })).to.be.revertedWith("Sale would exceed max supply");
    });

    it("should fail if exceed max balance", async () => {
      await soulPaint.toggleSaleActive();
      await soulPaint.setMaxBalance(10);
      await expect(soulPaint.mint(11)).to.be.revertedWith("Sale would exceed max balance");
    });

    it("should fail if mint quantity <=0", async () => {
      await soulPaint.toggleSaleActive();
      await expect(soulPaint.mint(0)).to.be.revertedWith("quantity must be greater 0");
    });

    it("should fail if ether is not enough", async () => {
      await soulPaint.toggleSaleActive();
      await expect(soulPaint.mint(1, { value: 1 })).to.be.revertedWith("Not enough ether sent");
    });

    it("should fail if is not owner call mint_Owner", async () => {
      await expect(soulPaint.connect(user1).mint_Owner(1)).to.be.revertedWith("Ownable: caller is not the owner");
    })

    it("should fail by _isWLSaleActive is false", async () => {
      await expect(soulPaint.connect(user1).mint_WL(1, proof)).to.be.revertedWith("Sale must be active to mint");
    })

    it("should fail if user in not in white list", async () => {
      await soulPaint.toggleWLSaleActive();
      await soulPaint.setMerkleRoot(root);
      await expect(soulPaint.connect(user1).mint_WL(1, proof)).to.be.revertedWith("Must be whitelisted");
    })
  });

  describe("Mint and totalSupply should be correct", () => {


    it("totalSupply should should have 100", async () => {
      await soulPaint.toggleSaleActive();
      const amount = 100;
      const price = Number(await soulPaint.mintPrice()) * amount;
      await soulPaint.mint(amount, { value: price.toString() });
      const supply = await soulPaint.totalSupply();
      await expect(supply).to.equal(amount);
    });

    it("totalSupply should should have 150", async () => {
      await soulPaint.toggleSaleActive();
      const amount = 100;
      var price = Number(await soulPaint.mintPrice()) * amount;
      await soulPaint.connect(user1).mint(amount, { value: price.toString() });
      const amount2 = 50;
      price = Number(await soulPaint.mintPrice()) * amount2;
      await soulPaint.connect(owner).mint(amount2, { value: price.toString() });
      const supply = await soulPaint.totalSupply();
      expect(supply).to.equal(amount + amount2);
    });


  });

  describe("tokensOfOwner should be correct", () => {


    it("user should have 100 nft", async () => {
      await soulPaint.toggleSaleActive();
      const amount = 10;
      const price = Number(await soulPaint.mintPrice()) * amount;
      await soulPaint.connect(user1).mint(amount, { value: price.toString() });
      const tokensOfUser1Arr = await soulPaint.connect(user1).balanceOf(user1.address);
      expect(tokensOfUser1Arr).to.equal(amount);
    });

    it("user should have 50", async () => {
      await soulPaint.toggleSaleActive();
      const amount = 5;
      const price = Number(await soulPaint.mintPrice()) * amount;
      await soulPaint.connect(owner).mint(amount, { value: price.toString() });
      const tokensOfOwnerArr = await soulPaint.connect(owner).balanceOf(owner.address);
      expect(tokensOfOwnerArr).to.equal(amount);
    });

  });
});