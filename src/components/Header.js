import React, {Component} from 'react';
import {connect} from 'react-redux';

import {withdrawFunds, enableCommissions, disableCommissions, getBalance} from '../actions';

class Header extends Component {

    getBalance() {
        this.props.getBalance().then(balance => {
            const etherBalance = balance.dividedBy(1e18);
            alert(`The contract's balance is: ${etherBalance.toString()} ether.`);
        });
    }

    isContractOwner() {
        return this.props.defaultAccount === this.props.owner;
    }

    render() {
        const isContractOwner = this.isContractOwner();
        return (
            <nav className="navbar" style={{width: '100%'}}>
                <a href="#" className="pure-menu-heading pure-menu-link">D-TicTacToe</a>
                    <div className="nav-item dropdown" style={{width: '10%'}}>
                        <a className="nav-link dropdown-toggle" style={{float: 'right'}} href="#" id="navbarDropdownMenuLink" data-flip="true" data-boundary="window" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Settings
                        </a>
                        <div className="custom-dropdown dropdown-menu dropdown-menu-right" style={{right:0, left: 'auto'}} aria-labelledby="navbarDropdownMenuLink">
                            <a className="dropdown-item" href="#" onClick={() => this.props.onHostNamePressed()}>Hostname</a>
                            {
                                isContractOwner &&
                                <div>
                                    <a className="dropdown-item" href="#" onClick={() => this.getBalance()}>Get contract balance</a>
                                    <a className="dropdown-item" href="#" onClick={() => this.props.withdrawFunds()}>Withdraw funds</a>
                                    <a className="dropdown-item" href="#" onClick={() => this.props.enableCommissions()}>Enable commissions</a>
                                    <a className="dropdown-item" href="#" onClick={() => this.props.disableCommissions()}>Disable commissions</a>
                                </div>
                            }
                        
                        </div>
                    </div>
            </nav>
        );
    }
}

const mapDispatchToProps = {
    withdrawFunds,
    enableCommissions, 
    disableCommissions,
    getBalance,
};

const mapStateToProps = (state) => (
    {
        owner: state.owner,
        defaultAccount: state.defaultAccount,
    });

export default connect(mapStateToProps, mapDispatchToProps)(Header);
