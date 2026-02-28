import { useEffect, useState } from 'react';

interface TransactionModalProps {
    result: {
        tx_hash: string;
        explorer: string;
        details: string;
    } | null;
    onClose: () => void;
}

function Confetti() {
    const colors = ['#FF007A', '#BB6BD9', '#27AE60', '#F2994A', '#00A4EF', '#FFD700', '#EB5757'];
    const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
    }));

    return (
        <div className="confetti-container">
            {pieces.map((p) => (
                <div
                    key={p.id}
                    className="confetti-piece"
                    style={{
                        left: `${p.left}%`,
                        animationDelay: `${p.delay}s`,
                        background: p.color,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        transform: `rotate(${p.rotation}deg)`,
                    }}
                />
            ))}
        </div>
    );
}

export default function TransactionModal({ result, onClose }: TransactionModalProps) {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (result) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [result]);

    if (!result) return null;

    return (
        <>
            {showConfetti && <Confetti />}
            <div className="tx-modal-overlay" onClick={onClose}>
                <div className="tx-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="tx-modal-icon success">✅</div>
                    <h3>Transaction Confirmed!</h3>
                    <p>{result.details}</p>
                    <div className="tx-modal-hash">
                        {result.tx_hash}
                    </div>
                    <a
                        className="tx-modal-link"
                        href={result.explorer}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View on XRPL Explorer ↗
                    </a>
                    <br />
                    <button className="tx-modal-close" onClick={onClose}>Close</button>
                </div>
            </div>
        </>
    );
}
