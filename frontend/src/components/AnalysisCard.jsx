import { FiCheckCircle, FiInbox } from "react-icons/fi";

const AnalysisCard = ({ title, items }) => {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 min-h-[320px] hover:border-purple-500 transition">

            <h2 className="text-xl font-semibold text-white mb-6">
                {title}
            </h2>

            {
                items.length > 0 ? (

                    <div className="flex flex-wrap gap-3">

                        {items.map((item, index) => (

                            <div
                                key={index}
                                className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-full text-zinc-200"
                            >
                                <FiCheckCircle className="text-purple-400" />
                                <span>{item}</span>
                            </div>

                        ))}

                    </div>

                ) : (

                    <div className="flex flex-col items-center justify-center h-52 text-zinc-500">

                        <FiInbox size={45} />

                        <p className="mt-4">
                            No data available.
                        </p>

                    </div>

                )
            }

        </div>
    );
};

export default AnalysisCard;