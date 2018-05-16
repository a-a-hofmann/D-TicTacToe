import React, {Component} from 'react';
import {connect} from 'react-redux';
import {fireGameStarted, watchForGameStartedEvent, watchForUpdatesInCurrentGame, addGame, 
    fetchGames, getGame, instantiateTicTacToeContract, playerMove, joinGame, updateGame, getContractOwner,
    web3connect, setDefaultAccount, getAccounts, getFeeAndCommission, watchForGameWonEvents, defaultHostname}
    from './actions';
import Board from './components/Board';
import MiniBoard from './components/MiniBoard';
import AccountSelect from './components/AccountSelect';
import CurrentGameInformation from './components/CurrentGameInformation';
import { CurrencyUnitSelect, WEI, ETHER } from './components/CurrencyUnitSelect';
import Header from './components/Header';

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

const ALL = 'ALL';
export const BET = 'BET';
const BET_N_ONGOING = 'BET_N_ONGOING';
export const ONGOING = 'ONGOING';
export const DONE = 'DONE';
const MY_GAMES = 'MY_GAMES';

export const gameStatuses = {
    ALL: 'All',
    MY_GAMES: 'My games',
    BET: 'Bet',
    BET_N_ONGOING: 'Bet & ongoing',
    ONGOING: 'Ongoing',
    DONE: 'Game over',
};

