import React from 'react'
import '../Styles/Metamask.css'
import { useEffect, useState } from "react";
import { ethers } from 'ethers';
import contractAbi from '../Utils/ContractABI.json'
import switchNetwork from './switchNetwork';
import { networks } from '../Utils/networks';
import polygonLogo from '../assets/polygonlogo.png';
import ethLogo from '../assets/ethlogo.png';

const tld = '.quasar';
const Contract_Address = '0xd3bE553059e12CebFe9511954559b27416C26749';


const Metamask = () => {
    const [currentAccount, setCurrentAccount] = useState('');
    const [domain, setDomain] = useState('');
    const [record, setRecord] = useState('');
    const [network, setNetwork] = useState('');
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mints, setMints] = useState([]);

    const connectWallet = async () => {
        try {
            const { ethereum } = window;

            if (!ethereum) {
                alert("Get MetaMask -> https://metamask.io/");
                return;
            }
            const account = await ethereum.request({ method: "eth_requestAccounts" });


            console.log("Connected", account[0]);
            setCurrentAccount(account[0]);
        } catch (error) {
            console.log(error)
        }
    }


    const checkIfWalletIsConnected = async () => {


        const { ethereum } = window;
        if (!ethereum) {
            alert("Please install or activate Metamask wallet");
            return;
        } else {
            console.log("Haha", ethereum);

        }
        const account = await ethereum.request({ method: "eth_Accounts" });
        if (account.length !== 0) {
            const accounts = account[0];
            console.log('Found an authorized account:', accounts);
            setCurrentAccount(accounts);
        } else {
            console.log('No authorized account found');
        }

        const chainId = await ethereum.request({ method: 'eth_chainId' });
        setNetwork(networks[chainId]);

        ethereum.on('chainChanged', handleChainChanged);


        function handleChainChanged(_chainId) {
            window.location.reload();
        }


    }



    function walletConnect() {
        return (
            <div className='meta-button'>

                <button className="glow-on-hover" onClick={connectWallet}>Connect Metamask</button>
            </div>
        );
    }
    const InputForm = () => {

        return (
            <div className="form-container">
                <div className="first-row">
                    <input className='in'
                        type="text"
                        value={domain}
                        placeholder='domain'
                        onChange={e => setDomain(e.target.value)}
                    />
                    <p className='tld'> {tld} </p>
                </div>

                <input
                    type="text"
                    value={record}
                    placeholder='Description'
                    onChange={e => setRecord(e.target.value)}
                />
                {editing ? (
                    <div className="button-container">

                        <button className='cta-button mint-button' disabled={loading} onClick={updateDomain}>
                            Set record
                        </button>

                        <button className='cta-button mint-button' onClick={() => { setEditing(false) }}>
                            Cancel
                        </button>
                    </div>
                ) : (

                    <button className='Mint-btn' disabled={loading} onClick={mintDomain}>
                        Mint
                    </button>
                )}
            </div>

        );
    }

    useEffect(() => {
        checkIfWalletIsConnected();
    }, [])

    const mintDomain = async () => {

        if (!domain) { return }

        if (domain.length < 3) {
            alert('Domain must be at least 3 characters long');
            return;
        }

        const price = domain.length === 3 ? '0.5' : domain.length === 4 ? '0.3' : '0.1';
        console.log("Minting domain", domain, "with price", price);
        try {
            const { ethereum } = window;
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(Contract_Address, contractAbi.abi, signer);
                const onDomainMinted = async (name, tokenId) => {
                    alert(`Your domain has been minted at https://testnets.opensea.io/assets/mumbai/${Contract_Address}/${tokenId}`);
                };
                

                console.log("Going to pop wallet now to pay gas...")
                let tx = await contract.Register(domain, { value: ethers.utils.parseEther(price) });

                const receipt = await tx.wait();


                if (receipt.status === 1) {
                    console.log("Domain minted! https://mumbai.polygonscan.com/tx/" + tx.hash);


                    tx = await contract.setRecord(domain, record);
                    await tx.wait();

                    console.log("Record set! https://mumbai.polygonscan.com/tx/" + tx.hash);

                    setRecord('');
                    setDomain('');
                }
                else {
                    alert("Transaction failed! Please try again");
                }
            }
        }
        catch (error) {
            console.log(error);
        }
    }

    const updateDomain = async () => {
        if (!record || !domain) { return }
        setLoading(true);
        console.log("Updating domain", domain, "with record", record);
        try {
            const { ethereum } = window;
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(Contract_Address, contractAbi.abi, signer);

                let tx = await contract.setRecord(domain, record);
                await tx.wait();
                console.log("Record set https://mumbai.polygonscan.com/tx/" + tx.hash);

                fetchMints();
                setRecord('');
                setDomain('');
            }
        } catch (error) {
            console.log(error);
        }
        setLoading(false);
    }



    const fetchMints = async () => {
        try {
            const { ethereum } = window;
            if (ethereum) {

                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(Contract_Address, contractAbi.abi, signer);


                const names = await contract.getAllNames();


                const mintRecords = await Promise.all(names.map(async (name) => {
                    const mintRecord = await contract.records(name);
                    const owner = await contract.domains(name);
                    return {
                        id: names.indexOf(name),
                        name: name,
                        record: mintRecord,
                        owner: owner,
                    };
                }));

                console.log("MINTS FETCHED ", mintRecords);
                setMints(mintRecords);
            }
        } catch (error) {
            console.log(error);
        }
    }
    useEffect(() => {
        if (network === 'Polygon Mumbai Testnet') {
            fetchMints();
        }
    }, [currentAccount, network]);




    const renderMints = () => {
        if (currentAccount && mints.length > 0) {
            return (
                <div className="mint-container">
                    <p className="subtitle"> Recently minted domains!</p>
                    <div className="mint-list">
                        {mints.map((mint, index) => {
                            return (
                                <div className="mint-item" key={index}>
                                    <div className='mint-row'>
                                        <a className="link" href={`https://testnets.opensea.io/assets/mumbai/${Contract_Address}/${mint.id}`} target="_blank" rel="noopener noreferrer">
                                            <p className="underlined">{' '}{mint.name}{tld}{' '}</p>
                                        </a>
                                        {/* If mint.owner is currentAccount, add an "edit" button*/}
                                        {mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
                                            <button className="edit-button" onClick={() => editRecord(mint.name)}>
                                                <img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
                                            </button>
                                            :
                                            null
                                        }
                                    </div>
                                    <p> {mint.record} </p>
                                </div>)
                        })}
                    </div>
                </div>);
        }
    };

    const editRecord = (name) => {
        console.log("Editing record for", name);
        setEditing(true);
        setDomain(name);
    }

    useEffect(() => {
        checkIfWalletIsConnected();
    }, []);


    useEffect(() => {
        if (network === 'Polygon Mumbai Testnet') {
            fetchMints();
        }
    }, [currentAccount, network]);
    return (
        <div>

            <div className="header-container">
                <header>
                    <div className="left">
                       

        <p className="title">Quasar Name Services</p>
                        <p className="subtitle">Register your cool domain in Web3 </p> 
                    </div>

                    <div className="right">
                        <img alt="Network logo" className="logo" src={network.includes("Polygon") ? ethLogo : polygonLogo} />
                        {currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p>}
                    </div>
                </header>
            </div>


            {!currentAccount && walletConnect()}
            {currentAccount && InputForm()}
            {mints && renderMints()}




        </div>

    );

}

export default Metamask