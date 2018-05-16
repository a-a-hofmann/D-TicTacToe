import React from 'react';

const AccountSelect = ({accounts, onSelectChange}) => {
    return (
        <div className="row">
            <div className="col-md-12">
                <label>Current account:</label>
                <select className={"custom-select custom-select-lg mb-3"} onChange={(event) => onSelectChange(event)}>
                    {accounts.map((account, i) => <option key={account.address} value={i}>{account.address} ({account.balance})</option>)}
                </select>
            </div>
        </div>
    );
}

export default AccountSelect;