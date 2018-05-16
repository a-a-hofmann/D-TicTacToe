import Web3 from 'web3';
import contract from 'truffle-contract';
import TicTacToeContract from '../../build/contracts/TicTacToe.json';
import BigNumber from 'bignumber.js';
export const WEB3_CONNECTED = 'WEB3_CONNECTED';
export const WEB3_DISCONNECTED = 'WEB3_DISCONNECTED';
export const TICTACTOE_CONTRACT_INSTANTIATED = 'TICTACTOE_CONTRACT_INSTANTIATED';
export const TICTACTOE_FETCHED = 'TICTACTOE_FETCHED';
export const TICTACTOE_GAME_ADDED = 'TICTACTOE_GAME_ADDED';
export const TICTACTOE_GAME_JOINED = 'TICTACTOE_GAME_JOINED';
export const TICTACTOE_RETRIEVED_GAME = 'TICTACTOE_RETRIEVED_GAME';
export const CURRENT_GAME_UPDATE = 'CURRENT_GAME_UPDATE';
export const GAME_STARTED_EVENT = 'GAME_STARTED_EVENT';
export const GAME_UPDATE_EVENT_LISTENER_CREATED = 'GAME_UPDATE_EVENT_LISTENER_CREATED';
export const DEFAULT_ACCOUNT_CHANGE = 'DEFAULT_ACCOUNT_CHANGE';
export const CONTRACT_OWNER_FETCHED = 'CONTRACT_OWNER_FETCHED';
export const COMMISSIONS_ENABLED = 'COMMISSIONS_ENABLED';
export const COMMISSIONS_DISABLED = 'COMMISSIONS_DISABLED';
export const ACCOUNTS_FETCHED = 'ACCOUNTS_FETCHED';
export const GAME_WON = 'GAME_WON';

export const defaultState = {
  web3: null,
  games: [],
  commissionsEnabled: false,
  fee: 0,
  isUsingInjectedWeb3: false,
  accounts: [],
  defaultAccount: '',
  rankingByWins: {},
  rankingByAmountWon: {}
};

export const defaultHostname = 'http://localhost:7545';

export function web3connect(hostname = defaultHostname) {
  return (dispatch) => {
    const web3 = window.web3;

    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
      // Use Mist/MetaMask's provider.
      dispatch({
        type: WEB3_CONNECTED,
        payload: new Web3(web3.currentProvider),
        isUsingInjectedWeb3: true,
      });
    } else {
      dispatch({
        type: WEB3_CONNECTED,
        payload: new Web3(new Web3.providers.HttpProvider(hostname)),
        isUsingInjectedWeb3: false
      });
    }
  };
}

export function instantiateTicTacToeContract() {
    return (dispatch, getState) => {
        const web3 = getState().web3;
        const ticTacToe = contract(TicTacToeContract);
        ticTacToe.setProvider(web3.currentProvider);
        return ticTacToe.deployed().then((ticTacToeContract) => {
            dispatch({
                type: TICTACTOE_CONTRACT_INSTANTIATED,
                payload: ticTacToeContract
            });
        });
    }
}

export function fetchGames() {
    return (dispatch, getState) => {
        const state = getState();
        const ticTacToeContract = state.ticTacToeContract;
        ticTacToeContract.getGameCount().then((count) => {
            const gamePromises = [];
            for (let i = 0; i < count; i++) {
                gamePromises.push(ticTacToeContract.getGame(i));
            }

            Promise.all(gamePromises).then((games) => {
                dispatch({
                    type: TICTACTOE_FETCHED,
                    payload: games
                });
            });
        });
      };
}

export function getGame(gameId) {
    return (dispatch, getState) => {
        const state = getState();
        const ticTacToeContract = state.ticTacToeContract;
        return ticTacToeContract.getGame(gameId).then(game => {
            dispatch({
                type: TICTACTOE_RETRIEVED_GAME,
                payload: game
            })
        });
    }
}

export function addGame(amountToBet) {
    return (dispatch, getState) => {
        const web3 = getState().web3;
        const ticTacToeContract = getState().ticTacToeContract;
        
        const payload = {from: web3.eth.defaultAccount, value: amountToBet, gas: 300000};
        return ticTacToeContract.createGame(payload).then((results) => {
            dispatch({
                type: TICTACTOE_GAME_ADDED,
                results
            });
            return results;
        });
    };
}

export function joinGame(gameId, bet) {
    console.log("Joining game");
    return (dispatch, getState) => {
        const web3 = getState().web3;
        const ticTacToeContract = getState().ticTacToeContract;
        const payload = {from: web3.eth.defaultAccount, value: bet, gas: 300000};
        return ticTacToeContract.joinGame(gameId, payload).then(results => {
            console.log("Joined game");
        }).catch(error => {
            console.log(error);
        });
    }
}

export function currentAccount() {
    return (dispatch, getState) => getCurrentAccount(getState().web3);
}

function getCurrentAccount(web3) {
    return web3.eth.accounts[0];
}

export function playerMove(gameId, index) {
    return (displatch, getState) => {
        const web3 = getState().web3;
        const ticTacToeContract = getState().ticTacToeContract;
        console.log("Making a move, game: " + gameId.toString() + " index: " + index);
        return ticTacToeContract.playerMove(gameId, index, {from: web3.eth.defaultAccount, gas: 300000});
    }
}

export function updateGame(gameId, board, whoseTurn, winner) {
    return (dispatch, getState) => {
        dispatch({
            type: CURRENT_GAME_UPDATE,
            gameId: gameId,
            board: board,
            whoseTurn: whoseTurn,
            winner: winner
        })
    }
}

