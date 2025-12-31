import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Download, CheckCircle, XCircle } from 'lucide-react';

const BillingPage: React.FC = () => {
    const { currentUser, transactions, fetchTransactions, isLoading } = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchTransactions();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100">
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => fetchTransactions()}
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors font-medium bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {transactions.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <p>No transactions found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Description</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
                                        {/* <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Invoice</th> */}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {transactions.map((tx: any) => (
                                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                                {tx.description}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                    ${tx.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        tx.status === 'refunded' ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    {tx.status === 'completed' && <CheckCircle size={12} />}
                                                    {tx.status === 'refunded' && <RefreshCw size={12} />}
                                                    {tx.status === 'failed' && <XCircle size={12} />}
                                                    <span className="capitalize">{tx.status}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-200">
                                                {tx.amount < 0 ? '-' : ''}${Math.abs(tx.amount).toFixed(2)}
                                            </td>
                                            {/* <td className="px-6 py-4 text-right">
                                                <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-xs flex items-center gap-1 justify-end ml-auto">
                                                    <Download size={14} /> PDF
                                                </button>
                                            </td> */}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BillingPage;
