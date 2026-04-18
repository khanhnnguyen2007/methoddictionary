from math import inf

WIDTH = 7
HEIGHT = 6
MOVE_ORDER = [3, 2, 4, 1, 5, 0, 6]

TT = {}


class BitBoard:
    def __init__(self):
        self.current = 0
        self.mask = 0
        self.history = []

    def copy(self):
        other = BitBoard()
        other.current = self.current
        other.mask = self.mask
        other.history = self.history[:]
        return other

    def moves_played(self):
        return self.mask.bit_count()

    def play(self, col):
        self.history.append((self.current, self.mask))
        self.current ^= self.mask
        self.mask |= self.mask + (1 << (col * 7))

    def undo(self):
        self.current, self.mask = self.history.pop()

    def can_play(self, col):
        return 0 <= col < WIDTH and (self.mask & (1 << (col * 7 + 5))) == 0

    def possible_moves(self):
        return [c for c in MOVE_ORDER if self.can_play(c)]

    def is_win(self, pos):
        m = pos & (pos >> 1)
        if m & (m >> 2):
            return True

        m = pos & (pos >> 7)
        if m & (m >> 14):
            return True

        m = pos & (pos >> 6)
        if m & (m >> 12):
            return True

        m = pos & (pos >> 8)
        if m & (m >> 16):
            return True

        return False

    def last_position(self):
        return self.current ^ self.mask


def negamax(board, depth, alpha, beta):
    key = (board.current, board.mask, depth)
    if key in TT:
        return TT[key]

    if board.is_win(board.last_position()):
        return -1_000_000 + depth

    if depth == 0 or board.moves_played() >= WIDTH * HEIGHT:
        return 0

    max_eval = -inf

    for col in board.possible_moves():
        board.play(col)
        score = -negamax(board, depth - 1, -beta, -alpha)
        board.undo()

        if score > max_eval:
            max_eval = score
        if score > alpha:
            alpha = score
        if alpha >= beta:
            break

    TT[key] = max_eval
    return max_eval


def best_move(board, depth=8):
    moves = board.possible_moves()
    best_score = -inf
    best_col = moves[0]

    for col in moves:
        board.play(col)
        score = -negamax(board, depth - 1, -inf, inf)
        board.undo()

        if score > best_score:
            best_score = score
            best_col = col

    return best_col


def grid_from_board(board):
    grid = [["_" for _ in range(WIDTH)] for _ in range(HEIGHT)]

    player_bits = board.mask ^ board.current
    ai_bits = board.current

    if board.moves_played() % 2 == 1:
        player_bits, ai_bits = ai_bits, player_bits

    for col in range(WIDTH):
        for row in range(HEIGHT):
            bit = 1 << (col * 7 + row)
            display_row = HEIGHT - 1 - row

            if player_bits & bit:
                grid[display_row][col] = "X"
            elif ai_bits & bit:
                grid[display_row][col] = "O"

    return grid


def winning_cells(grid, piece):
    for r in range(HEIGHT):
        for c in range(WIDTH - 3):
            cells = [(r, c + i) for i in range(4)]
            if all(grid[rr][cc] == piece for rr, cc in cells):
                return cells

    for r in range(HEIGHT - 3):
        for c in range(WIDTH):
            cells = [(r + i, c) for i in range(4)]
            if all(grid[rr][cc] == piece for rr, cc in cells):
                return cells

    for r in range(HEIGHT - 3):
        for c in range(WIDTH - 3):
            cells = [(r + i, c + i) for i in range(4)]
            if all(grid[rr][cc] == piece for rr, cc in cells):
                return cells

    for r in range(3, HEIGHT):
        for c in range(WIDTH - 3):
            cells = [(r - i, c + i) for i in range(4)]
            if all(grid[rr][cc] == piece for rr, cc in cells):
                return cells

    return []


def serialize_board(board):
    grid = grid_from_board(board)
    x_win = winning_cells(grid, "X")
    o_win = winning_cells(grid, "O")
    winner = "player" if x_win else "ai" if o_win else None

    return {
        "grid": grid,
        "winner": winner,
        "winning_cells": x_win or o_win,
        "draw": winner is None and board.moves_played() >= WIDTH * HEIGHT,
        "playable_columns": [c for c in range(WIDTH) if board.can_play(c)],
    }