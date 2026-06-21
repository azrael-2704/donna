import React from 'react';
import { Shield } from 'lucide-react';

interface Props {
  pendingApprovals: any[];
  setPendingApprovals: React.Dispatch<React.SetStateAction<any[]>>;
  handleApproveAction: (approval: any) => void;
}

export default function ApprovalModal({
  pendingApprovals,
  setPendingApprovals,
  handleApproveAction
}: Props) {
  if (pendingApprovals.length === 0) return null;
  const approval = pendingApprovals[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-red-500/50 rounded-xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
        <div className="flex items-start gap-4">
          <Shield className="w-10 h-10 text-red-500 shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-foreground uppercase tracking-widest mb-1">Auditor Approval Required</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The Supreme Auditor intercepted a script execution. It requires access to your encrypted vault.
            </p>
            <div className="bg-background/50 border border-border/50 rounded p-3 mb-4 space-y-2">
              <div>
                <span className="text-[10px] uppercase text-muted-foreground font-bold block mb-1">Reason</span>
                <span className="text-xs text-foreground">{approval.reason}</span>
              </div>
              {approval.required_secrets?.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold block mb-1">Required Secrets</span>
                  <div className="flex gap-2">
                    {approval.required_secrets.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="text-[10px] uppercase text-muted-foreground font-bold block mb-1">Command</span>
                <pre className="text-[10px] text-green-400 font-mono bg-black p-2 rounded overflow-x-auto">
                  {approval.action.payload.command}
                </pre>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setPendingApprovals(prev => prev.slice(1))}
                className="px-4 py-2 rounded text-sm font-bold text-muted-foreground hover:bg-background transition-colors"
              >
                DENY
              </button>
              <button 
                onClick={() => handleApproveAction(approval)}
                className="px-4 py-2 rounded text-sm font-bold bg-red-500/20 text-red-500 border border-red-500 hover:bg-red-500/30 transition-colors uppercase tracking-wider"
              >
                Allow Once
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
