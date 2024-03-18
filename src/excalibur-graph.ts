import { Loadable, Tile, TileMap } from "excalibur";

export type GraphNode = {
  id: number | string;
  value?: any;
};

export type aStarNode = {
  id: number | string;
  collider: boolean;
  gCost: number;
  hCost: number;
  fCost: number;
  x: number;
  y: number;
  checked: boolean;
  parent: aStarNode | null;
};

export type Edge = {
  name: string;
  from: GraphNode;
  to: GraphNode;
  value?: number;
};

export type GraphTile = {
  name?: string;
  index?: number;
  coordinates?: { x: number; y: number };
  data?: any;
  collider?: boolean;
};
export type GraphTileMap = {
  name: string;
  tiles: Array<GraphTile>;
  rows: number;
  cols: number;
};

export class ExcaliburGraph implements Loadable<any> {
  data: any;
  duration: number = 0;
  starttime: number = 0;
  endtime: number = 0;

  isLoaded(): boolean {
    return true;
  }

  load(): Promise<any> {
    return Promise.resolve();
  }
  key: boolean = false;
  nodes: Map<string, GraphNode> = new Map();
  edges: Map<string, Edge> = new Map();

  addNode(node: GraphNode) {
    this.nodes.set(typeof node.id === "number" ? node.id.toString() : node.id, node);
  }

  addEdge(edge: Edge, bidirectional = false) {
    this.edges.set(edge.name, edge);
    if (bidirectional) {
      let newEdge = { name: `${edge.name}_reverse`, from: edge.to, to: edge.from };
      if (edge.value) Object.assign(newEdge, { value: edge.value });
      this.addEdge(newEdge);
    }
  }

  resetGraph() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  addTileMap(tilemap: GraphTileMap, diagonal = false) {
    tilemap.tiles.forEach((tile, index) => {
      //tile.collider === true ? this.addNode({ name: `${index}`, value: 1 }) : this.addNode({ name: `${index}`, value: 0 });
      if (!tile.collider) {
        this.addNode({ id: `${index}`, value: 0 });
      }
    });

    //loop over tilemap and find each tile's neighbors
    //add edges to the adjacency list
    tilemap.tiles.forEach((tile, index) => {
      //get neighbors
      if (tilemap.tiles[index].collider) return;
      let neighbors = [];
      if (tilemap.tiles[index - 1] && index % tilemap.cols != 0) neighbors.push(index - 1);
      if (tilemap.tiles[index + 1] && index % tilemap.cols != tilemap.cols - 1) neighbors.push(index + 1);
      if (tilemap.tiles[index - tilemap.cols]) neighbors.push(index - tilemap.cols);
      if (tilemap.tiles[index + tilemap.cols]) neighbors.push(index + tilemap.cols);

      if (diagonal) {
        if (tilemap.tiles[index - tilemap.cols - 1] && index % tilemap.cols != 0) neighbors.push(index - tilemap.cols - 1);
        if (tilemap.tiles[index - tilemap.cols + 1] && index % tilemap.cols != tilemap.cols - 1)
          neighbors.push(index - tilemap.cols + 1);
        if (tilemap.tiles[index + tilemap.cols - 1] && index % tilemap.cols != 0) neighbors.push(index + tilemap.cols - 1);
        if (tilemap.tiles[index + tilemap.cols + 1] && index % tilemap.cols != tilemap.cols - 1)
          neighbors.push(index + tilemap.cols + 1);
      }

      //check value for 1
      neighbors.forEach(neighbor => {
        if (tilemap.tiles[neighbor].collider != true) {
          this.addEdge({
            name: `${index}_${neighbor}`,
            from: this.nodes.get(`${index}`)!,
            to: this.nodes.get(`${neighbor}`)!,
            value: 1,
          });
        }
      });
    });
  }

  getNodes() {
    return this.nodes;
  }

  getEdges() {
    return this.edges;
  }

  getAdjacentNodes(node: GraphNode): GraphNode[] {
    const adjacentNodes = this.getAdjacentEdges(node).map(edge => edge.to);
    const uniqueNames = Array.from(new Set(adjacentNodes.map(node => node.id)));
    return uniqueNames.map(name => this.nodes.get(typeof name === "number" ? name.toString() : name)!);
  }

