import React, {Component} from 'react'

import {quitGame, playerMove, fetchGames, getGame} from '../actions';
import {connect} from 'react-redux';
import Loadable from 'react-loading-overlay';

import './Board.css';

class Board extends Component {

    constructor(props) {
        super(props);
        this.state = {
            squares: Array(9).fill(null),
            account: '',
            gameLoading: {},
        }
    }

    componentWillMount() {
        this.watchForAccountChanges();
    }

    watchForAccountChanges() {
        const self = this;
        setInterval(function () {
            const currentAccount = self.props.web3.eth.defaultAccount;
            const prevAccount = self.state.account;
            if (prevAccount !== currentAccount) {
                self.setState({account: currentAccount})
            }
        }, 500);
    }

    handleClick(i) {
        const currentGame = this.props.currentGame;

        // Game finished or cell already filled.
        if (currentGame.isGameOver() || currentGame.isCellOccupied()) {
            return;
        }

        let gameLoading = Object.assign({}, this.state.gameLoading);
        gameLoading[currentGame.id] = true;
        this.setState({gameLoading});

        this.props.playerMove(currentGame.id, i)
            .finally(() => {

                gameLoading = Object.assign({}, this.state.gameLoading);
                gameLoading[currentGame.id] = false;
                this.setState({gameLoading});
            });
    }

    
    
    renderSquare(i) {
        return (
            <Square
            value={this.props.currentGame.boardView[i]}
            onClick={() => this.handleClick(i)}
            />
        );
    }

    quit(isSpectator) {
        if (!isSpectator && confirm("Are you sure you want to forfeit the game?")) {
            const gameId = this.props.currentGame.id;
            this.props.quitGame()
            .then(result => {
                alert("You forfeited this game...");
                this.props.fetchGames();
                this.props.getGame(gameId);
            })
            .catch(error => {
                alert("Failed to quit game, please try again.");
                console.log(error);
            });
        }
    }

    renderStatus() {
        const currentGame = this.props.currentGame;
        const isDraw = currentGame.isDraw();
        const winner = currentGame.calculateWinner();
        const isOver = currentGame.isGameOver();

        let status;
        let statusClass = 'status';

        if (winner) {
            statusClass += ' status-win';
            status = `Winner: ${winner}`;
        } else if (isDraw) {
            statusClass += ' status-draw';
            status = `Draw`;
        } else if (isOver && !winner && !isDraw) {
            statusClass += ' status-draw';
            status = `Game Over`;
        } 
        else {
            const currentAccount = this.state.account;
            const currentPlayer = currentGame.playerName(currentAccount);
            status = `${currentGame.whoseTurnIsIt === currentPlayer ? `Your turn, player ${currentPlayer}`: 'Opponent turn'}`
        }
          return (
            <div className={statusClass}>{status}</div>
          );
    }
    
    render() {
        const isSpectator = !this.props.currentGame.playerName(this.props.currentAccount);
        const loading = this.state.gameLoading[this.props.currentGame.id];
        return (
            <div>
                {this.renderStatus()}
                <Loadable
                    active={loading}
                    spinner
                    text=''
                    >
                    <table className="game-board">
                    <tbody>
                        <tr className="board-row">
                        {this.renderSquare(0)}
                        {this.renderSquare(1)}
                        {this.renderSquare(2)}
                        </tr>
                        <tr className="board-row">
                        {this.renderSquare(3)}
                        {this.renderSquare(4)}
                        {this.renderSquare(5)}
                        </tr>
                        <tr className="board-row">
                        {this.renderSquare(6)}
                        {this.renderSquare(7)}
                        {this.renderSquare(8)}
                        </tr>
                    </tbody>
                    </table>
                </Loadable>
                <p className={"restart " + (isSpectator ? 'disabled' : '')} onClick={() => this.quit(isSpectator)}>Quit</p>
          </div>
        );
    }
}

const Square = (props) => {
    return (
        <td className="square" onClick={props.onClick}>
            {props.value}
        </td>
    )
}

const mapDispatchToProps = {
    playerMove,
    quitGame,
    fetchGames,
    getGame
};

const mapStateToProps = (state) => (
    {
        currentGame: state.currentGame,
        web3: state.web3,
        currentAccount: state.web3.eth.defaultAccount
    });

export default connect(mapStateToProps, mapDispatchToProps)(Board);