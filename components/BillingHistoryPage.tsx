import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Download, ArrowLeft, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BillingHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser, transactions, fetchTransactions } = useStore();
    const [isLoading, setIsLoading] = useState(true);

    const currencySymbol = currentUser?.currency === 'INR' ? '₹' : '¥';

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                await fetchTransactions();
            } catch (error) {
                console.error("Error loading transactions:", error);
            }
            setIsLoading(false);
        };
        loadData();
    }, []);

    if (!currentUser) return null;

    return (
        <div className="h-full overflow-y-auto bg-slate-50/30 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
            <div className="max-w-5xl mx-auto w-full p-8 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/billing')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-primary transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <Receipt size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Billing History</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">View all your transactions and receipts</p>
                        </div>
                    </div>
                </div>

                {/* Transaction Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Description</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Amount</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {transactions.length > 0 ? transactions.map((tx: any) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                                            {new Date(tx.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                                            {tx.description}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${tx.status === 'completed'
                                                    ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400'
                                                    : tx.status === 'cancelled'
                                                        ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'completed' ? 'bg-green-500' : tx.status === 'cancelled' ? 'bg-red-500' : 'bg-slate-400'
                                                    }`} />
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">
                                            {currencySymbol}{tx.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                                <Download size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <Receipt size={40} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                                            <p className="text-slate-400 text-sm font-medium">No transactions found</p>
                                            <p className="text-slate-300 dark:text-slate-600 text-xs mt-1">Your billing history will appear here</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Summary Card */}
                {transactions.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Transactions</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{transactions.length}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Spent</p>
                                <p className="text-2xl font-black text-primary">
                                    {currencySymbol}{transactions.reduce((sum: number, tx: any) => sum + (tx.status === 'completed' ? tx.amount : 0), 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillingHistoryPage;
