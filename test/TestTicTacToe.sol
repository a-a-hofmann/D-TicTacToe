pragma solidity ^0.4.2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/TicTacToe.sol";

contract TestTicTacToe {
    TicTacToe ticTacToe = TicTacToe(DeployedAddresses.TicTacToe());

    uint public initialBalance = 1 ether;

    function testCreateGame() public {
        //uint returnedId = ticTacToe.createGame();

        uint expected = 0;

        uint returnedId = ticTacToe.createGame.value(1000)();

        Assert.equal(returnedId, expected, "Game id should be 0.");

        expected = 1;

        returnedId = ticTacToe.createGame.value(1000)();
        Assert.equal(returnedId, expected, "Game id should be 1.");
    }

    function testGetGame() public {
        uint gameId;
        address owner;
        address opponent;
        uint bet;
        TicTacToe.Status status;

        uint amount = 200000;
        uint returnedId = ticTacToe.createGame.value(amount)();

        (gameId, owner, opponent, bet, status) = ticTacToe.getGame(returnedId);

        Assert.equal(gameId, returnedId, "Wrong game id.");
        Assert.equal(owner, this, "Game owner should be this.");
        Assert.equal(opponent, address(0), "There should not be any opponent.");
        Assert.equal(bet, amount, "Wrong bet amount.");
        Assert.equal(uint(status), 0, "Game should be in betting phase.");
    }
}