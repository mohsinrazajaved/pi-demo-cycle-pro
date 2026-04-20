import { useLocation } from 'react-router-dom';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0d0d0d] text-white">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-7xl font-light text-zinc-600">404</h1>
                        <div className="h-0.5 w-16 bg-[#FF3F03]/50 mx-auto"></div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl font-medium text-zinc-200">Page Not Found</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            The page <span className="font-medium text-zinc-200">"{pageName}"</span> could not be found.
                        </p>
                    </div>

                    <div className="pt-6">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl border border-[#FF3F03]/50 text-[#FF3F03] hover:bg-[#FF3F03]/10 transition-colors"
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
