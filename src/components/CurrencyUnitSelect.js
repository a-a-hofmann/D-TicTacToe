import React from 'react';

export const WEI = 'WEI';
export const ETHER = 'ETHER';

const currencyUnit = {
    WEI: 'Wei',
    ETHER: 'Ether'
}

export const CurrencyUnitSelect = ({containerClass, value, onUnitChange}) => {
    return (
        <div className={containerClass}>
            <label htmlFor="currency-unit">Unit</label>
            <select 
                id="currency-unit" 
                className={"custom-select mb-3"} 
                value={value}
                onChange={onUnitChange}>
                <option value={WEI}>{currencyUnit[WEI]}</option>
                <option value={ETHER}>{currencyUnit[ETHER]}</option>
            </select>
        </div>
    );
}