const TAB_RANKING = 'RANKING';
const TAB_RANKING_BY_ETHER = 'RANKING_BY_ETHER';
const TAB_GAMES = 'GAMES';
const TAB_HISTORY = 'HISTORY';

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            textarea: '',
            status: BET_N_ONGOING,
            currencyUnit: ETHER,
            amountToBet: 0,
            activeTab: TAB_GAMES,
            activeGame: -1,
            nodeName: defaultHostname,
        };

        this
            .handleTextAreaChange
            .bind(this);
        this
            .handleSelectChange
            .bind(this);
        this.selectChange = this.selectChange.bind(this);
    }

    componentDidMount() {
        // Get network provider and web3 instance. See actions/index.js => web3connect
        // for more info.
        window.addEventListener('load', () => this.init());
    }

    init(hostname = defaultHostname) {
        console.log()
        try {
            this.props.web3connect(hostname);

            this.props.getAccounts();

            this.props
                .instantiateTicTacToeContract()
                .then(() => this.props.fetchGames())
                .then(() => this.watchForNewGames())
                .then(() => this.watchForGameStartedEvent())
                .then(() => {
                    this.props.getContractOwner();
                    this.props.getFeeAndCommission();
                    this.watchForAccountsChanges();
                    this.props.watchForGameWonEvents();
                });
        } catch(error) {
            console.log(error);
        }
        this.setState({nodeName: hostname});
    }

    watchForAccountsChanges() {
        const self = this;
        setInterval(function () {
            self.props.getAccounts();
        }, 500);
    }

    watchForNewGames() {
        const ticTacToeContract = this.props.ticTacToeContract;

        const blockNumber = 0;
        console.log("Registering for 'New Game' events, starting from block number: " + blockNumber);
        const newGameEvent = ticTacToeContract.NewGame({fromBlock: blockNumber});
        newGameEvent.watch((error, result) => {
            if (!error) {
                this.props.fetchGames();
            }
        });
    }

    watchForUpdatesInCurrentGame() {
        const gameUpdateEvent = this.props.watchForUpdatesInCurrentGame();

        gameUpdateEvent.watch((error, result) => {
            if(!error) {
                const {gameId, board, whoseTurn, winner} = result.args;
                this.props.updateGame(gameId, board, whoseTurn, winner);
            }
        });
    }

    watchForGameStartedEvent() {
        const self = this;
        const gameStartedEvent = this.props.watchForGameStartedEvent();
        gameStartedEvent.watch((error, result) => {
            if(!error) {
                const gameId = result.args.gameId.toNumber();
                self.props.fireGameStarted(gameId);
            
                if (this.props.currentGame && gameId === this.props.currentGame.id.toNumber()) {
                    self.getGame(gameId);
                }
            }
        });
    }

    currentAccount() {
        return this.props.defaultAccount;
    }

    handleTextAreaChange(event) {
        this.setState({textarea: event.target.value});
    }

    handleSelectChange(event) {
        this.setState({status: event.target.value});
    }

    playerAddressXOrLabel(game) {
        return this.isOwnAccount(game.playerX) ? 'YOU' : game.playerXEllipsis;
    }

    playerAddressYOrLabel(game) {
        return game.hasOpponent() ? (this.isOwnAccount(game.playerY) ? 'YOU' : game.playerYEllipsis) : '-';
    }

    isOwnAccount(otherAccount) {
        return this.currentAccount() === otherAccount;
    }

    renderGames(games) {
        const activeGame = this.state.activeGame;
        return games
            .filter(game => this.gameFilter(game))
            .map((game, i) => {
                const rowClass = (activeGame.toString() === game.id.toString() ? 'table-primary' : '');
                const buttonClass = 'btn btn-primary' + (!this.isGameJoinable(game) ? ' disabled' : '');
                return (
                    <tr key={game.id} className={rowClass}>
                        <th scope="row">
                            {game.id.toString()}
                        </th>
                        <td alt={game.playerX}>{this.playerAddressXOrLabel(game)}</td>
                        <td alt={game.playerY}>{this.playerAddressYOrLabel(game)}</td>
                        <td>{game
                            .betAsEther
                            .toString()}
                            Ξ ({game.totalBetAsEther.toString()}Ξ)
                        </td>
                        <td>{game.status}</td>
                        <td>{(game.fee ? `${game.fee.toString()}%` : '-')} {game.fee ? `${game.commissions}Ξ` : ''}</td>
                        <td>
                            <button
                                className={buttonClass}
                                disabled={!this.isGameJoinable(game)}
                                onClick={() => this.joinGame(game, game.bet)}>Join
                            </button>
                        </td>
                        <td>
                            <button className={"btn"} onClick={() => this.getGame(game.id)}>View</button>
                        </td>
                    </tr>
                )
            })
    }

    isGameJoinable(game) {
        return this.currentAccount() !== game.playerX && game.isGameInBettingPhase();
    }

    getGame(gameId) {
        this.setState({activeGame: gameId});
        this.props.getGame(gameId).then(() => this.watchForUpdatesInCurrentGame());
    }

    joinGame(game, bet) {
        if (this.isGameJoinable(game)) {
            this.setState({activeGame: game.id});
            const isUsingInjectedWeb3 = this.props.isUsingInjectedWeb3;
            if (isUsingInjectedWeb3 || confirm(`Are you sure you want to bet ${bet.dividedBy(1e18).toString()} ether?`)) {
                this
                    .props
                    .joinGame(game.id, bet)
                    .then(result => {
                        this.props.fetchGames();
                        this.getGame(game.id);
                    }).catch(error => {
                        console.log(error);
                    });
            }
        }
    }

    gameFilter(game) {
        const status = this.state.status;
        if (this.allFilter(status)) {
            return true;
        } else if (this.isBetAndOngoing(status, game)) {
            return this.betAndOngoingFilter(game);
        } else if (this.isMyGames(status)) {
            return this.myGamesFilter(game);
        }

        return game.checkStatus(status)
    }

    allFilter = (status) => status === ALL;
    isBetAndOngoing = (status, game) => status === BET_N_ONGOING;
    betAndOngoingFilter = game => game.checkStatus(BET) || game.checkStatus(ONGOING);
    isMyGames = (status) => status === MY_GAMES;
    myGamesFilter = (game) => !!game.playerName(this.currentAccount());

    createGame() {
        const amountToBet = this.getBetAmountInWei();
        const isUsingInjectedWeb3 = this.props.isUsingInjectedWeb3;

        if (isUsingInjectedWeb3 || confirm(`Are you sure you want to bet ${this.getBetAmountInEther()} ether?`)) {
            this
                .props
                .addGame(amountToBet)
                .then((results) => {
                    this.props.fetchGames();
                    const gameId = results.logs[0].args.gameId;
                    this.getGame(gameId);
                });
        }
    }

    getBetAmountInWei() {
        const unit = this.state.currencyUnit;
        let amountToBet = this.state.amountToBet;
        if (unit === ETHER) {
            amountToBet *= 1e18;
        }
        return amountToBet;
    }

    getBetAmountInEther() {
        const unit = this.state.currencyUnit;
        let amountToBet = this.state.amountToBet;
        if (unit === WEI) {
            amountToBet /= 1e18;
        }
        return amountToBet;
    }

    onBetAmountChange(event) {
        this.setState({amountToBet: event.target.value});
    }

    selectChange(value) {
        this.props.setDefaultAccount(value.target.value);
    }

    currencyUnitChange(event) {
        const unit = event.target.value;
        this.setState({
            currencyUnit: unit
        });
    }

    isContractOwner() {
        return this.currentAccount() === this.props.owner;
    }

    withdrawFundsClicked() {
        this.props.withdrawFunds();
    }

    renderAmountToBetLabel() {
        const {commissionsEnabled, fee} = this.props;

        if (commissionsEnabled) {
            return (
                <label htmlFor="bet-amount">Amount to bet (<strong>all bets are subject to a {fee}% commission</strong>):</label>
            );    
        } else {
            return (
                <label htmlFor="bet-amount">Amount to bet:</label>
            );
        }
    }

    getBalance() {
        this.props.getBalance().then(balance => {
            const etherBalance = balance.dividedBy(1e18);
            alert(`The contract's balance is: ${etherBalance.toString()} ether.`);
        });
    }

    hostnamePrompt() {
        const newHostname = prompt('Enter hostname: ', 'http://127.0.0.1:7545');
        this.setState({nodeName: defaultHostname});
        this.init(newHostname);
    }

    selectActiveTab(tab) {
        if (this.props.currentGame || tab === TAB_GAMES || tab === TAB_RANKING || tab === TAB_RANKING_BY_ETHER) {
            this.setState({activeTab: tab});    
        } else {
            this.setState({activeTab: TAB_GAMES});
        }
    }

    getRankingTable() {
        let ranking;
        if (this.state.activeTab === TAB_RANKING_BY_ETHER) {
            ranking = this.props.rankingByAmountWon;
        } else {
            ranking = this.props.ranking
        }
        
        return this.renderRankingTable(ranking);
    }

    renderRankingTable(ranking) {
        if (ranking) {
            ranking = Object.keys(ranking).map(prop => [prop, ranking[prop].toString()]);
            ranking.sort((a, b) => a[1] < b[1] ? 1 : -1);

            return ranking.map(item => {
                const [address, score] = item;
                return (
                    <tr key={address}>
                        <td>{address}</td>
                        <td style={{textAlign: 'right'}}>{score}</td>
                    </tr>
                )
            });
        }
    }

    render() {
        const activeTab = this.state.activeTab;
        return (
            <div className="App">
                <Header onHostNamePressed={() => this.hostnamePrompt()}/>

                {!this.props.web3 && 
                    <main className="container">
                        <div className="pure-g">
                            <div className="pure-u-1-1">
                                <FailedToConnectAlert hostname={this.state.nodeName}/>
                            </div>
                        </div>
                    </main>
                }

                {this.props.web3 &&
                <main className="container">
                    <div className="pure-g">
                        <div className="pure-u-1-1">
                            <h1>Tic Tac Toes</h1>

                            <AccountSelect accounts={this.props.accounts} onSelectChange={this.selectChange}/>

                            <div className="row">

                                <div className="col-md-6">
                                    <div className="form-group">
                                        {this.renderAmountToBetLabel()}
                                        <div className="input-group mb-3">
                                            <input type="text" id="bet-amount" className="form-control"
                                                   placeholder="Amount in wei..."
                                                   aria-label="Recipient's username" aria-describedby="basic-addon2"
                                                   onChange={(event) => this.onBetAmountChange(event)}
                                                   value={this.state.amountToBet}/>
                                            <div className="input-group-append">
                                                <button className="btn btn-primary" type="button"
                                                        onClick={() => this.createGame()}>Create game
                                                </button>
                                            </div>
                                        </div>
                                        <p>Amount in Ξ: {this.getBetAmountInEther()}</p>
                                    </div>
                                </div>

                                <CurrencyUnitSelect containerClass={"col-md-3"} value={this.state.currencyUnit} onUnitChange={(event) => this.currencyUnitChange(event)}/>

                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="bet-amount">Show game:</label>
                                        <div className="input-group mb-3">
                                            <select
                                                className="custom-select"
                                                value={this.state.status}
                                                onChange={(event) => this.handleSelectChange(event)}>
                                                {Object.keys(gameStatuses)
                                                    .map(val => <option key={val} value={val}>{gameStatuses[val]}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr />

                            <div className="row">

                                <div className="col-md-6">
                                    <ul className="nav nav-pills mb-3" id="pills-tab" role="tablist">
                                        <li className="nav-item dropdown">
                                            <a className={"nav-link dropdown-toggle" + ( (activeTab === TAB_RANKING) || (activeTab === TAB_RANKING_BY_ETHER) ? ' active' : '')} data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">Ranking</a>
                                            <div className="dropdown-menu">
                                                <a className="dropdown-item" href="#ranking-ether" onClick={() => this.selectActiveTab(TAB_RANKING_BY_ETHER)}>By ether won</a>
                                                <a className="dropdown-item" href="#ranking-wins" onClick={() => this.selectActiveTab(TAB_RANKING)}>By wins</a>
                                            </div>
                                        </li>

                                        <li className={"nav-item"} onClick={() => this.selectActiveTab(TAB_GAMES)}>
                                            <a className={"nav-link" + (activeTab === TAB_GAMES ? ' active' : '')} data-toggle="pill" role="tab" href="#games">Games</a>
                                        </li>
                                        <li className={"nav-item"} onClick={() => this.selectActiveTab(TAB_HISTORY)}>
                                            <a className={"nav-link" + (!!this.props.currentGame ? (activeTab === TAB_HISTORY ? ' active' : '') : ' disabled')} data-toggle="pill" role="tab" href="#history">History</a>
                                        </li>
                                    </ul>

                                    <div className="tab-content" id="pills-tabContent">
                                        {(activeTab === TAB_RANKING || activeTab === TAB_RANKING_BY_ETHER) &&
                                            <div className={"tab-pane fade show active"} role="tabpanel">
                                                <table className="table table-hover">
                                                <thead>
                                                <tr>
                                                    <th scope="col">Address</th>
                                                    <th scope="col" style={{textAlign: 'right'}}>{(activeTab === TAB_RANKING ? 'Wins' : 'Ether won')}</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {this.getRankingTable()}
                                                </tbody>
                                            </table>
                                        </div>
                                        }

                                        {activeTab === TAB_GAMES &&
                                            <div className={"tab-pane fade show active"} role="tabpanel">
                                                <table className="table table-hover">
                                                <thead>
                                                <tr>
                                                    <th scope="col">ID</th>
                                                    <th scope="col">Player X</th>
                                                    <th scope="col">Player O</th>
                                                    <th scope="col">Bet</th>
                                                    <th scope="col">Status</th>
                                                    <th scope="col">Fee?</th>
                                                    <th scope="col"></th>
                                                    <th scope="col"></th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {this.renderGames(this.props.games)}
                                                </tbody>
                                            </table>
                                        </div>
                                        }

                                        {this.props.currentGame && activeTab === TAB_HISTORY &&
                                        <div className={"tab-pane fade show active"} role="tabpanel">
                                        <hr />
                                            <div className="game" style={{paddingLeft: '10%', paddingTop: '5%'}}>
                                                <MiniBoard />
                                            </div>
                                        </div>
                                        }

                                    </div>
                                </div>

                                {this.props.currentGame &&
                                <div className="col-md-5 offset-md-1">
                                    <CurrentGameInformation currentAccount={this.currentAccount()} currentGame={this.props.currentGame} />
                                    <div className="game">
                                        <Board playerMove={this.props.playerMove}/>
                                    </div>
                                </div>
                                }
                            </div>
                        </div>
                    </div>
                </main>
                }
            </div>
        );
    }
}

const FailedToConnectAlert = ({hostname}) => {
    return (
        <div className="alert alert-danger" style={{paddingTop: '1em'}} role="alert">
            Failed to connect to the node @ {hostname}
        </div>
    )
}

const mapDispatchToProps = {
    web3connect,
    instantiateTicTacToeContract,
    fetchGames,
    getGame,
    addGame,
    playerMove,
    joinGame,
    updateGame,
    watchForUpdatesInCurrentGame,
    watchForGameStartedEvent,
    setDefaultAccount,
    fireGameStarted,
    getAccounts,
    getFeeAndCommission,
    watchForGameWonEvents,
    getContractOwner
};

const mapStateToProps = (state) => (
    {
        web3: state.web3,
        games: state.games,
        ticTacToeContract: state.ticTacToeContract,
        currentGame: state.currentGame,
        owner: state.owner,
        defaultAccount: state.defaultAccount,
        commissionsEnabled: state.commissionsEnabled,
        fee: state.fee,
        isUsingInjectedWeb3: state.isUsingInjectedWeb3,
        accounts: state.accounts,
        ranking: state.rankingByWins,
        rankingByAmountWon: state.rankingByAmountWon,
    });

export default connect(mapStateToProps, mapDispatchToProps)(App);