  getAdjacentEdges(node: GraphNode) {
    return [...this.edges.values()].filter(edge => edge.from === node).map(edge => edge);
  }

  getAdjacentEdgesTo(node: GraphNode) {
    return [...this.edges.values()].filter(edge => edge.to === node).map(edge => edge);
  }

  bfs(startnode: GraphNode, endnode: GraphNode): boolean {
    this.starttime = performance.now();
    const queue = [startnode];
    const visited = new Set();

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (!visited.has(current)) {
        visited.add(current);
        queue.push(...this.getAdjacentNodes(current));
      }
      if (current === endnode) {
        this.endtime = performance.now() - this.starttime;
        this.duration = this.endtime;
        return true;
      }
    }
    this.endtime = performance.now() - this.starttime;
    this.duration = this.endtime;
    return false;
  }

  dfs(startnode: GraphNode, endnode: GraphNode, visited = new Set()): boolean {
    this.starttime = performance.now();
    const stack = [startnode];
    visited.add(startnode);
    const adjacentNodes = this.getAdjacentNodes(startnode);
    for (const node of adjacentNodes) {
      if (node === endnode) {
        return true;
      }
      if (!visited.has(node)) {
        if (this.dfs(node, endnode, visited)) {
          this.endtime = performance.now() - this.starttime;
          this.duration = this.endtime;
          return true;
        }
      }
    }
    this.endtime = performance.now() - this.starttime;
    this.duration = this.endtime;
    return false;
  }

  dijkstra(sourcenode: GraphNode): Array<{ node: GraphNode; distance: number; previous: GraphNode | null }> {
    this.starttime = performance.now();
    const visited: GraphNode[] = [];
    const unvisited: GraphNode[] = [];
    const resultArray: Array<{ node: GraphNode; distance: number; previous: GraphNode | null }> = [];

    //fill unvisited
    this.nodes.forEach(node => unvisited.push(node));

    //fill resultArray
    this.nodes.forEach(node => resultArray.push({ node, distance: Infinity, previous: null }));

    //start with starting node
    //add startingnode to result array

    const startingNodeIndex = resultArray.findIndex(node => node.node === sourcenode);
    if (startingNodeIndex === -1) return [];
    resultArray[startingNodeIndex].distance = 0;

    visited.push(sourcenode);
    unvisited.splice(unvisited.indexOf(sourcenode), 1);

    let current = sourcenode;
    let currentEdges = this.getAdjacentEdges(current);

    //update result array with distances, which is edge values
    for (let i = 0; i < currentEdges.length; i++) {
      const edge = currentEdges[i];
      const index = resultArray.findIndex(node => node.node === edge.to);
      if (startingNodeIndex === -1) return [];
      resultArray[index].distance = edge.value as number;
      resultArray[index].previous = current;
    }

    while (unvisited.length > 0) {
      //get list of unvisited available nodes
      let listOfAvailableNodes: GraphNode[] = [];
      let listofAvailableEntries: Array<{ node: GraphNode; distance: number; previous: GraphNode | null }> = [];
      listofAvailableEntries = resultArray.filter(node => unvisited.includes(node.node));
      listOfAvailableNodes = listofAvailableEntries.map(node => node.node);

      //loop through available nodes and find lowest distance to sourcenode
      let lowestDistance = Infinity;
      let lowestDistanceIndex = -1;

      if (listOfAvailableNodes.length > 0) {
        for (let i = 0; i < listOfAvailableNodes.length; i++) {
          const unVisitiedNode = listOfAvailableNodes[i];

          let index = resultArray.findIndex(node => node.node === unVisitiedNode);

          if (resultArray[index].distance < lowestDistance) {
            lowestDistance = resultArray[index].distance;
            lowestDistanceIndex = index;
          }
        }
      } else {
        //manage exception
        //choose node from unvisited list that has lowest distance to source node

        lowestDistance = Infinity;
        lowestDistanceIndex = -1;

        for (let i = 0; i < unvisited.length; i++) {
          const unVisitiedNode = unvisited[i];
          let index = resultArray.findIndex(node => node.node === unVisitiedNode);
          if (resultArray[index].distance < lowestDistance) {
            lowestDistance = resultArray[index].distance;
            lowestDistanceIndex = index;
          }
        }
      }

      // add test for -1 index representing unreachable node
      if (lowestDistanceIndex === -1) {
        break;
      }

      current = resultArray[lowestDistanceIndex].node;
      currentEdges = this.getAdjacentEdges(current);

      //remove visited from currentEdges
      currentEdges = currentEdges.filter(edge => {
        return !visited.includes(edge.from) && !visited.includes(edge.to);
      });

      visited.push(current);
      unvisited.splice(unvisited.indexOf(current), 1);

      //update result array with distances, which is edge values
      for (let i = 0; i < currentEdges.length; i++) {
        const edge = currentEdges[i];
        const index = resultArray.findIndex(node => node.node === edge.to);

        //update cumulative distances
        const previousIndex = resultArray.findIndex(node => node.node === edge.from);
        const previousDistance = resultArray[previousIndex].distance;
        const cumDistance = (previousDistance + edge.value!) as number;

        if (cumDistance < resultArray[index].distance) {
          resultArray[index].distance = cumDistance;
          resultArray[index].previous = current;
        }
      }
    }
    this.endtime = performance.now() - this.starttime;
    this.duration = this.endtime;
    return resultArray;
  }

  shortestPath(startnode: GraphNode, endnode: GraphNode): GraphNode[] {
    let dAnalysis = this.dijkstra(startnode);

    //iterate through dAnalysis to plot shortest path to endnode
    let path: GraphNode[] = [];
    let current: GraphNode | null | undefined = endnode;
    while (current != null) {
      path.push(current);
      current = dAnalysis.find(node => node.node == current)?.previous;
      if (current == null) {
        break;
      }
    }
    path.reverse();
    return path;
  }
}

