'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Loader2, Gift, CheckCircle2, AlertCircle, Key, Star, Zap } from 'lucide-react';
import { redeemAPI } from 'haze.bio/api';
import toast from 'react-hot-toast';
import { useUser } from 'haze.bio/context/UserContext';

interface RedeemProductModalProps {
  onClose: () => void;
}

interface RedeemResult {
  product: string;
}

export function RedeemProductModal({ onClose }: RedeemProductModalProps) {
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionResult, setRedemptionResult] = useState<RedeemResult | null>(null);
  const { user, updateUser } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRedeemCode('');
    setRedemptionResult(null);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRedeemCode(value);
  };

  const handleRedeem = async () => {
    if (isValidCode) {
      try {
        setIsRedeeming(true);
        const result = await redeemAPI.redeemCode(redeemCode);
        setRedemptionResult(result);

        toast.success('Code redeemed successfully!');
      } catch (error: any) {
        toast.error(error.message || 'Failed to redeem code');
      } finally {
        setIsRedeeming(false);
      }
    }
  };

  const handleClose = () => {
    onClose();
  };

  const isValidCode = /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]{20}$/i.test(redeemCode);
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
      <div className="bg-black rounded-xl border border-zinc-800/50 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
              {redemptionResult ? (
                <Zap className="w-4 h-4 text-purple-400" />
              ) : (
                <Key className="w-4 h-4 text-purple-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-white">
              {redemptionResult ? 'Code Redeemed Successfully!' : 'Redeem Product Code'}
            </h3>
          </div>

          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {redemptionResult ? (
          <div className="p-5 space-y-5">
            {/* Success Message */}
            <div className="flex flex-col items-center text-center p-4 pb-6">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Redemption Successful!</h3>
              <p className="text-sm text-white/60 max-w-xs">
                {redemptionResult.product.includes("Pack") ?
                  `You've successfully redeemed your ${redemptionResult.product} and added Glow to your account.` :
                  `You've successfully redeemed your ${redemptionResult.product}.`}
              </p>
            </div>

            {/* Product Details */}
            <div className="p-4 bg-purple-900/5 rounded-lg border border-purple-800/20">
              <h4 className="text-sm font-medium text-white mb-3">Redemption Details</h4>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">Product:</span>
                  <span className="text-sm text-white font-medium">{redemptionResult.product}</span>
                </div>
              </div>
            </div>

            {/* What you can do with Glow */}
            <div className="flex items-start gap-3 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
              <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">What you can do with Glow</h4>
                <ul className="text-xs text-white/60 space-y-1.5 mt-2">
                  <li className="flex items-center gap-1.5">
                    <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                    <span>Purchase Premium membership (250 Glow monthly / 600 Glow lifetime)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                    <span>Buy profile badges and customizations</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                    <span>Access other exclusive features</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Instructions */}
            <p className="text-sm text-white/60">
              Enter the code you received to add Glow to your account or unlock premium features on haze.bio.
            </p>

            {/* Code input */}
            <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
              <label className="block text-sm font-medium text-white/70 mb-2">
                Redemption Code
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  id="redemption-code"
                  type="text"
                  value={redeemCode}
                  onChange={handleInputChange}
                  placeholder="XXXX-XXXX-XXXXXXXXXXXXXXXXXXXX"
                  className="w-full px-3 py-2 bg-black/50 border border-zinc-800/50 rounded-lg
                         text-white focus:outline-none focus:border-purple-500/30 tracking-wider uppercase"
                />
              </div>
              <p className="mt-2 text-xs text-white/40">
                Example: SHIMMER-ELYSIUM-dde1608d76ec858077d0
              </p>
            </div>

            {/* Glow benefits card */}
            <div className="flex items-start gap-3 p-4 bg-purple-900/5 rounded-lg border border-purple-800/20">
              <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">Glow Benefits</h4>
                <ul className="text-xs text-white/60 space-y-1.5 mt-2">
                  <li className="flex items-center gap-1.5">
                    <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                    <span>Get Premium with 250 Glow (monthly) or 600 Glow (lifetime)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                    <span>Unlock custom badges and profile customizations</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                    <span>Save with bonus Glow on larger packages</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Help info */}
            <div className="flex items-start gap-3 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
              <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">Need Help?</h4>
                <p className="text-xs text-white/60 mt-1">
                  If you're having trouble with your code, please contact our support team for assistance.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-zinc-800/50">
          {redemptionResult ? (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>

              <button
                onClick={handleRedeem}
                disabled={isRedeeming || !isValidCode}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRedeeming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                {isRedeeming ? 'Processing...' : 'Redeem Code'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}