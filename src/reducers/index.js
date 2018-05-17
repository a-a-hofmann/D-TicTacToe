import {
    defaultState,
    TICTACTOE_CONTRACT_INSTANTIATED,
    TICTACTOE_FETCHED,
    TICTACTOE_RETRIEVED_GAME,
    CURRENT_GAME_UPDATE,
    WEB3_CONNECTED,
    GAME_UPDATE_EVENT_LISTENER_CREATED,
    GAME_STARTED_EVENT,
    DEFAULT_ACCOUNT_CHANGE,
    CONTRACT_OWNER_FETCHED,
    COMMISSIONS_ENABLED,
    COMMISSIONS_DISABLED,
    ACCOUNTS_FETCHED,
    GAME_WON
} from '../actions';
import Game from '../Game.js';
import { ADDRESS_0_FULL } from '../Game';
import { ONGOING, DONE } from '../App';
import _ from 'underscore';

const games = (state = defaultState, action) => {
    switch (action.type) {
        case WEB3_CONNECTED:
            const web3 = action.payload;
            web3.eth.defaultAccount = web3.eth.accounts[0];
            return {
                ...state,
                web3: web3,
                defaultAccount: web3.eth.accounts[0],
                isUsingInjectedWeb3: action.isUsingInjectedWeb3
            };
        case TICTACTOE_CONTRACT_INSTANTIATED:
            console.log("TicTacToe contract instantiated");
            return {
                ...state,
                ticTacToeContract: action.payload
            };
        case TICTACTOE_FETCHED:
            let payload = action.payload.map(game => new Game(game[0], game[1], game[2], game[3], game[4], game[5], game[6]));
            return {
                ...state,
                games: payload
            };
        case TICTACTOE_RETRIEVED_GAME:
            payload = action.payload;
            const game = new Game(payload[0], payload[1], payload[2], payload[3], payload[4], payload[5], payload[6]);
            let updatedGames = updateGames(state.games, game);
            return {
                ...state,
                games: updatedGames,
                currentGame: game
            };
        case GAME_STARTED_EVENT:
            const gameStartedId = action.gameId;
            const games = state.games.slice();
            if (gameStartedId < games.length) {
                games[gameStartedId].status = ONGOING;
            }
            return {
                ...state,
                games: games
            }
        case CURRENT_GAME_UPDATE:
            const currentGame = state.currentGame;
            const updatedGame = Object.assign(new Game(), currentGame);
            updatedGame.board = action.board;
            updatedGame.whoseTurn = action.whoseTurn;
            updatedGame.winner = action.winner;
            updatedGame.status = (action.winner === ADDRESS_0_FULL ? (updatedGame.isDraw() ? DONE : currentGame.status) : DONE);
            if (currentGame.history) {
                updatedGame.history.push(updatedGame.board);
            } else {
                updatedGame.history = [[], updatedGame.board];
            }

            updatedGames = updateGames(state.games, updatedGame);

            return {
                ...state,
                games: updatedGames,
                currentGame: updatedGame
            };
        case GAME_UPDATE_EVENT_LISTENER_CREATED:
            return {
                ...state,
                gameUpdateEvent: action.gameUpdateEvent
            }
        case DEFAULT_ACCOUNT_CHANGE:
            const web3Clone = Object.assign({}, state.web3);
            web3Clone.eth.defaultAccount = state.web3.eth.accounts[action.account];
            return {
                ...state,
                web3: web3Clone,
                defaultAccount: state.web3.eth.accounts[action.account],
            }
        case CONTRACT_OWNER_FETCHED:
            const owner = action.owner;
            return {
                ...state,
                owner
            }
        case COMMISSIONS_DISABLED:
            return {
                ...state,
                commissionsEnabled: false,
                fee: action.fee,
            }
        case COMMISSIONS_ENABLED:
            return {
                ...state,
                commissionsEnabled: true,
                fee: action.fee,
            }
        case ACCOUNTS_FETCHED:
            if (_.isEqual(action.accounts, state.accounts)) {
                return state;
            }

            return {
                ...state,
                accounts: action.accounts
            }
        case GAME_WON:
            const rankingByWins = Object.assign({}, state.rankingByWins);
            const rankingByAmountWon = Object.assign({}, state.rankingByAmountWon);
            const winningsInEther = action.winnings.dividedBy(1e18).toNumber();
            if (rankingByWins[action.winner]) {
                rankingByWins[action.winner] += 1;
                rankingByAmountWon[action.winner] += winningsInEther;
            } else {
                rankingByWins[action.winner] = 1;
                rankingByAmountWon[action.winner] = winningsInEther;
            }
            return {
                ...state,
                rankingByWins,
                rankingByAmountWon                
            }
        default:
            return {
                ...state,
            }
    }
};

function updateGames(games, game) {
    games = games.slice();
    const index = game.id;
    games[index] = game;
    return games;
}

export default games;