pragma solidity ^0.4.21;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract TicTacToe is Ownable {

    enum Status {BET, ONGOING, DONE}

    struct Game {
        uint gameId;

        // Player X is always the creator of the game.
        address playerX;

        address playerY;

        // Bet. Creator determines bet that the opponent must match in order to start the game.
        uint bet;

        Status status;

        // Current player. TODO: change this to bool to save space.
        address whoseTurn;

        address[] board;

        // Fee in percentage of total.
        uint fee;

        address winner;
    }

    event GameStarted(uint gameId);

    event NewGame(uint gameId);

    event RageQuit(uint gameId, address quitter);

    event GameWon(uint gameId, address winner, uint winnings);

    event GameUpdateEvent(uint indexed gameId, address[] board, address whoseTurn, address winner);
    
    event GameDraw(uint gameId);

    Game[] public games;

    // Whether to charge a fee.
    bool public commissionEnabled = false;

    // Fee in percentage of total.
    uint public fee = 20;

    // Balance available to the owner for withdrawal.
    uint public balance;

    uint public constant MAX_FEE = 20;

    // When creating a game, the first player, the bet, and the status of the game are set.
    // Status is set to BET for the betting phase.
    function createGame() public payable {
        require(msg.value > 0);
        address[] memory _board = new address[](9);
        uint _fee = commissionEnabled ? fee : 0;
        uint gameId = games.push(Game(games.length, msg.sender, address(0), msg.value, Status.BET, msg.sender, _board, _fee, address(0))) - 1;
        emit NewGame(gameId);
    }

    function getGameCount() public view returns(uint) {
        return games.length;
    }

    // Returns a game. 'view' makes sure the function remains pure.
    function getGame(uint gameId) public view returns(uint id, address playerX, address playerY, uint bet, Status status, uint fee, address[] board) {
        require(gameId < games.length);
        return (games[gameId].gameId, games[gameId].playerX, games[gameId].playerY, games[gameId].bet, games[gameId].status, games[gameId].fee, games[gameId].board);
    }

    function getGameWinner(uint gameId) public view returns(address winner) {
        require(gameId < games.length);
        return games[gameId].winner;
    }

    // Join a game. Status is then set to ONGOING and an event is fired to warn the other player.
    function joinGame(uint gameId) public payable mayJoinGame(gameId) {
        games[gameId].playerY = msg.sender;
        games[gameId].status = Status.ONGOING;
        emit GameStarted(gameId);
    }

    // Quit game. If the game was still in the BETTING phase (i.e. no opponent yet), 
    // the creator of the game is refunded. Else the pot goes to the opponent.
    function rageQuit(uint gameId) public gameExists(gameId) isParticipating(gameId) {
        require(games[gameId].status == Status.BET || games[gameId].status == Status.ONGOING);
        
        uint bet = games[gameId].bet;
        address playerX = games[gameId].playerX;
        address playerY = games[gameId].playerY;

        if (games[gameId].status == Status.BET) {
            games[gameId].status = Status.DONE;
            payout(playerX, bet);
        } else {
            if (playerX == msg.sender) {
                // If player X quits, pay player O.
                gameOverWinnerCase(gameId, playerY);
                emit GameUpdateEvent(gameId, games[gameId].board, games[gameId].whoseTurn, playerY);
            } else {
                gameOverWinnerCase(gameId, playerX);
                emit GameUpdateEvent(gameId, games[gameId].board, games[gameId].whoseTurn, playerX);
            }
        }
    }

    function payout(address winner, uint amount) internal {
        winner.transfer(amount);
    }

    function playerMove(uint gameId, uint index) public gameExists(gameId) gameIsOngoing(gameId) isParticipating(gameId) checkInput(gameId, index) {
        games[gameId].board[index] = msg.sender;
        
        address winner = checkWinner(gameId);
        if (winner != address(0)) {
            gameOverWinnerCase(gameId, winner);
        } else if (checkDraw(gameId)) {
            gameOverDrawCase(gameId);
        } else {
            if (msg.sender == games[gameId].playerX) {
                games[gameId].whoseTurn = games[gameId].playerY;
            } else {
                games[gameId].whoseTurn = games[gameId].playerX;
            }
        }
        emit GameUpdateEvent(gameId, games[gameId].board, games[gameId].whoseTurn, winner);
    }

    function gameOverWinnerCase(uint gameId, address winner) internal {
        games[gameId].status = Status.DONE;
        games[gameId].winner = winner;
        uint winnings = games[gameId].bet * 2;
        if (games[gameId].fee > 0) {
            uint commission = winnings / 100 * games[gameId].fee;
            winnings = winnings - commission;
            balance = balance + commission;
        }
        payout(winner, winnings);
        emit GameWon(gameId, winner, winnings);
    }

    function gameOverDrawCase(uint gameId) internal {
        games[gameId].status = Status.DONE;
        uint winnings = games[gameId].bet;
        if (games[gameId].fee > 0) {
            uint commission = winnings / 100 * games[gameId].fee;
            winnings = winnings - commission;
            balance = balance + (2 * commission);
        }
        payout(games[gameId].playerX, winnings);
        payout(games[gameId].playerY, winnings);
        emit GameDraw(gameId);
    }

    function checkWinner(uint gameId) internal view returns(address winner) {
        address[] memory board = games[gameId].board;

        winner = checkPattern(board, 0, 1, 2);
        if (winner != address(0)) return winner;
        winner = checkPattern(board, 3, 4, 5);
        if (winner != address(0)) return winner;
        winner = checkPattern(board, 6, 7, 8);
        if (winner != address(0)) return winner;
        winner = checkPattern(board, 0, 3, 6);
        if (winner != address(0)) return winner;
        winner = checkPattern(board, 1, 4, 7);
        if (winner != address(0)) return winner;
        winner = checkPattern(board, 2, 5, 8);
        if (winner != address(0)) return winner;
        winner = checkPattern(board, 0, 4, 8);
        if (winner != address(0)) return winner;
        winner = checkPattern(board, 2, 4, 6);
        if (winner != address(0)) return winner;
        
        return address(0);
    }

    function checkPattern(address[] board, uint8 x, uint8 y, uint8 z) internal pure returns(address winner) {
        if (board[x] != address(0) && board[x] == board[y] && board[x] == board[z]) {
            return board[x];
        }
        return address(0);
    }

    function checkDraw(uint gameId) internal view returns(bool draw) {
        address[] memory board = games[gameId].board;
        draw = true;
        for(uint8 i = 0; i < board.length; ++i) {
            draw = draw && board[i] != address(0);
        }
        return draw;
    }

    // Is the sender of the message participating in the game.
    modifier isParticipating(uint gameId) {
        Game memory game = games[gameId];
        require(msg.sender == game.playerX || msg.sender == game.playerY);
        _;
    }

    modifier mayJoinGame(uint gameId) {
        // Game exists.
        require(gameId < games.length);
        
        // Game is in betting phase.
        Game memory gameToJoin = games[gameId];
        require(gameToJoin.status == Status.BET);
        
        // Game has empty seats.
        require(gameToJoin.playerY == address(0));

        // Check that the opponent is not the same as the creator of the game.
        address playerX = gameToJoin.playerX;
        require(playerX != msg.sender);

        // Check if the bet is sufficient in order to join the game.
        uint bet = gameToJoin.bet;
        require(msg.value >= bet);
        //if (msg.value > bet) {
            //msg.sender.transfer(msg.value - bet);
        //}
        _;
    }

    modifier gameExists(uint gameId) {
        // Game exists.
        require(gameId < games.length);
        _;
    }

    modifier gameIsOngoing(uint gameId) {
        require(games[gameId].status == Status.ONGOING);
        _;
    }

    modifier checkInput(uint gameId, uint index) {
        // Valid index.
        require(index < 9);
        
        // Cell is empty.
        require(games[gameId].board[index] == address(0));

        // Own turn.
        require(games[gameId].whoseTurn == msg.sender);
        _;
    }

    function enableCommissions() public onlyOwner {
        commissionEnabled = true;
    }

    function disableCommissions() public onlyOwner {
        commissionEnabled = false;
    }

    function setFee(uint newPercentage) public onlyOwner {
        require(newPercentage <= MAX_FEE);
        fee = newPercentage;
    }

    function withdraw() public onlyOwner {
        require(balance != 0);
        require(address(this).balance >= balance);
        uint amountToSend = balance;
        balance = 0;
        msg.sender.transfer(amountToSend);
    }
}