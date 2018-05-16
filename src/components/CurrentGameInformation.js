import React from 'react';

const CurrentGameInformation = ({currentAccount, currentGame}) => {
    const currentPlayer = currentGame.playerName(currentAccount);
    const msg = !!currentPlayer ? `You are player ${currentPlayer}` : 'Spectator mode';
    return (
        <div>
            <h3 style={{textAlign: 'center'}}>{msg}</h3>
        </div>
    );
}

export default CurrentGameInformation;