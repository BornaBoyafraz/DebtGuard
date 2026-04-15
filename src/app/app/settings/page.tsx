'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuthContext } from '@/contexts/auth-context';
import { useSimulations } from '@/hooks/use-simulations';
import { useFinancialStore } from '@/store/financial-store';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { User, Palette, ShieldCheck, Trash2, Database, Lock } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, logout, updateProfile, resetPassword } = useAuthContext();
  const { removeAll } = useSimulations();
  const { profile: financialProfile, reset: clearFinancialProfile } = useFinancialStore();
  const { toast } = useToast();

  const [clearHistoryOpen, setClearHistoryOpen] = useState(false);
  const [resetAllOpen, setResetAllOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(profile?.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() ?? '?');

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    setSavingName(true);
    const { error } = await updateProfile({ name: nameValue.trim() });
    setSavingName(false);
    if (error) {
      toast('Failed to update name. Try again.', 'error');
    } else {
      setEditingName(false);
      toast('Name updated.', 'success');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) return;
    setSavingPassword(true);
    const supabase = (await import('@/lib/supabase/client')).createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast(`Failed: ${error.message}`, 'error');
    } else {
      setNewPassword('');
      setPasswordDialogOpen(false);
      toast('Password changed successfully.', 'success');
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) return;
    const { error } = await resetPassword(user.email);
    if (error) {
      toast(`Failed: ${error}`, 'error');
    } else {
      toast('Password reset email sent.', 'success');
    }
  };

  const handleClearHistory = async () => {
    const { error } = await removeAll();
    if (error) {
      toast('Failed to clear history. Try again.', 'error');
    } else {
      toast('Simulation history cleared.', 'success');
    }
    setClearHistoryOpen(false);
  };

  const handleResetAll = async () => {
    await removeAll();
    clearFinancialProfile();
    await logout();
    setResetAllOpen(false);
    router.push('/');
  };

  const accountCreated = profile
    ? new Date((profile as { created_at: string }).created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      {/* My Account */}
      <Card bordered>
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-text-secondary" />
          <h3 className="text-base font-semibold text-text-primary">My Account</h3>
        </div>

        {/* Avatar + display name */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xl font-bold shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-base font-semibold text-text-primary leading-snug">
              {profile?.name ?? user?.email ?? '—'}
            </p>
            <p className="text-sm text-text-muted">{user?.email}</p>
          </div>
        </div>

        {/* Info table */}
        <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
          {/* Name row */}
          <div className="flex items-center justify-between px-4 py-3 bg-surface-elevated/30">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Name</p>
              {editingName ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleSaveName(); }}
                    className="h-7 text-sm"
                  />
                  <Button size="sm" loading={savingName} onClick={() => void handleSaveName()}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEditingName(false); setNameValue(profile?.name ?? ''); }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <p className="text-sm font-medium text-text-primary truncate">{profile?.name ?? '—'}</p>
              )}
            </div>
            {!editingName && (
              <button
                onClick={() => setEditingName(true)}
                className="ml-4 text-xs text-accent hover:text-accent-hover cursor-pointer transition-colors shrink-0"
              >
                Edit
              </button>
            )}
          </div>

          {/* Email row */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Email</p>
              <p className="text-sm font-medium text-text-primary truncate">{user?.email ?? '—'}</p>
            </div>
            <span className="ml-4 text-[10px] text-text-muted bg-surface-elevated px-2 py-0.5 rounded shrink-0">
              Read-only
            </span>
          </div>

          {/* Member since row */}
          <div className="px-4 py-3">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Member Since</p>
            <p className="text-sm font-medium text-text-primary">{accountCreated ?? '—'}</p>
          </div>
        </div>

        <p className="text-xs text-text-muted mt-3">Your data is securely stored and encrypted. Only you can access it.</p>
      </Card>

      {/* Financial Defaults */}
      {financialProfile && (
        <Card bordered>
          <div className="flex items-center gap-2 mb-5">
            <Database className="w-4 h-4 text-text-secondary" />
            <h3 className="text-base font-semibold text-text-primary">Financial Defaults</h3>
          </div>
          <p className="text-xs text-text-secondary mb-4">
            Your current financial profile values. Edit these on the Dashboard.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Monthly Income', formatCurrency(financialProfile.income)],
              ['Monthly Expenses', formatCurrency(financialProfile.expenses)],
              ['Total Savings', formatCurrency(financialProfile.savings)],
              ['Total Debt', formatCurrency(financialProfile.totalDebt)],
              ['Interest Rate', formatPercent(financialProfile.interestRate)],
              ['Min Payment', formatCurrency(financialProfile.minimumPayment)],
            ].map(([label, value]) => (
              <div key={label} className="bg-surface-elevated rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-text-primary mt-0.5 font-mono">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Preferences */}
      <Card bordered>
        <div className="flex items-center gap-2 mb-5">
          <Palette className="w-4 h-4 text-text-secondary" />
          <h3 className="text-base font-semibold text-text-primary">Preferences</h3>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Theme</label>
            <ThemeToggle />
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card bordered>
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4 text-text-secondary" />
          <h3 className="text-base font-semibold text-text-primary">Security</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Change Password</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>Enter your new password below.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
                  <Button
                    loading={savingPassword}
                    disabled={newPassword.length < 8}
                    onClick={() => void handleChangePassword()}
                  >
                    Save Password
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={() => void handleForgotPassword()}>
            Send Reset Email
          </Button>
        </div>
      </Card>

      {/* Data & Privacy */}
      <Card bordered>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-success" />
          <h3 className="text-base font-semibold text-text-primary">Your Data</h3>
        </div>
        <div className="rounded-lg bg-success-subtle/50 border border-success/10 p-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            Your data is securely stored in Supabase with row-level security — only you can access it.
            All financial data, simulation results, and chat history are encrypted at rest.
          </p>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card bordered className="border-danger/20">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-4 h-4 text-danger" />
          <h3 className="text-base font-semibold text-danger">Danger Zone</h3>
        </div>
        <p className="text-sm text-text-secondary mb-5">These actions are permanent and cannot be undone.</p>
        <div className="flex flex-wrap gap-3">
          <Dialog open={clearHistoryOpen} onOpenChange={setClearHistoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-danger/30 text-danger hover:bg-danger-subtle">
                Clear Simulation History
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clear Simulation History</DialogTitle>
                <DialogDescription>This will permanently delete all saved simulations from your account.</DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-end gap-3 mt-4">
                <Button variant="ghost" onClick={() => setClearHistoryOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={() => void handleClearHistory()}>Yes, Clear History</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={resetAllOpen} onOpenChange={setResetAllOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="w-3.5 h-3.5" />
                Reset All Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset All Data</DialogTitle>
                <DialogDescription>This will delete all simulations and log you out.</DialogDescription>
              </DialogHeader>
              <p className="text-sm text-text-secondary mb-6">
                This will clear all your simulations, local state, and log you out. Your account will remain active.
              </p>
              <div className="flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={() => setResetAllOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={() => void handleResetAll()}>Yes, Reset Everything</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </div>
  );
}
