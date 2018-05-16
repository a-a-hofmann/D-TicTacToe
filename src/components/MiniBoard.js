import React, {Component} from 'react'

import {quitGame, playerMove, fetchGames, getGame} from '../actions';
import {connect} from 'react-redux'

import './MiniBoard.css';

class MiniBoard extends Component {

    constructor(props) {
        super(props);
        this.state = {
            squares: Array(9).fill(null),
            account: '',
            currentVersion: -1
        }
    }
    
    renderSquare(i, board) {
        return (
            <Square
            value={board[i]}
            onClick={() => this.handleClick(i)}
            />
        );
    }

    getCurrentVersion(history) {
        const currentVersionIndex = history.length - 1;
        return history[currentVersionIndex];
    }

    getHistoryVersion(history, index) {
        return history[index];
    }

    getGameBoard() {
        const currentGame = this.props.currentGame;
        const history = this.props.history;
        const currentVersion = this.state.currentVersion;

        let currentGameBoard;
        if (history) {
            currentGameBoard = currentVersion > -1 ? this.getHistoryVersion(history, currentVersion) : this.getCurrentVersion(history);
        } else {
            currentGameBoard = currentGame.boardView;
        }
        return currentGameBoard.map(address => currentGame.playerName(address));
    }

    getMoves() {
        const history = this.props.history;
        let moves = [];
        if (history) {
            moves = history.map((step, move) => {
            const desc = move ?
              'Show move #' + move :
              'Game start';
            return (
              <li key={move}>
                <button className="btn btn-outline-primary btn-sm" onClick={() => this.jumpTo(move)}>{desc}</button>
              </li>
            );
          });
        }
        return moves;
    }

    jumpTo(move) {
        this.setState({currentVersion: move});
    }
    
    render() {
        const currentGameBoard = this.getGameBoard();
        const moves = this.getMoves();
        return (
            <div className="row">
                <div className="col-md-4">
                    <table className="mini-game-board">
                    <tbody>
                        <tr className="mini-board-row">
                        {this.renderSquare(0, currentGameBoard)}
                        {this.renderSquare(1, currentGameBoard)}
                        {this.renderSquare(2, currentGameBoard)}
                        </tr>
                        <tr className="mini-board-row">
                        {this.renderSquare(3, currentGameBoard)}
                        {this.renderSquare(4, currentGameBoard)}
                        {this.renderSquare(5, currentGameBoard)}
                        </tr>
                        <tr className="mini-board-row">
                        {this.renderSquare(6, currentGameBoard)}
                        {this.renderSquare(7, currentGameBoard)}
                        {this.renderSquare(8, currentGameBoard)}
                        </tr>
                    </tbody>
                    </table>
                </div>

                <div className="col-md-2">
                    <div className="game-info">
                        <ul>{moves}</ul>
                    </div>
                </div>
          </div>
        );
    }
}

const Square = (props) => {
    return (
        <td className="mini-square" onClick={props.onClick}>
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
        currentAccount: state.web3.eth.defaultAccount,
        history: state.currentGame.history,
    });

export default connect(mapStateToProps, mapDispatchToProps)(MiniBoard);