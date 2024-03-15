export class ExcaliburGraph {
    data;
    isLoaded() {
        return true;
    }
    load() {
        return Promise.resolve();
    }
    key = false;
    nodes = new Map();
    edges = new Map();
    addNode(node) {
        this.nodes.set(node.name, node);
    }
    addEdge(edge, bidirectional = false) {
        this.edges.set(edge.name, edge);
        if (bidirectional) {
            let newEdge = { name: `${edge.name}_reverse`, from: edge.to, to: edge.from };
            if (edge.value)
                Object.assign(newEdge, { value: edge.value });
            this.addEdge(newEdge);
        }
    }
    resetGraph() {
        this.nodes = new Map();
        this.edges = new Map();
    }
    addTileMap(tilemap) {
        tilemap.tiles.forEach((tile, index) => {
            if (!tile.collider) {
                this.addNode({ name: `${index}`, value: 0 });
            }
        });
        tilemap.tiles.forEach((tile, index) => {
            if (tilemap.tiles[index].collider)
                return;
            let neighbors = [];
            if (tilemap.tiles[index - 1] && index % tilemap.cols != 0)
                neighbors.push(index - 1);
            if (tilemap.tiles[index + 1] && index % tilemap.cols != tilemap.cols - 1)
                neighbors.push(index + 1);
            if (tilemap.tiles[index - tilemap.cols])
                neighbors.push(index - tilemap.cols);
            if (tilemap.tiles[index + tilemap.cols])
                neighbors.push(index + tilemap.cols);
            neighbors.forEach(neighbor => {
                if (tilemap.tiles[neighbor].collider != true) {
                    this.addEdge({
                        name: `${index}_${neighbor}`,
                        from: this.nodes.get(`${index}`),
                        to: this.nodes.get(`${neighbor}`),
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
    getAdjacentNodes(node) {
        const adjacentNodes = this.getAdjacentEdges(node).map(edge => edge.to);
        const uniqueNames = Array.from(new Set(adjacentNodes.map(node => node.name)));
        return uniqueNames.map(name => this.nodes.get(name));
    }
    getAdjacentEdges(node) {
        return [...this.edges.values()].filter(edge => edge.from === node).map(edge => edge);
    }
    getAdjacentEdgesTo(node) {
        return [...this.edges.values()].filter(edge => edge.to === node).map(edge => edge);
    }
    bfs(startnode, endnode) {
        const queue = [startnode];
        const visited = new Set();
        while (queue.length > 0) {
            const current = queue.shift();
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
    dfs(startnode, endnode, visited = new Set()) {
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
    dijkstra(sourcenode) {
        const visited = [];
        const unvisited = [];
        const resultArray = [];
        this.nodes.forEach(node => unvisited.push(node));
        this.nodes.forEach(node => resultArray.push({ node, distance: Infinity, previous: null }));
        const startingNodeIndex = resultArray.findIndex(node => node.node === sourcenode);
        if (startingNodeIndex === -1)
            return [];
        resultArray[startingNodeIndex].distance = 0;
        visited.push(sourcenode);
        unvisited.splice(unvisited.indexOf(sourcenode), 1);
        let current = sourcenode;
        let currentEdges = this.getAdjacentEdges(current);
        for (let i = 0; i < currentEdges.length; i++) {
            const edge = currentEdges[i];
            const index = resultArray.findIndex(node => node.node === edge.to);
            if (startingNodeIndex === -1)
                return [];
            resultArray[index].distance = edge.value;
            resultArray[index].previous = current;
        }
        while (unvisited.length > 0) {
            let listOfAvailableNodes = [];
            let listofAvailableEntries = [];
            listofAvailableEntries = resultArray.filter(node => unvisited.includes(node.node));
            listOfAvailableNodes = listofAvailableEntries.map(node => node.node);
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
            }
            else {
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
            currentEdges = currentEdges.filter(edge => {
                return !visited.includes(edge.from) && !visited.includes(edge.to);
            });
            visited.push(current);
            unvisited.splice(unvisited.indexOf(current), 1);
            for (let i = 0; i < currentEdges.length; i++) {
                const edge = currentEdges[i];
                const index = resultArray.findIndex(node => node.node === edge.to);
                const previousIndex = resultArray.findIndex(node => node.node === edge.from);
                const previousDistance = resultArray[previousIndex].distance;
                const cumDistance = (previousDistance + edge.value);
                if (cumDistance < resultArray[index].distance) {
                    resultArray[index].distance = cumDistance;
                    resultArray[index].previous = current;
                }
            }
        }
        return resultArray;
    }
    shortestPath(startnode, endnode) {
        let dAnalysis = this.dijkstra(startnode);
        let path = [];
        let current = endnode;
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
//# sourceMappingURL=index.js.map