export class ExcaliburAstar {
  tilemap = {
    cols: 0,
    rows: 0,
  };
  grid: aStarNode[] = [];
  currentNode: aStarNode | null = null;
  currentIndex = 0;
  checkedNodes: aStarNode[] = [];
  openNodes: aStarNode[] = [];
  startnode: aStarNode | null = null;
  endnode: aStarNode | null = null;
  goalReached: boolean = false;
  path: aStarNode[] = [];
  duration: number = 0;
  starttime: number = 0;
  endtime: number = 0;

  constructor(tilemap: TileMap | GraphTileMap) {
    this.tilemap.cols = tilemap instanceof TileMap ? tilemap.columns : tilemap.cols;
    this.tilemap.rows = tilemap.rows;
    let tileIndex = 0;

    for (const tile of tilemap.tiles) {
      if (tilemap instanceof TileMap) {
        this.grid.push({
          id: tileIndex,
          collider: (tile as Tile).solid ? true : false,
          gCost: 0,
          hCost: 0,
          fCost: 0,
          x: tileIndex % this.tilemap.cols,
          y: Math.floor(tileIndex / this.tilemap.cols),
          checked: false,
          parent: null,
        });
        tileIndex++;
      } else {
        this.grid.push({
          id: tileIndex,
          collider: (tile as GraphTile).collider ? true : false,
          gCost: 0,
          hCost: 0,
          fCost: 0,
          x: tileIndex % this.tilemap.cols,
          y: Math.floor(tileIndex / this.tilemap.cols),
          checked: false,
          parent: null,
        });
        tileIndex++;
      }
    }
  }

  setCost() {
    if (this.startnode === null || this.endnode === null) return;
    if (this.grid.length === 0) return;
    for (const tile of this.grid) {
      tile.gCost = this.getGcost(tile, this.startnode);
      tile.hCost = this.getHcost(tile, this.endnode);
      tile.fCost = this.getFcost(tile);
    }
  }

