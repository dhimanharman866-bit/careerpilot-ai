const StatCard = ({
    title,
    score,
    hasData,
    emptyMessage
}) => {

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-purple-500 transition">

            <h3 className="text-zinc-400 text-sm">
                {title}
            </h3>

            {hasData ? (

                <div className="mt-5">

                    <h1 className="text-5xl font-bold text-white">
                        {score}
                    </h1>

                </div>

            ) : (

                <div className="mt-5">

                    <h2 className="text-xl font-semibold text-white">
                        No Data
                    </h2>

                    <p className="text-zinc-400 mt-2 text-sm">
                        {emptyMessage}
                    </p>

                </div>

            )}

        </div>
    );
};

export default StatCard;