import { getDoc, updateDoc, setDoc, addDoc, getDocs, collection, deleteDoc } from './storage';

export const executeTrade = async (
  symbol: string,
  type: 'BUY' | 'SELL',
  shares: number,
  price: number,
  stopLoss: number,
  takeProfit: number
) => {
  // Simulate auth check by assuming a default user
  const uid = 'default';
  const portfolio = await getDoc(`portfolios/${uid}`) || { balance: 10000 };

  if (type === 'BUY') {
    const cost = shares * price;
    if (portfolio.balance < cost) return;
    
    await updateDoc(`portfolios/${uid}`, { balance: portfolio.balance - cost });
    // Using a list for positions in localStorage
    const positions = await getDocs('positions') || [];
    positions.push({ symbol, shares, entryPrice: price, stopLoss, takeProfit });
    await updateDoc('positions', positions);
  } else {
    // Simplified sell logic (placeholder)
    await updateDoc(`portfolios/${uid}`, { balance: portfolio.balance + (shares * price) });
  }
};
