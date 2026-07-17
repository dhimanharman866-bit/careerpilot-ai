const ActionCard=({title,description,onClick })=>{
    return (
        <div onClick={onClick} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-500 cursor-pointer">
            <h3 className="text-white text-lg font-semibold">
                {title}
            </h3>
            <p className="text-zinc-400 mt-2">
                {description}
            </p>
        </div>
    );
};
export default ActionCard;