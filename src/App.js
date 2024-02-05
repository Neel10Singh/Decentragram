import { Link, BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import DecentratwitterAbi from "./contractsData/decentratwitter.json";
import DecentratwitterAddress from "./contractsData/decentratwitter-address.json";
import { Spinner, Navbar, Nav, Button, Container } from "react-bootstrap";
import logo from "./assets/logo.png";
import Home from "./Home.js";
import Profile from "./Profile.js";
import "./App.css";
import Lottie from "lottie-react";
import animation from "./assets/background.json";
import loader from "./assets/loader.json";

function App() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);

  const web3Handler = async (event) => {
    event.preventDefault();
    let accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setAccount(accounts[0]);

    // Setup event listeners for metamask
    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });
    window.ethereum.on("accountsChanged", async () => {
      setLoading(true);
      web3Handler();
    });
    // Get provider from Metamask
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    // Get signer
    const signer = provider.getSigner();
    loadContract(signer);
  };
  const loadContract = async (signer) => {
    // Get deployed copy of Decentratwitter contract
    const contract = new ethers.Contract(
      DecentratwitterAddress.address,
      DecentratwitterAbi.abi,
      signer
    );
    setContract(contract);
    setLoading(false);
  };

  return (
    <BrowserRouter>
      <div className="App">
        <>
          <div className=" h-20 w-screen bg-slate-900/80 fixed top-0 left-0 z-50 flex gap-20 md:gap-40 xl:gap-60 justify-center items-center p-2">
            <div className="flex gap-3 items-center">
              <div className=" h-16 w-16 rounded-full border-r-4 border-b-4 overflow-hidden relative">
                <img
                  src={logo}
                  className=" h-20 object-cover  absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] "
                />
              </div>
              <h1 className=" text-3xl text-white font-bold !mb-0">
                Decentragram
              </h1>
            </div>
            <div className="hidden lg:flex gap-5 items-center">
              <Link to="/">
                <button className=" h-10 w-24 rounded-full text-xl font-bold text-white hover:bg-white hover:!text-slate-950 transition-all">
                  Home
                </button>
              </Link>
              <Link to="/profile">
                <button
                  className=" h-10 w-24 rounded-full text-xl font-bold text-white hover:bg-white hover:!text-slate-950 transition-all"
                  as={Link}
                  to="/profile"
                >
                  Profile
                </button>
              </Link>
              {account ? (
                <a
                  href={`https://etherscan.io/address/${account}`}
                  target="blank"
                >
                  <button className=" h-10 w-40 rounded-full text-xl font-bold hover:text-white bg-white border-2 p-1 text-slate-950 hover:!bg-transparent transition-all">
                    {account.slice(0, 5) + "..." + account.slice(38, 42)}
                  </button>
                </a>
              ) : (
                <button
                  className=" h-10 w-40 rounded-full text-xl font-bold hover:text-white bg-white border-2 p-1 text-slate-950 hover:!bg-transparent transition-all"
                  onClick={(event) => web3Handler(event)}
                >
                  Connect Wallet
                </button>
              )}
            </div>
            <div
              className=" lg:hidden flex flex-col gap-1 h-12 w-12 border-2 rounded-lg p-2 justify-center cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <div className="w-full  border-2 rounded-full" />
              <div className="w-full  border-2 rounded-full" />
              <div className="w-full border-2 rounded-full" />
            </div>
            <div
              className={`${
                menuOpen ? "translate-x-0" : "translate-x-[100%]"
              } lg:hidden transition-all w-screen h-60 flex flex-col justify-center items-center gap-3 bg-slate-900/80 fixed top-20 left-0`}
            >
              <Link to="/">
                <button className=" h-10 w-24 rounded-full text-xl font-bold text-white hover:bg-white hover:!text-slate-950 transition-all">
                  Home
                </button>
              </Link>
              <Link to="/profile">
                <button
                  className=" h-10 w-24 rounded-full text-xl font-bold text-white hover:bg-white hover:!text-slate-950 transition-all"
                  as={Link}
                  to="/profile"
                >
                  Profile
                </button>
              </Link>
              {account ? (
                <a
                  href={`https://etherscan.io/address/${account}`}
                  target="blank"
                >
                  <button className=" h-10 w-40 rounded-full text-xl font-bold hover:text-white bg-white border-2 p-1 text-slate-950 hover:!bg-transparent transition-all">
                    {account.slice(0, 5) + "..." + account.slice(38, 42)}
                  </button>
                </a>
              ) : (
                <button
                  className=" h-10 w-40 rounded-full text-xl font-bold hover:text-white bg-white border-2 p-1 text-slate-950 hover:!bg-transparent transition-all"
                  onClick={(event) => web3Handler(event)}
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </>
        <div className="relative h-screen overflow-y-scroll">
          <div className="fixed top-0 left-0 h-screen w-screen">
            <Lottie
              animationData={animation}
              className="h-full w-full  object-fill"
              height="100%"
              width="100%"
              rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
            />
          </div>

          {loading ? (
            <div className=" absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] w-96 h-80 drop-shadow-glow bg-slate-900 z-40 rounded-xl flex flex-col justify-center items-center">
              <Lottie
                animationData={loader}
                style={{ height: "16rem", width: "16rem" }}
              />
              <p className="mt-2 text-xl text-white px-4 font-bold text-center">
                Awaiting Metamask Connection. Connect and keep posting!!
              </p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Home contract={contract} />} />
              <Route
                path="/profile"
                element={<Profile contract={contract} />}
              />
            </Routes>
          )}
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
