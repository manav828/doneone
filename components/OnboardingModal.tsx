import React, { useState } from 'react';
import { Modal } from './Modal';
import { Building2, Users2, User, Check, ArrowRight, Plus, X } from 'lucide-react';
import { useStore } from '../store';

interface Props {
    isOpen: boolean;
}

type RoleType = 'company' | 'team' | 'individual';

export const OnboardingModal: React.FC<Props> = ({ isOpen }) => {
    const { completeOnboarding, currentUser } = useStore();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
    const [workspaceName, setWorkspaceName] = useState('');
    const [departments, setDepartments] = useState<string[]>(['']);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleRoleSelect = (role: RoleType) => {
        setSelectedRole(role);
        if (role === 'individual') {
            setWorkspaceName('My Projects');
            setDepartments([]);
        } else if (role === 'company') {
            setWorkspaceName('');
            setDepartments(['', '', '']); // Suggest multiple for companies
        } else {
            setWorkspaceName('');
            setDepartments(['']);
        }
        setStep(2);
    };

    const handleNext = () => {
        if (!workspaceName.trim()) return;

        // Skip departments for individuals
        if (selectedRole === 'individual') {
            handleSubmit();
        } else {
            setStep(3);
        }
    };

    const handleSubmit = async () => {
        if (!selectedRole || !workspaceName.trim()) return;

        setIsSubmitting(true);
        try {
            const validDepts = departments.filter(d => d.trim());
            await completeOnboarding(selectedRole, workspaceName, validDepts);
        } catch (error) {
            console.error("Onboarding failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getQuestion = () => {
        if (step === 1) return "How will you use DoneOne?";
        if (step === 2) {
            if (selectedRole === 'company') return "What is your Company Name?";
            if (selectedRole === 'team') return "What is your Team Name?";
            return "Name your Personal Workspace";
        }
        // Step 3
        if (selectedRole === 'company') return "Add your Company Departments";
        return "Add your Team Department";
    };

    const updateDepartment = (index: number, value: string) => {
        const newDepts = [...departments];
        newDepts[index] = value;
        setDepartments(newDepts);
    };

    const addDepartment = () => {
        setDepartments([...departments, '']);
    };

    const removeDepartment = (index: number) => {
        const newDepts = departments.filter((_, i) => i !== index);
        setDepartments(newDepts);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700">

                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-orange-600 p-8 text-center text-white">
                    <h2 className="text-3xl font-extrabold mb-2">Welcome to DoneOne</h2>
                    <p className="text-orange-100 opacity-90 text-lg">Let's set up your workspace in 30 seconds.</p>
                </div>

                {/* Content */}
                <div className="p-8">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 text-center">
                        {getQuestion()}
                    </h3>

                    {step === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <RoleCard
                                icon={<Building2 size={32} />}
                                title="Company Owner"
                                description="I run a company and need full control."
                                onClick={() => handleRoleSelect('company')}
                            />
                            <RoleCard
                                icon={<Users2 size={32} />}
                                title="Team Lead"
                                description="I manage a specific team or squad."
                                onClick={() => handleRoleSelect('team')}
                            />
                            <RoleCard
                                icon={<User size={32} />}
                                title="Individual"
                                description="I just need to organize my own work."
                                onClick={() => handleRoleSelect('individual')}
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="max-w-md mx-auto">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    {selectedRole === 'company' ? 'Organization Name' : selectedRole === 'team' ? 'Team Name' : 'Workspace Name'}
                                </label>
                                <input
                                    type="text"
                                    value={workspaceName}
                                    onChange={(e) => setWorkspaceName(e.target.value)}
                                    placeholder={selectedRole === 'company' ? 'e.g. Acme Corp' : 'e.g. Mobile Squad'}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-lg"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={!workspaceName.trim()}
                                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all ${(!workspaceName.trim()) ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                                >
                                    {selectedRole === 'individual' ? 'Get Started' : 'Next'} <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="max-w-md mx-auto">
                            <div className="mb-6 space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center">
                                    {selectedRole === 'company'
                                        ? "Create departments to organize your workforce (e.g. Marketing, Sales)."
                                        : "Define the sub-unit within your team (e.g. Frontend, Backend)."}
                                </p>

                                {departments.map((dept, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={dept}
                                            onChange={(e) => updateDepartment(index, e.target.value)}
                                            placeholder={index === 0 ? "e.g. Design" : index === 1 ? "e.g. Development" : "e.g. Marketing"}
                                            className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                            autoFocus={index === 0}
                                        />
                                        {departments.length > 1 && (
                                            <button
                                                onClick={() => removeDepartment(index)}
                                                className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <button
                                    onClick={addDepartment}
                                    className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} /> Add Another Department
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(2)}
                                    className="px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                                >
                                    {isSubmitting ? 'Setting up...' : 'Get Started'} <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Progress Dots */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 flex justify-center gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${step === i
                                ? 'bg-primary'
                                : (i < step || (selectedRole === 'individual' && i === 3)) // Hide 3rd dot for individual? No, logic complex. Just strict check.
                                    ? 'bg-primary/50'
                                    : 'bg-slate-300 dark:bg-slate-600'
                            } ${selectedRole === 'individual' && i === 3 ? 'hidden' : ''}`} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const RoleCard: React.FC<{ icon: React.ReactNode, title: string, description: string, onClick: () => void }> = ({ icon, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center text-center p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group"
    >
        <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h4 className="font-bold text-slate-900 dark:text-white mb-2">{title}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">{description}</p>
    </button>
);
