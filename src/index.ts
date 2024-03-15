import { Loadable } from "excalibur";

type Node = {
  name: string;
  value?: any;
};
type Edge = {
  name: string;
  from: Node;
  to: Node;
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
  isLoaded(): boolean {
    return true;
  }

  load(): Promise<any> {
    return Promise.resolve();
  }
  key: boolean = false;
  nodes: Map<string, Node> = new Map();
  edges: Map<string, Edge> = new Map();

  addNode(node: Node) {
    this.nodes.set(node.name, node);
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

  addTileMap(tilemap: GraphTileMap) {
    tilemap.tiles.forEach((tile, index) => {
      //tile.collider === true ? this.addNode({ name: `${index}`, value: 1 }) : this.addNode({ name: `${index}`, value: 0 });
      if (!tile.collider) {
        this.addNode({ name: `${index}`, value: 0 });
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

  getAdjacentNodes(node: Node): Node[] {
    const adjacentNodes = this.getAdjacentEdges(node).map(edge => edge.to);
    const uniqueNames = Array.from(new Set(adjacentNodes.map(node => node.name)));
    return uniqueNames.map(name => this.nodes.get(name)!);
  }

  getAdjacentEdges(node: Node) {
    return [...this.edges.values()].filter(edge => edge.from === node).map(edge => edge);
  }

  getAdjacentEdgesTo(node: Node) {
    return [...this.edges.values()].filter(edge => edge.to === node).map(edge => edge);
  }

  bfs(startnode: Node, endnode: Node): boolean {
    const queue = [startnode];
    const visited = new Set();

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (!visited.has(current)) {
        visited.add(current);
        queue.push(...this.getAdjacentNodes(current));
      }
      if (current === endnode) {
        return true;
      }
    }

    return false;
  }

  dfs(startnode: Node, endnode: Node, visited = new Set()): boolean {
    const stack = [startnode];
    visited.add(startnode);
    const adjacentNodes = this.getAdjacentNodes(startnode);
    for (const node of adjacentNodes) {
      if (node === endnode) {
        return true;
      }
      if (!visited.has(node)) {
        if (this.dfs(node, endnode, visited)) {
          return true;
        }
      }
    }
    return false;
  }

  dijkstra(sourcenode: Node): Array<{ node: Node; distance: number; previous: Node | null }> {
    const visited: Node[] = [];
    const unvisited: Node[] = [];
    const resultArray: Array<{ node: Node; distance: number; previous: Node | null }> = [];

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
      let listOfAvailableNodes: Node[] = [];
      let listofAvailableEntries: Array<{ node: Node; distance: number; previous: Node | null }> = [];
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

    return resultArray;
  }

  shortestPath(startnode: Node, endnode: Node): Node[] {
    let dAnalysis = this.dijkstra(startnode);

    //iterate through dAnalysis to plot shortest path to endnode
    let path: Node[] = [];
    let current: Node | null | undefined = endnode;
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
