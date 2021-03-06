const PrivateExchangeProxy = artifacts.require("PrivateExchangeProxy");
const PrivateExchangeLogic = artifacts.require("PrivateExchangeLogic");
const PrivateCompanyFactory = artifacts.require("PrivateCompanyFactory");
const IPrivateCompany = artifacts.require("IPrivateCompany");
const PrivateCompany = artifacts.require("PrivateCompany");

contract("Private Exchange Actions", async function(accounts) {
  before(async function() {
    this.proxyAdmin = accounts[0];
    this.logicAdmin = accounts[1];
    this.normalSeller = accounts[2];
    this.normalBuyer = accounts[3];
    this.proxy = await PrivateExchangeProxy.deployed();
    this.logic = await PrivateExchangeLogic.deployed();
    this.companyFactory = await PrivateCompanyFactory.deployed();
    this.logicProxied = await PrivateExchangeLogic.at(this.proxy.address);
  });

  it("exchange initialized with openMode set to false", async function() {
    const got = await this.logicProxied.isOpen.call({
      from: this.normalSeller
    });
    const want = false;
    assert.equal(got, want);
  });

  it("non-exchange owner cannot call switchOpenMode onlyOwner func", async function() {
    try {
      assert.equal(
        await this.logicProxied.switchOpenMode(true, {
          from: this.normalSeller
        }),
        false
      );
    } catch (e) {
      assert(e.toString().includes("Ownable: caller is not the owner"));
    }
  });

  it("normal user cannot call createAndListCompany when OpenMode is false", async function() {
    try {
      assert.equal(
        await this.logicProxied.createCompanyAndList(
          "COMPANY1",
          "COY1",
          web3.utils.toWei("1"),
          {
            from: this.normalSeller
          }
        ),
        false
      );
    } catch (e) {
      assert(e.toString().includes("not in open mode"));
    }
  });

  it("logic admin calls switchOpenMode onlyOwner func successfully", async function() {
    await this.logicProxied.switchOpenMode(true, { from: this.logicAdmin });
  });

  it("logicProxy openMode updated from false to true", async function() {
    let got = await this.logicProxied.isOpen.call({ from: this.normalSeller });
    let want = true;
    assert.equal(got, want);
  });

  it("logicAdmin can createCompanyAndList when OpenMode is true", async function() {
    await this.logicProxied.createCompanyAndList(
      "COMPANY1",
      "COY1",
      web3.utils.toWei("1"),
      {
        from: this.logicAdmin
      }
    );
  });

  it("logicAdmin has 1 company on platform", async function() {
    const ownedCompanies = await this.logicProxied.numberOfOwnedCompanies.call({
      from: this.logicAdmin
    });
    assert.equal(ownedCompanies, 1);
  });

  it("logicAdmin can mint 1000 shares and list them on platform", async function() {
    const coy1address = await this.logicProxied.ownerCompanies.call(
      this.logicAdmin,
      0,
      { from: this.logicAdmin }
    );
    const coy1 = await IPrivateCompany.at(coy1address);
    await coy1.mint(web3.utils.toWei("1000"), { from: this.logicAdmin });
    await coy1.approve(this.proxy.address, web3.utils.toWei("1000"), {
      from: this.logicAdmin
    });
    const got = await coy1.allowance.call(this.logicAdmin, this.proxy.address);
    const want = web3.utils.toWei("1000");
    assert.equal(got, want);
  });

  it("cannot list a company with empty company name or symbol", async function() {
    try {
      assert.equal(
        await this.logicProxied.createCompanyAndList(
          "",
          "test-symbol",
          web3.utils.toWei("2"),
          {
            from: this.normalSeller
          }
        ),
        false
      );
    } catch (e) {
      assert(e.toString().includes("empty name given"));
    }
    try {
      assert.equal(
        await this.logicProxied.createCompanyAndList(
          "test-name",
          "",
          web3.utils.toWei("2"),
          {
            from: this.normalSeller
          }
        ),
        false
      );
    } catch (e) {
      assert(e.toString().includes("empty symbol given"));
    }
  });
  it("normalUser can createCompanyAndList", async function() {
    assert(
      await this.logicProxied.createCompanyAndList(
        "COMPANY2",
        "COY2",
        web3.utils.toWei("2"),
        {
          from: this.normalSeller
        }
      )
    );
  });

  it("normalUser has 1 company on platform", async function() {
    const ownedCompanies = await this.logicProxied.numberOfOwnedCompanies.call({
      from: this.normalSeller
    });
    assert.equal(ownedCompanies, 1);
  });

  it("normalUser can mint 1000 shares and list them on platform", async function() {
    const index = 0;
    const coy2address = await this.logicProxied.ownerCompanies.call(
      this.normalSeller,
      index,
      { from: this.normalSeller }
    );
    const coy2 = await IPrivateCompany.at(coy2address);
    await coy2.mint(web3.utils.toWei("1000"), { from: this.normalSeller });
    await coy2.approve(this.proxy.address, web3.utils.toWei("1000"), {
      from: this.normalSeller
    });
    const got = await coy2.allowance.call(
      this.normalSeller,
      this.proxy.address
    );
    const want = web3.utils.toWei("1000");
    assert.equal(got, want);
  });

  it("normalUser can create more than 1 company on platform", async function() {
    assert(
      await this.logicProxied.createCompanyAndList(
        "COMPANY3",
        "COY3",
        web3.utils.toWei("3"),
        {
          from: this.normalSeller
        }
      )
    );
    const ownedCompanies = await this.logicProxied.numberOfOwnedCompanies.call({
      from: this.normalSeller
    });
    assert.equal(ownedCompanies, 2);
    const index = 1;
    const coy3address = await this.logicProxied.ownerCompanies.call(
      this.normalSeller,
      1,
      { from: this.normalSeller }
    );
    const coy3 = await IPrivateCompany.at(coy3address);
    await coy3.mint(web3.utils.toWei("2000"), { from: this.normalSeller });
    await coy3.approve(this.proxy.address, web3.utils.toWei("2000"), {
      from: this.normalSeller
    });
    const got = await coy3.allowance.call(
      this.normalSeller,
      this.proxy.address
    );
    const want = web3.utils.toWei("2000");
    assert.equal(got, want);
  });

  it("total number of listed companies is 3", async function() {
    const got = await this.logicProxied.numberOfListedCompanies.call({
      from: this.normalSeller
    });
    const want = 3;
    assert.equal(got.toNumber(), want);
  });

  it("check properties of the 3 companies", async function() {
    for (var i = 0; i < 3; i++) {
      const a = await this.logicProxied.listedCompanies.call(i, {
        from: this.normalSeller
      });
      const c = await IPrivateCompany.at(a);
      const owner = await c.owner.call();
      const name = await c.name.call();
      const symbol = await c.symbol.call();
      const sharesListed = await c.allowance.call(owner, this.proxy.address);
      const price = await this.logicProxied.listedCompanyPrices.call(a, {
        from: this.normalSeller
      });

      const wantName = "COMPANY" + (i + 1);
      assert.equal(name, wantName);

      const wantSymbol = "COY" + (i + 1);
      assert.equal(symbol, wantSymbol);

      const wantOwner =
        i == 0
          ? this.logicAdmin
          : i == 1
          ? this.normalSeller
          : i == 2
          ? this.normalSeller
          : address(0);
      assert.equal(owner, wantOwner);

      const wantSharesListed =
        i == 0
          ? web3.utils.toWei("1000")
          : i == 1
          ? web3.utils.toWei("1000")
          : i == 2
          ? web3.utils.toWei("2000")
          : "0";
      assert.equal(sharesListed, wantSharesListed);

      const wantPrice = (i == 0 ? 1 : i == 1 ? 2 : i == 2 ? 3 : 0).toString();
      assert.equal(price, web3.utils.toWei(wantPrice));
    }
  });

  it("logicAdmin can list a company manually with just an address", async function() {
    const tx = await this.companyFactory.newCompany(
      this.logicAdmin,
      "COMPANY4",
      "COY4"
    );
    const newCompanyAddress = tx.logs[0].args.company;
    await this.logicProxied.listCompany(newCompanyAddress, 4, {
      from: this.logicAdmin
    });
    const got = (await this.logicProxied.numberOfListedCompanies.call({
      from: this.normalSeller
    })).toNumber();
    const want = 4;
    assert.equal(got, want);
  });

  it("logicAdmin can delist a company", async function() {
    const addressCOY4 = await this.logicProxied.listedCompanies.call(3, {
      from: this.normalSeller
    });
    await this.logicProxied.delistCompany(addressCOY4, {
      from: this.logicAdmin
    });
    const got = (await this.logicProxied.numberOfListedCompanies.call({
      from: this.normalSeller
    })).toNumber();
    const want = 3;
    assert.equal(got, want);
  });

  it("normal buyer can buy exchangeTokens using ether", async function() {
    await this.logicProxied.buyExchangeToken({
      from: this.normalBuyer,
      value: web3.utils.toWei("20")
    });
    const got = web3.utils.fromWei(
      await this.logicProxied.exchangeTokenBalance.call({
        from: this.normalBuyer
      })
    );
    const want = 20;
    assert.equal(got, want);
  });

  it("normal buyer can sell exchangeTokens to get ether", async function() {
    const exchangeToken = await PrivateCompany.at(
      await this.logicProxied.exchangeToken.call({
        from: this.normalBuyer
      })
    );
    await exchangeToken.approve(this.proxy.address, web3.utils.toWei("10"), {
      from: this.normalBuyer
    });
    await this.logicProxied.sellExchangeToken(web3.utils.toWei("10"), {
      from: this.normalBuyer
    });
    const got = web3.utils.fromWei(
      await this.logicProxied.exchangeTokenBalance.call({
        from: this.normalBuyer
      })
    );
    const want = 10;
    assert.equal(got, want);
  });

  it("can only buy non-zero exchangeTokens", async function() {
    try {
      assert.equal(
        await this.logicProxied.buyExchangeToken({
          from: this.normalSeller,
          value: 0
        }),
        false
      );
    } catch (e) {
      assert(e.toString().includes("value needs to be non-zero"));
    }
  });

  it("normal buyer can stake exchangeTokens on exchange to buy shares", async function() {
    const exchangeToken = await PrivateCompany.at(
      await this.logicProxied.exchangeToken.call({
        from: this.normalBuyer
      })
    );
    await exchangeToken.approve(this.proxy.address, web3.utils.toWei("10"), {
      from: this.normalBuyer
    });
    const got = await this.logicProxied.exchangeTokenStaked.call({
      from: this.normalBuyer
    });
    const want = "10";
    assert.equal(web3.utils.fromWei(got), want);
  });

  it("normal buyer can buy normal seller shares", async function() {
    const company2 = await IPrivateCompany.at(
      await this.logicProxied.listedCompanies.call(1, {
        from: this.normalBuyer
      })
    );
    assert.equal(await company2.name.call(), "COMPANY2");
    await this.logicProxied.buyCompanyShares(
      company2.address,
      web3.utils.toWei("3"),
      {
        from: this.normalBuyer
      }
    );
    const got = web3.utils.fromWei(
      await this.logicProxied.exchangeTokenBalance.call({
        from: this.normalBuyer
      })
    );
    //COY2 trades at 1 COY2 == 2 ETGMT
    const want = 4;
    assert.equal(got, want);
  });

  it("can only buy listed company shares", async function() {
    try {
      const newCompany = await this.companyFactory.newCompany(
        this.logicAdmin,
        "unlistedCompany",
        "unlistedCOY",
        { from: this.normalSeller }
      );
      const newCompanyAddress = newCompany.logs[0].args.company;
      assert(
        await this.logicProxied.buyCompanyShares(
          newCompanyAddress,
          web3.utils.toWei("1"),
          {
            from: this.normalBuyer
          }
        ),
        false
      );
    } catch (e) {
      assert(e.toString().includes("not a listed company"));
    }
  });

  it("normal buyer cannot buy more than the listed normal seller shares", async function() {
    try {
      const company2 = await IPrivateCompany.at(
        await this.logicProxied.listedCompanies.call(1, {
          from: this.normalBuyer
        })
      );
      await this.logicProxied.buyCompanyShares(
        company2.address,
        web3.utils.toWei("1000000"),
        {
          from: this.normalBuyer
        }
      );
    } catch (e) {
      assert(
        e
          .toString()
          .includes("seller does not have enough shares to fill transaction")
      );
    }
  });

  it("normal buyer cannot buy with more exchange tokens that he/she has", async function() {
    try {
      const company2 = await IPrivateCompany.at(
        await this.logicProxied.listedCompanies.call(1, {
          from: this.normalBuyer
        })
      );
      await this.logicProxied.buyCompanyShares(
        company2.address,
        web3.utils.toWei("15"),
        {
          from: this.normalBuyer
        }
      );
    } catch (e) {
      assert(
        e
          .toString()
          .includes(
            "buyer does not have enough exchange tokens to fill transaction"
          )
      );
    }
  });

  it("normal seller can updateCompanyPrice", async function() {
    const company2 = await IPrivateCompany.at(
      await this.logicProxied.listedCompanies.call(1, {
        from: this.normalSeller
      })
    );
    assert.equal(await company2.name.call(), "COMPANY2");
    await this.logicProxied.updateCompanyPrice(company2.address, 1, {
      from: this.normalSeller
    });
  });

  it("normal seller cannot update unlisted company price", async function() {
    try {
      const newCompany = await this.companyFactory.newCompany(
        this.logicAdmin,
        "unlistedCompany",
        "unlistedCOY",
        { from: this.normalSeller }
      );
      const newCompanyAddress = newCompany.logs[0].args.company;
      await this.logicProxied.updateCompanyPrice(newCompanyAddress, 1, {
        from: this.normalSeller
      });
      assert(false);
    } catch (e) {
      assert(e.toString().includes("company is not listed"));
    }
  });

  it("normal seller cannot update company price to zero", async function() {
    try {
      const company2 = await IPrivateCompany.at(
        await this.logicProxied.listedCompanies.call(1, {
          from: this.normalSeller
        })
      );
      await this.logicProxied.updateCompanyPrice(company2.address, 0, {
        from: this.normalSeller
      });
      assert(false);
    } catch (e) {
      assert(e.toString().includes("price is not set as a positive integer"));
    }
  });

  it("normal seller cannot update listed company that he does not own", async function() {
    try {
      const company1 = await IPrivateCompany.at(
        await this.logicProxied.listedCompanies.call(0, {
          from: this.normalSeller
        })
      );
      await this.logicProxied.updateCompanyPrice(company1.address, 1, {
        from: this.normalSeller
      });
      assert(false);
    } catch (e) {
      assert(e.toString().includes("price-setter is not the company owner"));
    }
  });

  it("logic admin can close exchange", async function() {
    await this.logicProxied.switchOpenMode(false, { from: this.logicAdmin });
    const got = await this.logicProxied.isOpen.call({ from: this.logicAdmin });
    const want = false;
    assert.equal(got, want);
  });
});
