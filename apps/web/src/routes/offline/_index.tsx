export default function OfflinePage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
            <div className="text-center space-y-6">
                {/* Use Image component with proper src that starts with / */}
                <img
                    src="/nisclogowhite.png"
                    alt="Nisc Cloud"
                    className="mx-auto h-24 w-auto"
                />
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">You're Offline</h1>
                    <p className="text-muted-foreground">
                        Please check your internet connection and try again.
                    </p>
                </div>
            </div>
        </div>
    );
}
