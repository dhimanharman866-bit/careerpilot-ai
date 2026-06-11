def determine_difficulty(score:float):
    if score>=8:
        return "Hard"
    elif score>=5:
        return "medium"
    return "easy"