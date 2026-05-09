import React from 'react';
import { Layers } from 'lucide-react';

interface PeerStripProps {
  stockDetails: any;
  className?: string;
}

const PeerStrip: React.FC<PeerStripProps> = ({ stockDetails, className }) => {
  const peers = stockDetails?.companyProfile?.peerCompanyList
    || stockDetails?.peerCompanyList
    || [];

  if (peers.length === 0) return null;

  return (
    <div className={`ns-card ${className || ''}`} style={{ padding: 18 }}>
      <div className="ns-card-header">
        <div className="ns-card-title"><Layers size={14} /> Peer Comparison · {stockDetails?.industry || 'Sector'}</div>
        <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)' }}>{peers.length} peers</div>
      </div>
      <div className="ns-peer-strip">
        {peers.slice(0, 5).map((p: any, i: number) => {
          const pct = Number(p.percentChange) || 0;
          const isUp = pct >= 0;
          return (
            <div key={i} className="ns-peer" style={{ animation: `ns-fade-up 0.5s ${0.04 * i}s backwards` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{p.companyName?.slice(0, 18) || 'N/A'}</span>
                <span className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: isUp ? 'var(--ns-profit)' : 'var(--ns-loss)' }}>
                  {isUp ? '+' : ''}{pct.toFixed(2)}%
                </span>
              </div>
              <div className="mono tnum" style={{ fontSize: 14, fontWeight: 600, marginTop: 6, letterSpacing: '-0.01em' }}>
                ₹{Number(p.price).toFixed(2)}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)', marginTop: 4 }}>
                P/E {Number(p.priceToEarningsValueRatio || 0).toFixed(1)} · MCap {Number(p.marketCap || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}Cr
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PeerStrip;
