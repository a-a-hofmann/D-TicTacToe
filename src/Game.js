import BigNumber from 'bignumber.js';
import { BET, ONGOING, DONE } from './App';

const PLAYER_X = 'X';
const PLAYER_O = 'O';

export const ADDRESS_0_FULL = '0x0000000000000000000000000000000000000000';
const ADDRESS_0_SHORT = '0x0';

class Game {

    constructor(id, playerX, playerY, bet, status, fee, board, winner) {
        if (id) {
            this.id = new BigNumber(id);
        }
        this.playerX = playerX;
        this.playerY = (playerY === ADDRESS_0_FULL) ? ADDRESS_0_SHORT : playerY;

        if (bet) {
            this.bet = new BigNumber(bet);
        }

        if (fee) {
            this.fee = fee.toNumber();
        }
        this.whoseTurn = playerX;
        this.board = board;

        if (status && status.equals(new BigNumber(0))) {
            this.status = BET;
        } else if (status && status.equals(new BigNumber(1))) {
            this.status = ONGOING;
        } else {
            this.status = DONE;
        }

        this.winner = winner;
    }

    calculateWinner() {
        if (this.winner !== ADDRESS_0_FULL) {
            return this.playerName(this.winner);
        } else {
            const lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
            ];
            
            const board = this.boardView;
            for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
            }
            return null;
        }
    }

    playerName(address) {
        if (address === this.playerX) {
            return PLAYER_X;
        } else if (address === this.playerY) {
            return PLAYER_O;
        }
        return null;
    }

    get whoseTurnIsIt() {
        return this.whoseTurn === this.playerX ? PLAYER_X : PLAYER_O
    }

    get betAsEther() {
        return this.bet.div(1e18);
    }

    get totalBetAsEther() {
        return this.bet.div(1e18).mul(2);
    }

    get commissions() {
        if (!this.fee) return "";
        return this.bet.mul(2).div(1e18).mul(this.fee / 100).toString();
    }

    hasOpponent() {
        return this.playerY !== ADDRESS_0_SHORT;
    }

    checkStatus(status) {
        return status === this.status;
    }

    isGameInBettingPhase() {
        return this.status === BET;
    }

    isGameOver() {
        return this.status === DONE;
    }

    isDraw() {
        return this.boardView.every((element) => {
            return element !== '';
        });
    }

    isCellOccupied(index) {
        return !!this.boardView[index]
    }

    get playerXEllipsis() {
        return `${this.playerX.substring(0, 5)}...${this.playerX.substring(this.playerX.length - 3)}`
    }

    get playerYEllipsis() {
        return `${this.playerY.substring(0, 5)}...${this.playerY.substring(this.playerY.length - 3)}`
    }

    get boardView() {
        let board = this.board.slice();
        for (let i = 0; i < board.length; i++) {
            if (board[i] === this.playerX) {
                board[i] = PLAYER_X;
            } else if (board[i] === this.playerY) {
                board[i] = PLAYER_O;
            } else {
                board[i] = '';
            }
        }
        return board;
    }
}

export default Game;