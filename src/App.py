from flask import Flask, jsonify, request
from flask_cors import CORS
from collections import deque
import heapq  # for A* algorithm

app = Flask(__name__)
CORS(app)  # Allow requests from frontend

# Node class for both BFS and A* algorithms
class Node:
    def __init__(self, state, parent=None, action=None, g=0, h=0):
        self.state = state  # The current state or position (e.g., (x, y) coordinates)
        self.parent = parent  # The parent node, used to reconstruct the path
        self.action = action  # The action taken to reach this node from the parent
        self.g = g  # Cost to reach this node (from start)
        self.h = h  # Estimated cost to reach the goal (heuristic)
        self.f = g + h  # f = g + h (total cost)

    def __eq__(self, other):
        """Check if two nodes are equal based on their state."""
        return isinstance(other, Node) and self.state == other.state

    def __hash__(self):
        """Hash the node based on its state for use in sets and dictionaries."""
        return hash(tuple(self.state))

    def path(self):
        """Return the sequence of actions to reach this node from the root."""
        node = self
        path = []
        while node.parent is not None:
            path.append(node.state)
            node = node.parent
        path.reverse()
        return path

    def child_node(self, new_state, action, g, h):
        """Generate a child node given a new state, action, and costs (g, h)."""
        return Node(new_state, self, action, g, h)

    def __lt__(self, other):
        """Less-than comparison for nodes based on f value (for heapq)."""
        return self.f < other.f

def get_valid_actions(state, grid):
    """Returns valid (action, new_state) pairs from the current state."""
    actions = []
    rows, cols = len(grid), len(grid[0])
    x, y = state

    # Check each possible action and ensure it's within grid bounds and not blocked
    if x > 0 and grid[x - 1][y] == 0:  # Up
        actions.append(('up', (x - 1, y)))
    if x < rows - 1 and grid[x + 1][y] == 0:  # Down
        actions.append(('down', (x + 1, y)))
    if y > 0 and grid[x][y - 1] == 0:  # Left
        actions.append(('left', (x, y - 1)))
    if y < cols - 1 and grid[x][y + 1] == 0:  # Right
        actions.append(('right', (x, y + 1)))

    return actions


def bfs(start, goal, grid):
    # Create the initial node
    start_node = Node(state=start)
    frontier = deque([start_node])  # Queue for BFS
    explored = set()  # Set to keep track of visited nodes

    while frontier:

        current_node = frontier.popleft()
        explored.add(current_node)

        print(current_node.state, goal)
        # Check if the current node's state matches the goal
        if current_node.state == tuple(goal):
            return current_node.path()  # Return the path to the solution

        # Get valid actions from the current node's state
        for action, next_state in get_valid_actions(current_node.state, grid):
            child = current_node.child_node(next_state, action, current_node.g + 1, 0)
            
            # Only add the child to the frontier if it hasn't been explored or isn't already in the queue
            if child not in explored and child not in frontier:
                frontier.append(child)

    # Return None if no solution is found
    return None


def a_star(start, goal, grid):
    # Create the initial node with f = g + h
    start_node = Node(state=start, g=0, h=heuristic(start, goal))
    frontier = [start_node]  # Priority queue for A*
    explored = set()  # Set to keep track of visited nodes

    while frontier:
        # Get the node with the lowest f value
        current_node = heapq.heappop(frontier)

        print(current_node.state, goal)
        # Check if the current node's state matches the goal
        if (current_node.state) == tuple(goal):
            return current_node.path(), current_node.g  # Return path and cost

        explored.add(current_node)

        # Get valid actions from the current node's state
        for action, next_state in get_valid_actions(current_node.state, grid):
            g = current_node.g + 1  # Cost to reach the new state
            h = heuristic(next_state, goal)  # Heuristic for the new state
            child = current_node.child_node(next_state, action, g, h)

            # Only add the child to the frontier if it hasn't been explored or isn't already in the frontier
            if child not in explored and child not in [n for n in frontier]:
                heapq.heappush(frontier, child)

    return None, None  # Return None if no solution is found


def heuristic(state, goal):
    """Manhattan distance heuristic."""
    return abs(state[0] - goal[0]) + abs(state[1] - goal[1])


# Flask route for BFS
@app.route('/bfs', methods=['POST'])
def run_bfs():
    data = request.get_json()
    start = data['start']
    goal = data['goal']
    grid = data['grid']
    
    steps = bfs(start, goal, grid)

    print(steps)
    return jsonify(steps)


# Flask route for A*
@app.route('/a_star', methods=['POST'])
def run_a_star():
    data = request.get_json()
    start = data['start']
    goal = data['goal']
    grid = data['grid']
    
    steps, _ = a_star(start, goal, grid)  # Ignore path, just return steps
    
    print(steps)  # Optionally print the steps to the console
    return jsonify(steps)

# This should be the only instance of this block
if __name__ == '__main__':
    app.run(debug=True)