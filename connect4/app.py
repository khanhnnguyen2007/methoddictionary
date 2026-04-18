from flask import Flask, jsonify, render_template, request
from engine import BitBoard, TT, best_move, serialize_board
import time

app = Flask(__name__)
board = BitBoard()
AI_DEPTH = 8


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/new")
def new_game():
    global board
    board = BitBoard()
    TT.clear()
    return jsonify(serialize_board(board))


@app.post("/play")
def play():
    global board

    data = request.get_json(force=True)
    col = int(data["col"])
    mode = data.get("mode", "ai") 

    if not board.can_play(col):
        return jsonify({"error": "Invalid move", **serialize_board(board)}), 400

    board.play(col)
    state = serialize_board(board)

    if state["winner"] or state["draw"]:
        return jsonify(state)

    if mode == "ai":
        
        ai_col = best_move(board, AI_DEPTH)
        board.play(ai_col)
        state = serialize_board(board)
        state["ai_move"] = ai_col

    return jsonify(state)


if __name__ == "__main__":
    app.run(debug=True)