  astar(sourcenode: aStarNode, endnode: aStarNode, diagonal = false): aStarNode[] {
    this.starttime = performance.now();
    this.startnode = sourcenode;
    this.endnode = endnode;
    this.goalReached = false;
    this.checkedNodes = [];
    this.openNodes = [];
    this.setCost();

    this.openNodes.push(this.startnode);

    while (this.openNodes.length > 0) {
      this.currentNode = this.openNodes[0];
      this.currentIndex = 0;

      // get lowest fCost in openNodes
      for (const node of this.openNodes) {
        if (node.fCost < this.currentNode.fCost) {
          this.currentNode = node;
          this.currentIndex = this.openNodes.indexOf(node);
        }
      }

      //remove current node from openNodes
      this.openNodes.splice(this.currentIndex, 1);
      //add to checked
      this.checkedNodes.push(this.currentNode);

      if (this.currentNode === this.endnode) {
        this.path = [];
        do {
          this.path.push(this.currentNode as aStarNode);
          this.currentNode = (this.currentNode as aStarNode).parent;
        } while (this.currentNode !== this.startnode);
        this.path = this.path.reverse();
        this.goalReached = true;
        this.endtime = performance.now();
        this.duration = this.endtime - this.starttime;
        return this.path;
      }

      const neighbors = this.getNeighbors(this.currentNode, diagonal);
      for (const neighbor of neighbors) {
        if (!this.checkedNodes.includes(neighbor)) {
          if (!this.openNodes.includes(neighbor) && !neighbor.collider) {
            neighbor.parent = this.currentNode;
            this.openNodes.push(neighbor);
          }
        }
      }
    }
    this.endtime = performance.now();
    this.duration = this.endtime - this.starttime;
    return [];
  }

  getNeighbors(node: aStarNode, diagonal: boolean): aStarNode[] {
    const neighbors: aStarNode[] = [];
    const index: number = typeof node.id === "string" ? parseInt(node.id) : node.id;

    //get neighbors
    //left/right tiles
    if (this.grid[index - 1] && index % this.tilemap.cols != 0) neighbors.push(this.grid[index - 1]);
    if (this.grid[index + 1] && index % this.tilemap.cols != this.tilemap.cols - 1) neighbors.push(this.grid[index + 1]);
    //up/down tiles
    if (this.grid[index - this.tilemap.cols]) neighbors.push(this.grid[index - this.tilemap.cols]);
    if (this.grid[index + this.tilemap.cols]) neighbors.push(this.grid[index + this.tilemap.cols]);

    //if diagonal
    if (diagonal) {
      if (this.grid[index - this.tilemap.cols - 1] && index % this.tilemap.cols != 0)
        neighbors.push(this.grid[index - this.tilemap.cols - 1]);
      if (this.grid[index - this.tilemap.cols + 1] && index % this.tilemap.cols != this.tilemap.cols - 1)
        neighbors.push(this.grid[index - this.tilemap.cols + 1]);
      if (this.grid[index + this.tilemap.cols - 1] && index % this.tilemap.cols != 0)
        neighbors.push(this.grid[index + this.tilemap.cols - 1]);
      if (this.grid[index + this.tilemap.cols + 1] && index % this.tilemap.cols != this.tilemap.cols - 1)
        neighbors.push(this.grid[index + this.tilemap.cols + 1]);
    }

    return neighbors;
  }

  getNodeByIndex(index: number): aStarNode {
    return this.grid[index];
  }

  getNodeByCoord(x: number, y: number): aStarNode {
    return this.grid[y * this.tilemap.cols + x];
  }

  getGcost(node: aStarNode, startnode: aStarNode): number {
    return Math.abs(node.x - startnode.x) + Math.abs(node.y - startnode.y);
  }
  getHcost(node: aStarNode, endnode: aStarNode): number {
    return Math.abs(node.x - endnode.x) + Math.abs(node.y - endnode.y);
  }
  getFcost(node: aStarNode): number {
    return node.gCost + node.hCost;
  }

  resetGrid() {
    for (const tile of this.grid) {
      tile.checked = false;
      tile.gCost = 0;
      tile.hCost = 0;
      tile.fCost = 0;
    }
    this.checkedNodes = [];
    this.startnode = null;
    this.endnode = null;
    this.goalReached = false;
  }
}
