import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const rows = 20;
  const cols = 20;
  const startNode = [0, 0];  // Start at top-left corner
  const goalNode = [19, 19];   // Goal at bottom-right corner

  const initialGrid = Array(rows).fill(0).map(() => Array(cols).fill(0));  // 0 represents free space

  const [grid, setGrid] = useState(initialGrid);
  const [steps, setSteps] = useState([]);  // Store steps
  const [isRunning, setIsRunning] = useState(false);
  const [algorithm, setAlgorithm] = useState('bfs');  // Default to BFS
  const [isPlacingWalls, setIsPlacingWalls] = useState(false);  // To toggle wall placement mode
  const [isMouseDown, setIsMouseDown] = useState(false); // Track mouse down state

  const resetGrid = () => {
    setGrid(initialGrid);  // Reset the grid to initial state
    setSteps([]);  // Reset steps
  };

  // Toggle wall state (0 -> 1 and vice versa)
  const toggleWall = (rowIndex, nodeIndex) => {
    const newGrid = [...grid];
    newGrid[rowIndex][nodeIndex] = newGrid[rowIndex][nodeIndex] === 0 ? 1 : 0;
    setGrid(newGrid);
  };

  // Mouse event handlers to draw walls
  const handleMouseDown = (rowIndex, nodeIndex) => {
    if (isPlacingWalls) {
      setIsMouseDown(true);
      toggleWall(rowIndex, nodeIndex); // Place wall initially
    }
  };

  const handleMouseEnter = (rowIndex, nodeIndex) => {
    if (isPlacingWalls && isMouseDown) {
      toggleWall(rowIndex, nodeIndex); // Draw wall while mouse is down
    }
  };

  const handleMouseUp = () => {
    if (isPlacingWalls) {
      setIsMouseDown(false); // Stop drawing when mouse is released
    }
  };

  const runBFS = async () => {
    console.log("BFS button clicked"); // Debug
    setIsRunning(true);
    setAlgorithm('bfs');  // Set algorithm to BFS
    try {
      const response = await axios.post('http://localhost:5000/bfs', {
        grid: grid,
        start: startNode,
        goal: goalNode
      });
      setSteps(response.data);  // Store steps from BFS
    } catch (error) {
      console.error('Error running BFS:', error);
    }
    setIsRunning(false);
  };

  const runAStar = async () => {
    setIsRunning(true);
    setAlgorithm('a_star');  // Set algorithm to A*
    try {
      const response = await axios.post('http://localhost:5000/a_star', {
        grid: grid,
        start: startNode,
        goal: goalNode
      });
      setSteps(response.data);  // Store steps from A*
    } catch (error) {
      console.error('Error running A*:', error);
    }
    setIsRunning(false);
  };

  useEffect(() => {
    const showSteps = async () => {
      if (Array.isArray(steps) && steps.length > 0) {
        let newGrid = JSON.parse(JSON.stringify(grid)); // Deep copy of the grid
        for (let i = 0; i < steps.length; i++) {
          const [x, y] = steps[i]; // Current step coordinates
          newGrid[x][y] = 2; // Mark as visited
          setGrid([...newGrid]); // Update state with a new reference
          await new Promise(resolve => setTimeout(resolve, 300)); // Visualization delay
        }
      } else {
        console.error("Steps are not properly defined or empty:", steps);
      }
    };
  
    showSteps();
  }, [steps]); // No need for 'grid' in dependencies

  return (
    <div className="App">
      <h1>{algorithm === 'bfs' ? 'BFS Algorithm' : 'A* Algorithm'} Visualizer</h1>
      <div>
        <button onClick={runBFS}>Run BFS</button>
        <button onClick={runAStar}>Run A*</button>
        <button onClick={resetGrid} disabled={isRunning}>Reset</button>
        <button onClick={() => setIsPlacingWalls(!isPlacingWalls)}>
          {isPlacingWalls ? 'Disable Wall Placement' : 'Enable Wall Placement'}
        </button>
      </div>
      <div className="grid">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((node, nodeIndex) => (
              <div
                key={nodeIndex}
                className={`node ${node === 2 ? 'visited' : ''} ${(rowIndex === startNode[0] && nodeIndex === startNode[1]) ? 'start' : ''} ${(rowIndex === goalNode[0] && nodeIndex === goalNode[1]) ? 'goal' : ''} ${node === 1 ? 'wall' : ''}`}
                onMouseDown={() => handleMouseDown(rowIndex, nodeIndex)} // Start drawing
                onMouseEnter={() => handleMouseEnter(rowIndex, nodeIndex)} // Continue drawing
                onMouseUp={handleMouseUp} // Stop drawing
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
