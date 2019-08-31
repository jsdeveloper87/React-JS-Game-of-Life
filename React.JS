const ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

class GameOfLife extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      currentBoard: gliderGunAndPulsars,
      generation: 0,
      running: false,
      intervalId: '',
      showPatterns: false,
      patterns: []
    };
    this.createBoard = this.createBoard.bind(this);
    this.createPattern = this.createPattern.bind(this);
    this.beginSimulation = this.beginSimulation.bind(this);
    this.nextGen = this.nextGen.bind(this);
    this.pauseSimulation = this.pauseSimulation.bind(this);
    this.randomize = this.randomize.bind(this);
    this.reset = this.reset.bind(this);
    this.clearBoard = this.clearBoard.bind(this);
    this.nextBoard = this.nextBoard.bind(this);
    this.countCellBuddies = this.countCellBuddies.bind(this);
    this.convertToOneDimension = this.convertToOneDimension.bind(this);
    this.clickChanger = this.clickChanger.bind(this);
    this.togglePatterns = this.togglePatterns.bind(this);
    this.selectPattern = this.selectPattern.bind(this);
  }
  
  componentDidMount() {
    this.beginSimulation();
  }
  
  // creates blank or randomized board
  // need blank board first before creating
  // pattern with below function
  createBoard(cells) {
    let config = [];
    for (let i = 0; i < 30; i++) {
      config.push([]);
      for (let j = 0; j < 50; j++) {
        if (cells === 'randomize') {
          config[i].push(Math.random() < .5 ? 0 : 1);
        } else {
          config[i].push(cells);
        }
      }
    }
    return config;
  }
  
  // creates the pre-loaded patterns from "coordinate sets" as seen 
  // above ReactDOM.render()
  createPattern(arr) {
    let pattern = this.createBoard(0);
    for (let i = 0; i < arr.length; i++) {
      let row = arr[i][0];
      let cell = arr[i][1];
      pattern[row][cell] = 1;
    }
    return pattern;
  }
  
  // is called at initial rendering (and from restart button), 
  // thus calling nextGen() at 500ms intervals until user
  // clears interval with pause or restart buttons    
  beginSimulation() {
    if (this.state.running) return;
    this.setState({
      intervalId: setInterval(() => {
        this.nextGen();
      }, 100)
    });
  }
  
  // Advances Game to next state.
  // Updates generation and currentBoard, 
  // causing re-rendering. Sets currentBoard state 
  // to the result of the nextBoard function, providing
  // an updated game board to be drawn by the re-render.  
  nextGen() {
    let board = this.state.currentBoard;
    let count = this.state.generation;
    this.setState({
      generation: count + 1,
      currentBoard: this.nextBoard(board),
      running: true
    });
  }
  
  pauseSimulation() {
    if (this.state.running) {
      clearInterval(this.state.intervalId);
      this.setState({running: false});
    } else {
      this.beginSimulation();
    }
  }
  
  randomize() {
    clearInterval(this.state.intervalId);
    this.setState({
      currentBoard: this.createBoard('randomize'),
      generation: 0,
      running: false,
      intervalId: ''
    });
    setTimeout(() => {
      this.beginSimulation();
    }, 100)
  }
  
  reset() {
    clearInterval(this.state.intervalId);
    this.replaceState(this.getInitialState())
    setTimeout(() => {
      this.beginSimulation();
    }, 100)
  }
  
  clearBoard() {
    clearInterval(this.state.intervalId);
    this.setState({
      currentBoard: this.createBoard(0),
      generation: 0,
      running: false,
      intervalId: ''
    });
  }
  
  nextBoard(_board) {
    let theNextBoard = [];
    _board.forEach((row, rowIndex) => {
      theNextBoard.push([]); // creates 30 new empty rows
      row.forEach((cell, cellIndex) => {
        // send the index of each row, and for each row, 
        // the index of each cell to countCellBuddies 
        // function, then check that cell's buddies to
        // make the decisions below.
        let buddies = this.countCellBuddies(rowIndex, cellIndex, _board);
        let life = 1,
            death = 0,
            fate;
        // Conway's Rules:
        if (cell == 1) { // Cell is 'alive':
          // Any live cell with two or three live neighbours lives on.
          // Any live cell with fewer than two live neighbours dies.
          // Any live cell with more than three live neighbours dies.
          fate = buddies >= 2 && buddies <= 3 ? life : death;
        } else { // Cell is 'dead':
          // Any dead cell with exactly three live neighbours  
          // becomes a live cell.
          fate = buddies === 3 ? life : death;
        }
        // pushes 50 live or dead cells onto each new row
        theNextBoard[rowIndex].push(fate); 
      });
    });
    // updated 50 x 30 board:
    return theNextBoard; 
  }
  
  countCellBuddies(_rowIndex, _cellIndex, _board) {
    
    // cellIsOccupied accepts a set of 'coordinates', if you will, where
    // the x-coord is the index of a given 'row' on the multi-dim board 
    // array, and the y-coord is the index of each 'cell' that is a part of 
    // that row. This can be looked at as a sort of reverse/upsidedown 
    // graph, becuase the cell represented by coords [0, 0] is the
    // top-most left-most cell, rather than a typical graph where 
    // [0, 0] would be bottom left.

    // That said, when checking the very first cell's buddies, 
    // cellIsOccupied() will be passed -1, -1 (to check 
    // for buddy up one and to the left), since the position 
    // of that cell is at the zeroeth index of the array that is 
    // at the zeroeth index of the parent mulit-dim array.
    // _board[-1] will return undefined, making further checks moot. 
    // We must, then,  account for cells on edges when checking for 
    // buddies to ensure accurate results, and more importantly,
    // to keep the code from breaking, since not every cell has 8 
    // potential neighbors.
    
    // Must be kept within the scope of countCellBuddies
    // in order to be more easily accessed. 
    function cellIsOccupied(__rowIndex, __cellIndex) {
      if (_board[__rowIndex] !== undefined) {
        return _board[__rowIndex][__cellIndex];
      }
    }
    
    // The table below shows the distance 
    // from x & y that we must go to check the cell in the position 
    // represented by the table. The if statements below are based on 
    // this "buddy table".
    
    let numberOfBuds = 0;
    // The Buddy Table: 
    // [-1, -1], [-1,  0], [-1, +1], --> above
    // [0,  -1], [ CELL ], [0,  +1], --> our row
    // [+1, -1], [+1,  0], [+1, +1]; --> below

    // checks cell above and to the left
    if (cellIsOccupied(_rowIndex - 1, _cellIndex - 1)) numberOfBuds++;
    // checks cell above
    if (cellIsOccupied(_rowIndex - 1, _cellIndex)) numberOfBuds++;
    // checks cell above and to the right
    if (cellIsOccupied(_rowIndex - 1, _cellIndex + 1)) numberOfBuds++;
    // checks cell to the left
    if (cellIsOccupied(_rowIndex, _cellIndex - 1)) numberOfBuds++;
    // checks cell to the right
    if (cellIsOccupied(_rowIndex, _cellIndex + 1)) numberOfBuds++;
    // checks cell below and to the left
    if (cellIsOccupied(_rowIndex + 1, _cellIndex - 1)) numberOfBuds++;
    // checks cell below
    if (cellIsOccupied(_rowIndex + 1, _cellIndex)) numberOfBuds++;
    // checks cell below and to the right
    if (cellIsOccupied(_rowIndex + 1, _cellIndex + 1)) numberOfBuds++;

    return numberOfBuds;
  }
  
  convertToOneDimension(multiDimArray) {
    // Converts multi-dim representation of board into a
    // single dimension array than can easily be drawn by the
    // render function.
    let oneDimesnional = [];
      multiDimArray.forEach(row => {
        row.map(cell => {
          return oneDimesnional.push(cell);
        });
      });
    return oneDimesnional;
  }
  
  clickChanger(e) {
    // pass key, get row and column coords
    // update that index to alive or dead
    // according to current state of cell
    let id = e.target.id;
    let el = document.getElementById(id);
    let color = window.getComputedStyle(el).getPropertyValue('background');
    let row = Math.floor(id/50);
    let col = id % 50;
    let update = this.state.currentBoard;
    if (color.includes('rgb(0, 0, 0)')) {
      update[row][col] = 1;
    } else {
      update[row][col] = 0;
    }
    this.setState({
      currentBoard: update
    });
    
  }
  
  togglePatterns() {
    let patterns = !this.state.showPatterns ? 
        ['Glider Gun', 'Pulsar', 'Crazy Corners', 'Pentadecathlon', 'Baby Pulsar', 'Load Pattern', 'Maximum Density Still Life'] : [];
    this.setState({
      showPatterns: !this.state.showPatterns,
      patterns: patterns
    })
  }
  
  selectPattern(e) {
    let pattern = e.target.innerText;
    let patterns = {
      'Glider Gun': this.createPattern(gliderGun),
      'Crazy Corners': this.createPattern(crazyCorners), 
      'Pentadecathlon': this.createPattern(pentadecathlon),
      'Pulsar': this.createPattern(pulsar),
      'Baby Pulsar': this.createPattern(firstGenPulsar),
      'Maximum Density Still Life': this.createPattern(maxDensityStillLife),
    };
    clearInterval(this.state.intervalId);
    this.setState({
      currentBoard: pattern == 'Load Pattern' ? gliderGunAndPulsars : patterns[pattern],
      generation: 0,
      running: false,
      intervalId: ''
    });
  }
  
  render() {
    const dead = { background: 'black' };
    const alive = { background: '#66ff33' };
    const board = this.convertToOneDimension(this.state.currentBoard);
    const drawBoard = board.map((cell, i) => {
      let color = cell === 0 ? dead : alive;
      return <div id={i} onClick={this.clickChanger} className='cell' style={color} key={i}></div>
    });
    let animateClass = this.state.showPatterns ? 'show' : 'hide';
    let patterns = this.state.patterns.map((pattern) => (
      <div className='pattern' key={pattern} onClick={this.selectPattern}>{pattern}</div>
    ));

    return (
      <div>
        <div className='title'>
          Conway's Game of Life
        </div>
        <GameBoard create={drawBoard}/>
        <div className='bottomTab'>
          <Counter count={this.state.generation}/>
          <Controls 
            handleClick={this.pauseSimulation} 
            label='Start/Pause/Resume'
            tooltip='Press pause whie a simulation is running, click on some cells, and see what happens when you resume!'/>
          <Controls 
            handleClick={this.randomize} 
            label='Randomize'/>
          <Controls 
            handleClick={this.clearBoard} 
            label='Clear Board'
            tooltip='Clear the board and click on the cells to make your own patterns!'/>
          <Controls 
            handleClick={this.togglePatterns} 
            label='Patterns'
            tooltip='Some cool pre-loaded patterns! Select, then go back one menu to run.'
            />
          <div className={animateClass += ' patternsWrapper'}>
            <div>
              <div>Patterns:</div>
              <ReactCSSTransitionGroup 
                transitionName="toggleShowPatterns" 
                transitionEnterTimeout={500}
                transitionLeaveTimeout={300}>
                {patterns}
              </ReactCSSTransitionGroup>
              <div className='back' onClick={this.togglePatterns}>Back</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
};

// STATELESS COMPONENTS:
class GameBoard extends React.Component {
  render() {
    return (
      <div className='boardWrapper'>
        <div className='board'>
          {this.props.create}
        </div>
      </div>
    )
  }
}

class Controls extends React.Component {
  render() {
    return (
        <div 
          onClick={this.props.handleClick} 
          title={this.props.tooltip} 
          className={this.props.class}>
            {this.props.label}
        </div>
    )
  }
}

class Counter extends React.Component {
  render() {
    return (
      <div className='counter'>
        Genreation: <div>{this.props.count}</div>
      </div>
    )
  }
}

// PRE-LOADED PATTERNS:
const maxDensityStillLife = [[ 5,  26 ],[ 5,  28 ],[ 5,  29 ],[ 5,  31 ],[ 5,  32 ],[ 5,  34 ],[ 5,  36 ],[ 5,  37 ],[ 5,  39 ],[ 5,  40 ],[ 5,  42 ],[ 5,  44 ],[ 5,  45 ],[ 6,  26 ],[ 6,  27 ],[ 6,  29 ],[ 6,  31 ],[ 6,  33 ],[ 6,  34 ],[ 6,  35 ],[ 6,  37 ],[ 6,  39 ],[ 6,  41 ],[ 6,  42 ],[ 6,  44 ],[ 7,  29 ],[ 7,  31 ],[ 7,  37 ],[ 7,  39 ],[ 7,  45 ],[ 8,  26 ],[ 8,  27 ],[ 8,  29 ],[ 8,  31 ],[ 8,  32 ],[ 8,  33 ],[ 8,  34 ],[ 8,  35 ],[ 8,  36 ],[ 8,  38 ],[ 8,  40 ],[ 8,  41 ],[ 8,  42 ],[ 8,  43 ],[ 8,  44 ],[ 8,  45 ],[ 9,  27 ],[ 9,  29 ],[ 9,  36 ],[ 9,  38 ],[ 9,  40 ],[ 10, 26 ],[ 10, 29 ],[ 10, 30 ],[ 10, 31 ],[ 10, 32 ],[ 10, 33 ],[ 10, 34 ],[ 10, 36 ],[ 10, 38 ],[ 10, 40 ],[ 10, 42 ],[ 10, 43 ],[ 10, 44 ],[ 10, 45 ],[ 11, 26 ],[ 11, 27 ],[ 11, 28 ],[ 11, 34 ],[ 11, 36 ],[ 11, 38 ],[ 11, 40 ],[ 11, 42 ],[ 11, 45 ],[ 12, 29 ],[ 12, 30 ],[ 12, 31 ],[ 12, 32 ],[ 12, 34 ],[ 12, 36 ],[ 12, 38 ],[ 12, 40 ],[ 12, 42 ],[ 12, 44 ],[ 13, 26 ],[ 13, 27 ],[ 13, 28 ],[ 13, 32 ],[ 13, 34 ],[ 13, 36 ],[ 13, 38 ],[ 13, 40 ],[ 13, 42 ],[ 13, 44 ],[ 13, 45 ],[ 14, 26 ],[ 14, 29 ],[ 14, 30 ],[ 14, 32 ],[ 14, 34 ],[ 14, 36 ],[ 14, 38 ],[ 14, 40 ],[ 14, 42 ],[ 14, 44 ],[ 15, 27 ],[ 15, 29 ],[ 15, 31 ],[ 15, 33 ],[ 15, 35 ],[ 15, 37 ],[ 15, 39 ],[ 15, 40 ],[ 15, 42 ],[ 15, 45 ],[ 16, 26 ],[ 16, 27 ],[ 16, 29 ],[ 16, 31 ],[ 16, 33 ],[ 16, 35 ],[ 16, 37 ],[ 16, 42 ],[ 16, 43 ],[ 16, 44 ],[ 16, 45 ],[ 17, 27 ],[ 17, 29 ],[ 17, 31 ],[ 17, 33 ],[ 17, 35 ],[ 17, 37 ],[ 17, 38 ],[ 17, 39 ],[ 17, 40 ],[ 17, 41 ],[ 18, 26 ],[ 18, 29 ],[ 18, 31 ],[ 18, 33 ],[ 18, 35 ],[ 18, 42 ],[ 18, 43 ],[ 18, 44 ],[ 18, 45 ],[ 19, 26 ],[ 19, 27 ],[ 19, 28 ],[ 19, 29 ],[ 19, 31 ],[ 19, 33 ],[ 19, 35 ],[ 19, 36 ],[ 19, 37 ],[ 19, 38 ],[ 19, 39 ],[ 19, 40 ],[ 19, 42 ],[ 19, 45 ],[ 20, 31 ],[ 20, 33 ],[ 20, 40 ],[ 20, 42 ],[ 20, 44 ],[ 21, 26 ],[ 21, 27 ],[ 21, 28 ],[ 21, 29 ],[ 21, 30 ],[ 21, 31 ],[ 21, 33 ],[ 21, 34 ],[ 21, 35 ],[ 21, 36 ],[ 21, 37 ],[ 21, 38 ],[ 21, 40 ],[ 21, 42 ],[ 21, 44 ],[ 21, 45 ],[ 22, 26 ],[ 22, 32 ],[ 22, 38 ],[ 22, 40 ],[ 22, 42 ],[ 22, 44 ],[ 23, 27 ],[ 23, 29 ],[ 23, 30 ],[ 23, 32 ],[ 23, 34 ],[ 23, 35 ],[ 23, 36 ],[ 23, 38 ],[ 23, 40 ],[ 23, 42 ],[ 23, 45 ],[ 24, 26 ],[ 24, 27 ],[ 24, 29 ],[ 24, 30 ],[ 24, 32 ],[ 24, 33 ],[ 24, 35 ],[ 24, 37 ],[ 24, 38 ],[ 24, 40 ],[ 24, 41 ],[ 24, 44 ],[ 24, 45 ],[ 5, 4 ],[ 5, 6 ],[ 5, 7 ],[ 5, 9 ],[ 5, 10 ],[ 5, 12 ],[ 5,  14 ],[ 5,  15 ],[ 5,  17 ],[ 5,  18 ],[ 5,  20 ],[ 5,  22 ],[ 5,  23 ],[ 6,   4 ],[ 6,   5 ],[ 6,   7 ],[ 6,   9 ],[ 6,  11 ],[ 6,  12 ],[ 6,  13 ],[ 6,  15 ],[ 6,  17 ],[ 6,  19 ],[ 6,  20 ],[ 6,  22 ],[ 7,   7 ],[ 7,   9 ],[ 7,  15 ],[ 7,  17 ],[ 7,  23 ],[ 8,   4 ],[ 8,   5 ],[ 8,   7 ],[ 8,   9 ],[ 8,  10 ],[ 8,  11 ],[ 8,  12 ],[ 8,  13 ],[ 8,  14 ],[ 8,  16 ],[ 8,  18 ],[ 8,  19 ],[ 8,  20 ],[ 8,  21 ],[ 8,  22 ],[ 8,  23 ],[ 9,   5 ],[ 9,   7 ],[ 9,  14 ],[ 9,  16 ],[ 9,  18 ],[ 10,  4 ],[ 10,  7 ],[ 10,  8 ],[ 10,  9 ],[ 10, 10 ],[ 10, 11 ],[ 10, 12 ],[ 10, 14 ],[ 10, 16 ],[ 10, 18 ],[ 10, 20 ],[ 10, 21 ],[ 10, 22 ],[ 10, 23 ],[ 11,  4 ],[ 11,  5 ],[ 11,  6 ],[ 11, 12 ],[ 11, 14 ],[ 11, 16 ],[ 11, 18 ],[ 11, 20 ],[ 11, 23 ],[ 12,  7 ],[ 12,  8 ],[ 12,  9 ],[ 12, 10 ],[ 12, 12 ],[ 12, 14 ],[ 12, 16 ],[ 12, 18 ],[ 12, 20 ],[ 12, 22 ],[ 13,  4 ],[ 13,  5 ],[ 13,  6 ],[ 13, 10 ],[ 13, 12 ],[ 13, 14 ],[ 13, 16 ],[ 13, 18 ],[ 13, 20 ],[ 13, 22 ],[ 13, 23 ],[ 14,  4 ],[ 14,  7 ],[ 14,  8 ],[ 14, 10 ],[ 14, 12 ],[ 14, 14 ],[ 14, 16 ],[ 14, 18 ],[ 14, 20 ],[ 14, 22 ],[ 15,  5 ],[ 15,  7 ],[ 15,  9 ],[ 15, 11 ],[ 15, 13 ],[ 15, 15 ],[ 15, 17 ],[ 15, 18 ],[ 15, 20 ],[ 15, 23 ],[ 16,  4 ],[ 16,  5 ],[ 16,  7 ],[ 16,  9 ],[ 16, 11 ],[ 16, 13 ],[ 16, 15 ],[ 16, 20 ],[ 16, 21 ],[ 16, 22 ],[ 16, 23 ],[ 17,  5 ],[ 17,  7 ],[ 17,  9 ],[ 17, 11 ],[ 17, 13 ],[ 17, 15 ],[ 17, 16 ],[ 17, 17 ],[ 17, 18 ],[ 17, 19 ],[ 18,  4 ],[ 18,  7 ],[ 18,  9 ],[ 18, 11 ],[ 18, 13 ],[ 18, 20 ],[ 18, 21 ],[ 18, 22 ],[ 18, 23 ],[ 19, 4 ],[ 19,   5 ],[ 19,  6 ],[ 19,  7 ],[ 19,  9 ],[ 19, 11 ],[ 19, 13 ],[ 19, 14 ],[ 19, 15 ],[ 19, 16 ],[ 19, 17 ],[ 19, 18 ],[ 19, 20 ],[ 19, 23 ],[ 20,  9 ],[ 20, 11 ],[ 20, 18 ],[ 20, 20 ],[ 20, 22 ],[ 21, 4 ],[ 21, 5 ],[ 21, 6 ],[ 21, 7 ],[ 21, 8 ],[ 21, 9 ],[ 21, 11 ],[ 21, 12 ],[ 21, 13 ],[ 21, 14 ],[ 21, 15 ],[ 21, 16 ],[ 21, 18 ],[ 21, 20 ],[ 21, 22 ],[ 21, 23 ],[ 22, 4 ],[ 22, 10 ],[ 22, 16 ],[ 22, 18 ],[ 22, 20 ],[ 22, 22 ],[ 23,  5 ],[ 23, 7 ],[ 23, 8 ],[ 23, 10 ],[ 23, 12 ],[ 23, 13 ],[ 23, 14 ],[ 23, 16 ],[ 23, 18 ],[ 23, 20 ],[ 23, 23 ],[ 24,  4 ],[ 24,  5 ],[ 24,  7 ],[ 24,  8 ],[ 24, 10 ],[ 24, 11 ],[ 24, 13 ],[ 24, 15 ],[ 24, 16 ],[ 24, 18 ],[ 24, 19 ],[ 24, 22 ],[ 24, 23 ],[ 0, 0 ],[ 0, 1 ], [ 1, 0 ], [ 1, 1 ], [ 28, 0 ], [ 28, 1 ], [ 29, 0 ], [ 29, 1 ], [ 29, 48 ], [ 29, 49 ], [ 28, 48 ], [ 28, 49 ], [ 0, 48 ], [ 0, 49 ], [ 1, 48 ], [ 1, 49 ]];

const firstGenPulsar = [[13, 24], [14, 23], [14, 24], [14, 25], [15, 23], [15, 25], [16, 23], [16, 24], [16, 25], [17, 24]];

const gliderGun = [[5, 1],[5, 2],[6, 1],[6, 2],[5, 11],[6, 11],[7, 11],[4, 12],[8, 12],[3, 13],[9, 13],[3, 14],[9, 14],[6, 15],[4, 16],[8, 16],[7, 17],[6, 17],[5, 17],[6, 18],[3, 21],[4, 21],[5, 21],[3, 22],[4, 22],[5, 22],[2, 23],[6, 23],[1, 25],[2, 25],[6, 25],[7, 25],[3, 35],[4, 35],[3, 36],[4, 36]];

const crazyCorners = [[0, 1],[0, 2],[1, 0],[1, 2],[1, 4],[2, 0],[2, 1],[2, 4],[2, 5],[2, 6],[4, 1],[4, 2],[5, 2],[6, 2],[0, 47],[0, 48],[1, 45],[1, 47],[1, 49],[2, 43],[2, 44],[2, 45],[2, 48],[2, 49],[4, 47],[4, 48],[5, 47],[6, 47],[29, 1],[29, 2],[28, 0],[28, 2],[28, 4],[27, 0],[27, 1],[27, 4],[27, 5],[27, 6],[25, 1],[25, 2],[24, 2],[23, 2],[29, 48],[29, 47],[28, 49],[28, 47],[28, 45],[27, 49],[27, 48],[27, 45],[27, 44],[27, 43],[25, 48],[25, 47],[24, 47],[23, 47],[12, 25],[11, 25],[10, 25],[15, 20],[15, 21],[15, 22],[15, 28],[15, 29],[15, 30],[18, 25],[19, 25],[20, 25]];
  
const pulsar = [[10, 21],[10, 22],[10, 26],[10, 27],[9, 21],[9, 27],[8, 21],[8, 27],[12, 17],[12, 18],[12, 19],[12, 22],[12, 23],[12, 25],[12, 26], [12, 29],[12, 30],[12, 31],[13, 19],[13, 21],[13, 23],[13, 25],[13, 27],[13, 29],[14, 21],[14, 22],[14, 26],[14, 27],[16, 21],[16, 22],[16, 26],[16, 27],[17, 19],[17, 21],[17, 23],[17, 25],[17, 27],[17, 29],[18, 17],[18, 18],[18, 19],[18, 22],[18, 23],[18, 25],[18, 26], [18, 29],[18, 30],[18, 31],[20, 21],[20, 22],[20, 26],[20, 27],[21, 21],[21, 27],[22, 21],[22, 27]];

const pentadecathlon = [[10, 14],[11, 14],[12, 13],[12, 15],[13, 14],[14, 14],[15, 14],[16, 14],[17, 13],[17, 15],[18, 14],[19, 14],[10, 35],[11, 35],[12, 34],[12, 36],[13, 35],[14, 35],[15, 35],[16, 35],[17, 34],[17, 36],[18, 35],[19, 35]];

 const gliderGunAndPulsars = [
 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
 [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
 [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0], 
 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0], 
 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0], 
 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
 [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0], 
 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
 [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
 [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
 [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
 [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
 [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
 [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
 [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
 [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0], 
 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
 [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
 ];

// ~Middle Cell = Row 16, Cell 25



// RENDER:
ReactDOM.render(
  <GameOfLife/>, 
  document.getElementById('app')
);
