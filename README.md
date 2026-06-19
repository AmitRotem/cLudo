# Ludo
* don't get stuck in start
    - triple roll if all pawn in start
    - double roll if all pawn either in start or end
    - allow pawn #n to move out if rolled n
* 1-n players
* PvP, PvC, CvC

# turn-based system
- roll dice
- choose which pawn to move (pawn #n can move out of home if rolled n or rolled 6)
- move pawn animation
    - also checks if passing via the pivot point - if so, move to home path
- if reached end, measure self, number of finished pawns is the outcome
- check for collisions
    - no collision if landed on safe spot
    - if collision with self, apply symmetric beam splitter between self pawns at that spot
    - if collision with other player, first perform dark measurement on self (i.e., is finite or zero)
        - positive (finite) -> measure other player, collapse them and send back to start if finite
        - false (zero) -> no collision, self collapsed to zero amplitude on that stop.
- if rolled 6, or reached end and measured finite, or collision that sent opponent back to start, get extra turn
- otherwise next player's turn

# AI
simple heuristic-based AI
* Naive
    - priority;
        1. not to collide with others
        1. move pawns out of start
        1. move pawns into home
    - becomes angry when sent back to start
* Angry
    - priority;
        1. to collide with others
        1. move pawns out of start
        1. move pawns into home
        1. get pawns to safe spots
        1. keep pawns in safe spots
    - becomes Nice when sending others back to start
* Nice
    - priority;
        1. move pawns out of start
        1. move pawns into home
        1. get pawns to safe spots
        1. keep pawns in safe spots
        1. not to collide with others
    - becomes angry when sent back to start
    