export function quitGame(gameId) {
    return (displatch, getState) => {
        const ticTacToeContract = getState().ticTacToeContract;
        const gameId = getState().currentGame.id;

        console.log("Quitting game:");
        console.log(gameId);
        return ticTacToeContract.rageQuit(gameId, {gas: 300000});
    }
}

export function watchForUpdatesInCurrentGame() {
    return (dispatch, getState) => {
        const currentGame = getState().currentGame;
        if (currentGame) {
            const ticTacToeContract = getState().ticTacToeContract;
            const blockNumber = 0;
            let gameUpdateEvent = getState().gameUpdateEvent;

            if (gameUpdateEvent) {
                console.log("Stop watching previous game.");
                gameUpdateEvent.stopWatching();    
            }
            
            console.log(`Registering for game update events ${new BigNumber(currentGame.id)}, starting from block number: ${blockNumber}`);
            gameUpdateEvent = ticTacToeContract.GameUpdateEvent({gameId: currentGame.id}, {fromBlock: 0});
    
            dispatch({
                type: GAME_UPDATE_EVENT_LISTENER_CREATED,
                gameUpdateEvent: gameUpdateEvent
            });

            return gameUpdateEvent;
        }
    }
}

export function watchForGameStartedEvent() {
    return (dispatch, getState) => {
        const ticTacToeContract = getState().ticTacToeContract;
        const gameStartedEvent = ticTacToeContract.GameStarted({}, {fromBlock: 'latest'});
        return gameStartedEvent;
    }
}

export function watchForGameWonEvents() {
    return (dispatch, getState) => {
        const ticTacToeContract = getState().ticTacToeContract;
        const gameWonEvent = ticTacToeContract.GameWon({}, {fromBlock: 0});
        
        gameWonEvent.watch((error, result) => {
            if(!error) {
                const winner = result.args.winner;
                const winnings = result.args.winnings;
                dispatch({
                    type: GAME_WON,
                    winner,
                    winnings,
                });
            }
        });
    }
}

export function fireGameStarted(gameId) {
    return (dispatch, getState) => {
        dispatch({
            type: GAME_STARTED_EVENT,
            gameId: gameId
        });
        return gameId;
    }
}

export function getAccounts() {
    return (dispatch, getState) => {
        const web3 = getState().web3;
        const accounts = web3.eth.accounts.slice().map(account => {
            return {
                address: account,
                balance: web3.eth.getBalance(account).dividedBy(1e18).toFixed(3).toString()
            }
        });
        dispatch({
            type: ACCOUNTS_FETCHED,
            accounts
        });
        //return accounts;
    }
}

export function setDefaultAccount(account) {
    return (dispatch, getState) => {
        dispatch({
            type: DEFAULT_ACCOUNT_CHANGE,
            account: account
        })
    }
}

export function getContractOwner() {
    return (dispatch, getState) => {
        const ticTacToeContract = getState().ticTacToeContract;
        ticTacToeContract.owner().then(owner => {
            dispatch({
                type: CONTRACT_OWNER_FETCHED,
                owner: owner
            });
        });
    }
}

export function enableCommissions() {
    return (dispatch, getState) => {
        const ticTacToeContract = getState().ticTacToeContract;
        getFee(ticTacToeContract).then((fee) => {
            const newFee = prompt('How high should the fee bee in %? (min: 0, max: 20)', fee);
            ticTacToeContract.setFee(newFee).then(() => {
                ticTacToeContract.enableCommissions().then(() => {
                    alert(`You enabled commissions. Contract will keep the: ${newFee}% of each bet.`);
                    dispatch({
                        type: COMMISSIONS_ENABLED,
                        fee: newFee,
                    });
                });
            })
        });
    }
}

export function getFeeAndCommission() {
    return async (dispatch, getState) => {
        const ticTacToeContract = getState().ticTacToeContract;
        if (ticTacToeContract) {
            const fee = await getFee(ticTacToeContract);
            const commissionEnabled = await isCommissionEnabled(ticTacToeContract);
            dispatch({
                type: commissionEnabled ? COMMISSIONS_ENABLED : COMMISSIONS_DISABLED,
                fee: fee.toString(),
            })
            return {fee, commissionEnabled};
        }
    }
}

function getFee(contract) {
    return contract.fee();
}

function isCommissionEnabled(contract) {
    return contract.commissionEnabled();
}

export function disableCommissions() {
    return (dispatch, getState) => {
        const ticTacToeContract = getState().ticTacToeContract;
        ticTacToeContract.disableCommissions().then(() => {
            alert(`You disabled commissions.`);
            dispatch({
                type: COMMISSIONS_DISABLED,
                fee: 0,
            });
        });
    }
}

export function getBalance() {
    return (dispatch, getState) => {
        const ticTacToeContract = getState().ticTacToeContract;
        return getBalanceToWithdraw(ticTacToeContract);
    }
}

function getBalanceToWithdraw(contract) {
    return contract.balance();
}

export function withdrawFunds() {
    return (dispatch, getState) => {
        const ticTacToeContract = getState().ticTacToeContract;
        getBalanceToWithdraw(ticTacToeContract)
        .then((balance) => {
            ticTacToeContract.withdraw().then(() => {
                const etherBalance = balance.dividedBy(1e18).toString();
                alert(`Withdrawn ${etherBalance} funds from contract balance!`);
            })
            .catch(error => {
                alert("No funds to withdraw");
            });
        });
    }
}